
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { sha256Hex } from "@/lib/otp";
import { signAuthToken } from "@/lib/jwt";
import { ACTIVITY_CATEGORIES, extractRequestIp, logActivityEvent } from "@/lib/activity-events";

const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { email, otp } = verifySchema.parse(await req.json());

    const purpose = "EXPORT";
    
    // Using raw query to fetch the record to bypass client-side enum validation
    const records: any[] = await prisma.$queryRaw`
      SELECT * FROM email_otp_tokens 
      WHERE email = ${email} 
      AND purpose = ${purpose}::"OtpPurpose" 
      AND "usedAt" IS NULL 
      AND "expiresAt" > NOW() 
      LIMIT 1
    `;

    const record = records[0];

    if (!record) {
      return NextResponse.json({ error: "OTP expired or not found" }, { status: 400 });
    }

    const expectedHash = sha256Hex(`${purpose}:${email}:${otp}`);
    if (record.codeHash !== expectedHash) {
      await prisma.$executeRaw`
        UPDATE email_otp_tokens 
        SET "attemptsLeft" = "attemptsLeft" - 1 
        WHERE id = ${record.id}
      `;
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
    }

    // Mark as used
    await prisma.$executeRaw`
      UPDATE email_otp_tokens 
      SET "usedAt" = NOW() 
      WHERE id = ${record.id}
    `;

    // Create a temporary export token (valid for 10 minutes)
    const exportToken = await signAuthToken(
      { 
        userId: session.id, 
        email: session.email, 
        role: "ADMIN",
        targetEmail: email 
      }, 
      { expiresIn: "10m" }
    );

    await logActivityEvent({
      actor: { userId: session.id, name: session.fullName, role: "ADMIN" },
      category: ACTIVITY_CATEGORIES.auth,
      eventType: "export_otp_verified",
      summary: `Admin verified export via personal email: ${email}`,
      entityType: "user",
      entityId: session.id,
      ipAddress: extractRequestIp(req),
    });

    return NextResponse.json({ success: true, exportToken });
  } catch (err: any) {
    console.error("Export OTP Verification Error:", err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
