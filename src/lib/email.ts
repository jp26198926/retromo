import nodemailer from "nodemailer";

/**
 * Email sending utility using nodemailer.
 *
 * SMTP configuration is read from environment variables:
 *   SMTP_HOST       — SMTP server hostname (e.g. smtp.gmail.com)
 *   SMTP_PORT       — SMTP port (e.g. 587 for TLS, 465 for SSL)
 *   SMTP_USER       — SMTP username
 *   SMTP_PASS       — SMTP password / app password
 *   SMTP_FROM       — "From" email address (defaults to SMTP_USER)
 *   SMTP_FROM_NAME  — "From" display name (defaults to app name from settings)
 *   SMTP_SECURE     — "true" to use SSL (port 465), omit for STARTTLS
 *
 * If SMTP_HOST is not set, emails are not sent (the function returns a
 * no-op result). This allows the app to run without an SMTP server in
 * development — the invitation token/link is still returned to the caller
 * so it can be displayed in the UI for testing.
 */

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  if (!host) return null;

  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  return transporter;
}

export function isEmailConfigured(): boolean {
  return !!process.env.SMTP_HOST;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ sent: boolean; error?: string }> {
  const transport = getTransporter();
  if (!transport) {
    // SMTP not configured — return a no-op so the caller can handle gracefully
    return { sent: false, error: "SMTP not configured" };
  }

  const fromName = process.env.SMTP_FROM_NAME || "RetroMo";
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@retromo.local";

  try {
    await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text,
    });
    return { sent: true };
  } catch (e) {
    console.error("[sendEmail]", e);
    return { sent: false, error: e instanceof Error ? e.message : "Failed to send email" };
  }
}

/**
 * Send a team invitation email. If the invited user doesn't have an account,
 * the email includes a registration link followed by the accept-invitation link.
 */
export async function sendTeamInvitationEmail({
  to,
  teamName,
  inviterName,
  acceptUrl,
  signUpUrl,
  hasAccount,
}: {
  to: string;
  teamName: string;
  inviterName: string;
  acceptUrl: string;
  signUpUrl: string;
  hasAccount: boolean;
}): Promise<{ sent: boolean; error?: string }> {
  const subject = `${inviterName} invited you to join "${teamName}" on RetroMo`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4f46e5;">You're invited to join "${teamName}"</h2>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">
        <strong>${inviterName}</strong> has invited you to collaborate on the team
        <strong>${teamName}</strong> on RetroMo.
      </p>
      ${
        hasAccount
          ? `<p style="color: #333; font-size: 16px; line-height: 1.5;">
               Click the button below to accept the invitation and join the team.
             </p>
             <div style="margin: 30px 0;">
               <a href="${acceptUrl}" style="background: #4f46e5; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                 Accept Invitation
               </a>
             </div>
             <p style="color: #666; font-size: 14px;">
               Or copy this link: <a href="${acceptUrl}">${acceptUrl}</a>
             </p>`
          : `<p style="color: #333; font-size: 16px; line-height: 1.5;">
               You don't have a RetroMo account yet. First, create your free account,
               then accept the invitation.
             </p>
             <div style="margin: 30px 0; display: flex; gap: 12px; flex-wrap: wrap;">
               <a href="${signUpUrl}" style="background: #4f46e5; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                 Create your account
               </a>
               <a href="${acceptUrl}" style="background: #fff; color: #4f46e5; border: 2px solid #4f46e5; padding: 10px 26px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                 Accept Invitation
               </a>
             </div>
             <p style="color: #666; font-size: 14px; line-height: 1.5;">
               After registering, click <a href="${acceptUrl}">this link</a> to join the team.
             </p>`
      }
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #999; font-size: 12px;">
        This invitation was sent by ${inviterName} via RetroMo. If you weren't expecting
        this invitation, you can safely ignore this email.
      </p>
    </div>
  `;

  const text = `${inviterName} invited you to join "${teamName}" on RetroMo.\n\n${
    hasAccount
      ? `Accept the invitation: ${acceptUrl}`
      : `Create your account first: ${signUpUrl}\nThen accept the invitation: ${acceptUrl}`
  }`;

  return sendEmail({ to, subject, html, text });
}
