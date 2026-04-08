import nodemailer from "nodemailer";
import { Resend } from "resend";

export type OtpEmailPurpose = "REGISTER" | "RESET_PASSWORD" | "ADMIN_LOGIN";

export async function sendOtpEmail(params: {
  to: string;
  code: string;
  purpose: OtpEmailPurpose;
}) {
  const subject =
    params.purpose === "REGISTER"
      ? "Your OCC registration OTP"
      : params.purpose === "RESET_PASSWORD"
        ? "Your OCC password reset OTP"
        : "Your OCC admin login OTP";

  const text =
    `Your 6-digit OTP is: ${params.code}\n\n` +
    `It will expire in 10 minutes.\n\n` +
    `If you didn't request this, you can ignore this email.`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <h2 style="margin:0 0 12px">OCC verification code</h2>
      <p style="margin:0 0 12px">Your 6-digit OTP is:</p>
      <div style="display:inline-block;padding:12px 16px;border-radius:12px;background:#111;color:#fff;font-size:24px;font-weight:700;letter-spacing:6px">
        ${params.code}
      </div>
      <p style="margin:16px 0 0">It expires in 10 minutes.</p>
      <p style="margin:8px 0 0;color:#666">If you didn't request this, you can ignore this email.</p>
    </div>
  `;

  const { RESEND_API_KEY, RESEND_FROM, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } =
    process.env;

  if (RESEND_API_KEY) {
    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: RESEND_FROM || SMTP_FROM || "OCC <onboarding@resend.dev>",
      to: params.to,
      subject,
      text,
      html,
    });
    return;
  }

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error("No email provider configured. Set RESEND_API_KEY or SMTP_* env vars.");
  }

  // Gmail app passwords never contain whitespace; some users paste with spaces.
  const sanitizedPass = SMTP_PASS.replace(/\s+/g, "");
  const port = Number(SMTP_PORT);
  const secure = port === 465;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: {
      user: SMTP_USER,
      pass: sanitizedPass,
    },
  });

  await transporter.sendMail({
    from: SMTP_FROM,
    to: params.to,
    subject,
    text,
    html,
  });
}

