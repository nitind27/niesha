import nodemailer from "nodemailer"

export type WelcomeEmailResult =
  | { sent: true }
  | { sent: false; reason: "smtp_not_configured" | "send_failed"; message?: string }

export function isSmtpConfigured(): boolean {
  const host = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.trim()
  return Boolean(host && user && pass)
}

/** Public app URL (no trailing slash). */
export function appBaseUrl(): string {
  const u = process.env.NEXTAUTH_URL?.trim()
  if (u) return u.replace(/\/$/, "")
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`
  }
  return "http://localhost:3000"
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function sendNewAdminWelcomeEmail(params: {
  to: string
  firstName: string
  loginUrl: string
  roleDisplayName?: string
  tenantName?: string | null
  /** Only when known at create time; never logged. */
  plainPassword?: string
}): Promise<WelcomeEmailResult> {
  if (!isSmtpConfigured()) {
    return { sent: false, reason: "smtp_not_configured" }
  }

  const host = process.env.SMTP_HOST!.trim()
  const port = parseInt(process.env.SMTP_PORT || "587", 10)
  const secure =
    process.env.SMTP_SECURE === "true" ||
    process.env.SMTP_SECURE === "1" ||
    port === 465

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER!.trim(),
      pass: process.env.SMTP_PASS!.trim(),
    },
  })

  const fromRaw = process.env.EMAIL_FROM?.trim() || process.env.SMTP_USER!.trim()
  const subject = "Your admin account — sign in"

  const lines: string[] = [
    `Hello ${params.firstName},`,
    "",
    "An administrator created an account for you on Codeat ERP.",
    "",
    `Sign-in page: ${params.loginUrl}`,
    `Email (login): ${params.to}`,
  ]

  if (params.roleDisplayName) {
    lines.push(`Role: ${params.roleDisplayName}`)
  }
  if (params.tenantName) {
    lines.push(`Organization: ${params.tenantName}`)
  }

  if (params.plainPassword) {
    lines.push("")
    lines.push("Password (set when your account was created — change after first login):")
    lines.push(params.plainPassword)
  } else {
    lines.push("")
    lines.push("Use the password your administrator shared with you.")
  }

  lines.push("", "If you did not expect this email, you can ignore it.")

  const text = lines.join("\n")

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <p>Hello ${escapeHtml(params.firstName)},</p>
  <p>An administrator created an account for you on <strong>Codeat ERP</strong>.</p>
  <p><a href="${escapeHtml(params.loginUrl)}">Open sign-in page</a></p>
  <ul>
    <li><strong>Email:</strong> ${escapeHtml(params.to)}</li>
    ${params.roleDisplayName ? `<li><strong>Role:</strong> ${escapeHtml(params.roleDisplayName)}</li>` : ""}
    ${params.tenantName ? `<li><strong>Organization:</strong> ${escapeHtml(params.tenantName)}</li>` : ""}
  </ul>
  ${
    params.plainPassword
      ? `<p><strong>Password</strong> (change after first login): <code>${escapeHtml(params.plainPassword)}</code></p>`
      : "<p>Use the password your administrator shared with you.</p>"
  }
  <p style="font-size: 0.9em; color: #555;">If you did not expect this email, you can ignore it.</p>
</body>
</html>`

  try {
    await transporter.sendMail({
      from: fromRaw,
      to: params.to,
      subject,
      text,
      html,
    })
    return { sent: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[mail] sendNewAdminWelcomeEmail failed:", msg)
    return {
      sent: false,
      reason: "send_failed",
      message: process.env.NODE_ENV === "development" ? msg : undefined,
    }
  }
}

export async function sendSubscriptionWelcomeEmail(params: {
  to: string
  firstName: string
  schoolName: string
  planName: string
  loginUrl: string
  dashboardUrl: string
  billingPeriod: string
  amount: number
  transactionId?: string
}): Promise<WelcomeEmailResult> {
  if (!isSmtpConfigured()) {
    return { sent: false, reason: "smtp_not_configured" }
  }

  const host = process.env.SMTP_HOST!.trim()
  const port = parseInt(process.env.SMTP_PORT || "587", 10)
  const secure = process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1" || port === 465

  const transporter = nodemailer.createTransport({
    host, port, secure,
    auth: { user: process.env.SMTP_USER!.trim(), pass: process.env.SMTP_PASS!.trim() },
  })

  const fromRaw = process.env.EMAIL_FROM?.trim() || process.env.SMTP_USER!.trim()
  const subject = `Welcome to ${params.planName} — Your school is ready!`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5,#0ea5e9);padding:40px 40px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">🎉 Welcome Aboard!</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:16px;">Your school management platform is ready</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 20px;font-size:16px;color:#475569;">Hello <strong>${escapeHtml(params.firstName)}</strong>,</p>
            <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
              Your subscription is confirmed and your school <strong style="color:#1e293b;">${escapeHtml(params.schoolName)}</strong> is now live on the <strong style="color:#7c3aed;">${escapeHtml(params.planName)}</strong> plan.
            </p>

            <!-- Plan Details Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Subscription Details</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#64748b;">Plan</td>
                    <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e293b;text-align:right;">${escapeHtml(params.planName)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#64748b;">Billing</td>
                    <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e293b;text-align:right;">${escapeHtml(params.billingPeriod)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#64748b;">Amount Paid</td>
                    <td style="padding:6px 0;font-size:14px;font-weight:700;color:#7c3aed;text-align:right;">₹${params.amount.toLocaleString("en-IN")}</td>
                  </tr>
                  ${params.transactionId ? `<tr>
                    <td style="padding:6px 0;font-size:14px;color:#64748b;">Transaction ID</td>
                    <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;text-align:right;font-family:monospace;">${escapeHtml(params.transactionId)}</td>
                  </tr>` : ""}
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#64748b;">Login Email</td>
                    <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e293b;text-align:right;">${escapeHtml(params.to)}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td align="center">
                <a href="${escapeHtml(params.dashboardUrl)}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 36px;border-radius:10px;box-shadow:0 4px 14px rgba(124,58,237,0.35);">
                  Open Your Dashboard →
                </a>
              </td></tr>
            </table>

            <p style="margin:0 0 8px;font-size:14px;color:#64748b;">Or copy this link: <a href="${escapeHtml(params.dashboardUrl)}" style="color:#7c3aed;">${escapeHtml(params.dashboardUrl)}</a></p>
            <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">If you have any questions, reply to this email or contact our support team.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f1f5f9;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Codeat ERP. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    await transporter.sendMail({ from: fromRaw, to: params.to, subject, html, text: `Welcome ${params.firstName}! Your ${params.planName} plan is active. Dashboard: ${params.dashboardUrl}` })
    return { sent: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[mail] sendSubscriptionWelcomeEmail failed:", msg)
    return { sent: false, reason: "send_failed", message: process.env.NODE_ENV === "development" ? msg : undefined }
  }
}

export async function sendStudentWelcomeEmail(params: {
  to: string
  firstName: string
  lastName: string
  admissionNumber: string
  schoolName: string
  loginUrl: string
  defaultPassword: string
}): Promise<WelcomeEmailResult> {
  if (!isSmtpConfigured()) {
    return { sent: false, reason: "smtp_not_configured" }
  }

  const host = process.env.SMTP_HOST!.trim()
  const port = parseInt(process.env.SMTP_PORT || "587", 10)
  const secure = process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1" || port === 465

  const transporter = nodemailer.createTransport({
    host, port, secure,
    auth: { user: process.env.SMTP_USER!.trim(), pass: process.env.SMTP_PASS!.trim() },
  })

  const fromRaw = process.env.EMAIL_FROM?.trim() || process.env.SMTP_USER!.trim()
  const subject = `Welcome to ${escapeHtml(params.schoolName)} — Your student account is ready`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;">🎓 Welcome, ${escapeHtml(params.firstName)}!</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">${escapeHtml(params.schoolName)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;font-size:15px;color:#475569;">
              Hello <strong>${escapeHtml(params.firstName)} ${escapeHtml(params.lastName)}</strong>,
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
              Your student account has been created at <strong>${escapeHtml(params.schoolName)}</strong>.
              You can now log in to view your classes, exams, results, attendance, and fees.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:10px;margin-bottom:28px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Your Login Details</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#64748b;">Admission No.</td>
                    <td style="padding:6px 0;font-size:14px;font-weight:700;color:#1e293b;text-align:right;">${escapeHtml(params.admissionNumber)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#64748b;">Login Email</td>
                    <td style="padding:6px 0;font-size:14px;font-weight:600;color:#1e293b;text-align:right;">${escapeHtml(params.to)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:14px;color:#64748b;">Password</td>
                    <td style="padding:6px 0;font-size:14px;font-weight:700;color:#3b82f6;text-align:right;font-family:monospace;">${escapeHtml(params.defaultPassword)}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr><td align="center">
                <a href="${escapeHtml(params.loginUrl)}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 32px;border-radius:10px;">
                  Login to Your Account →
                </a>
              </td></tr>
            </table>

            <p style="margin:0;font-size:12px;color:#94a3b8;">Please change your password after your first login for security.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f1f5f9;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} ${escapeHtml(params.schoolName)}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const text = `Welcome ${params.firstName} ${params.lastName}!\n\nYour student account at ${params.schoolName} is ready.\n\nAdmission No: ${params.admissionNumber}\nLogin Email: ${params.to}\nPassword: ${params.defaultPassword}\n\nLogin: ${params.loginUrl}\n\nPlease change your password after first login.`

  try {
    await transporter.sendMail({ from: fromRaw, to: params.to, subject, html, text })
    return { sent: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[mail] sendStudentWelcomeEmail failed:", msg)
    return { sent: false, reason: "send_failed", message: process.env.NODE_ENV === "development" ? msg : undefined }
  }
}
