import nodemailer from "nodemailer";
import { Resend } from "resend";

export type OtpEmailPurpose = "REGISTER" | "RESET_PASSWORD";

async function sendEmailInternal(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const { RESEND_API_KEY, RESEND_FROM, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } =
    process.env;

  if (RESEND_API_KEY) {
    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: RESEND_FROM || SMTP_FROM || "OCC <onboarding@resend.dev>",
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return;
  }

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error("No email provider configured. Set RESEND_API_KEY or SMTP_* env vars.");
  }

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
    subject: params.subject,
    text: params.text,
    html: params.html,
  });
}

export async function sendOtpEmail(params: {
  to: string;
  code: string;
  purpose: OtpEmailPurpose;
}) {
  const subject =
    params.purpose === "REGISTER"
      ? "Your OCC registration OTP"
      : "Your OCC password reset OTP";

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

  await sendEmailInternal({ to: params.to, subject, text, html });
}

export async function sendSecurityAlert(params: {
  userEmail: string;
  userName: string;
  ip: string;
  userAgent: string;
}) {
  const subject = "⚠️ SECURITY ALERT: Admin login detected";
  const to = process.env.SMTP_USER || "aksharaenterprisesintern@gmail.com"; 

  const text = 
    `SECURITY ALERT\n\n` +
    `An administrator account has logged in to OffCampusClub.\n\n` +
    `User: ${params.userName} (${params.userEmail})\n` +
    `IP Address: ${params.ip}\n` +
    `Device: ${params.userAgent}\n` +
    `Time: ${new Date().toLocaleString()}\n\n` +
    `If this was not you, please change your password immediately and revoke active sessions.`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;border:2px solid #ff4d4d;padding:24px;border-radius:16px;max-width:500px">
      <h2 style="margin:0 0 12px;color:#ff4d4d">⚠️ Security Alert</h2>
      <p style="margin:0 0 16px">An administrator account just logged in.</p>
      <div style="background:#f9f9f9;padding:16px;border-radius:12px;margin-bottom:16px">
        <p style="margin:0"><b>User:</b> ${params.userName} (${params.userEmail})</p>
        <p style="margin:8px 0 0"><b>IP Address:</b> ${params.ip}</p>
        <p style="margin:8px 0 0"><b>Device:</b> ${params.userAgent}</p>
        <p style="margin:8px 0 0"><b>Time:</b> ${new Date().toLocaleString()}</p>
      </div>
      <p style="margin:0;font-size:13px;color:#666">If this was not you, please <b>change your password immediately</b> in the OCC dashboard.</p>
    </div>
  `;

  await sendEmailInternal({ to, subject, text, html });
}

export async function sendExportNotification(params: {
  adminEmail: string;
  adminName: string;
  targetEmail: string;
  type: string;
  ip: string;
}) {
  const subject = `📥 EXPORT LOG: ${params.type} data downloaded`;
  // The "SMTP owner" is the SMTP_USER/From email typically
  const to = process.env.SMTP_USER || "aksharaenterprisesintern@gmail.com";

  const text =
    `DATA EXPORT LOG\n\n` +
    `An admin has downloaded platform data.\n\n` +
    `Admin: ${params.adminName} (${params.adminEmail})\n` +
    `Verified via personal email: ${params.targetEmail}\n` +
    `Data Category: ${params.type}\n` +
    `IP Address: ${params.ip}\n` +
    `Time: ${new Date().toLocaleString()}\n`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;border:2px solid #5227FF;padding:24px;border-radius:16px;max-width:500px">
      <h2 style="margin:0 0 12px;color:#5227FF">📥 Data Export Notification</h2>
      <p style="margin:0 0 16px">An administrator has just exported platform data.</p>
      <div style="background:#f9f9f9;padding:16px;border-radius:12px;margin-bottom:16px">
        <p style="margin:0"><b>Admin:</b> ${params.adminName} (${params.adminEmail})</p>
        <p style="margin:8px 0 0"><b>Personal Verification Email:</b> ${params.targetEmail}</p>
        <p style="margin:8px 0 0"><b>Data Category:</b> <span style="text-transform:uppercase">${params.type}</span></p>
        <p style="margin:8px 0 0"><b>IP Address:</b> ${params.ip}</p>
        <p style="margin:8px 0 0"><b>Time:</b> ${new Date().toLocaleString()}</p>
      </div>
      <p style="margin:0;font-size:13px;color:#666">This log was automatically generated for audit purposes.</p>
    </div>
  `;

  await sendEmailInternal({ to, subject, text, html });
}


