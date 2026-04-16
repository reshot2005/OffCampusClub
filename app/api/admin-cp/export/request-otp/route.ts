
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { generateSixDigitOtp, sha256Hex } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/smtp";
import { ACTIVITY_CATEGORIES, extractRequestIp, logActivityEvent } from "@/lib/activity-events";

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { email } = requestSchema.parse(await req.json());

    const purpose = "EXPORT";
    const otp = generateSixDigitOtp();
    const expectedHash = sha256Hex(`${purpose}:${email}:${otp}`);

    // Clean up old ones using raw query to bypass out-of-sync prisma client enum issues
    try {
      await prisma.$executeRaw`DELETE FROM email_otp_tokens WHERE email = ${email} AND purpose = ${purpose}::"OtpPurpose" AND "usedAt" IS NULL`;
    } catch (e) {
      console.error("Cleanup error:", e);
    }

    // Insert using raw query to bypass client-side enum validation
    const expiresAt = new Date(Date.now() + 5 * 60_000);
    const id = Math.random().toString(36).substring(2, 15); // Simple ID generation for raw insert if logic needs it

    await prisma.$executeRaw`
      INSERT INTO email_otp_tokens (id, email, purpose, "codeHash", "attemptsLeft", "expiresAt", "createdAt")
      VALUES (${id}, ${email}, ${purpose}::"OtpPurpose", ${expectedHash}, 5, ${expiresAt}, NOW())
    `;

    await sendOtpEmail({ to: email, code: otp, purpose: "ADMIN_LOGIN" as any });
    
    await logActivityEvent({
      actor: { userId: session.id, name: session.fullName, role: "ADMIN" },
      category: ACTIVITY_CATEGORIES.auth,
      eventType: "export_otp_requested",
      summary: `Admin requested export OTP for ${email}`,
      entityType: "user",
      entityId: session.id,
      ipAddress: extractRequestIp(req),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Export OTP Request Error:", err);
    return NextResponse.json({ error: "Failed to process security verification request. Ensure database is synced." }, { status: 500 });
  }
}
