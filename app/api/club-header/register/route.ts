import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { ensureOccDefaultClubs } from "@/lib/occDefaultClubs";
import { pusherServer } from "@/lib/pusher";
import { clubHeaderRegisterSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Server is not configured (database). Contact support." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const payload = clubHeaderRegisterSchema.parse(body);

    await ensureOccDefaultClubs(prisma);

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: payload.email }, { phoneNumber: payload.phoneNumber }] },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email or phone already exists. Try logging in instead." },
        { status: 409 }
      );
    }

    const club = await prisma.club.findUnique({
      where: { slug: payload.clubSlug },
    });
    if (!club) {
      return NextResponse.json(
        { error: "Invalid club selection. Refresh the page and try again." },
        { status: 404 }
      );
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);

    const user = await prisma.user.create({
      data: {
        fullName: payload.fullName,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        collegeName: payload.collegeName,
        password: passwordHash,
        role: "CLUB_HEADER",
        approvalStatus: "PENDING",
        bio: payload.experience,
        city: payload.instagramHandle ? `Instagram: ${payload.instagramHandle}` : undefined,
        pendingLeadClubId: club.id,
      },
      select: { id: true, fullName: true, email: true },
    });

    try {
      await pusherServer.trigger("admin", "new-application", {
        application: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          club: payload.clubSlug,
        },
      });
    } catch (pusherErr) {
      console.warn("[club-header/register] Pusher notification failed (non-critical):", pusherErr);
    }

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid form data" },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "An account with this email or phone already exists. Try logging in instead." },
          { status: 409 }
        );
      }
    }

    console.error("[club-header/register] error", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
