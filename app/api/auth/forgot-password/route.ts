import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isSmtpConfigured, appBaseUrl } from "@/lib/mail"
import nodemailer from "nodemailer"
import { z } from "zod"

const schema = z.object({ email: z.string().email() })

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = schema.parse(body)

    // Always return success to avoid email enumeration
    const user = await prisma.user.findFirst({
      where: { email, isActive: true },
    })

    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Invalidate previous OTPs for this email
    await prisma.passwordResetOtp.updateMany({
      where: { email, used: false },
      data: { used: true },
    })

    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await prisma.passwordResetOtp.create({
      data: { email, otp, expiresAt },
    })

    if (isSmtpConfigured()) {
      const host = process.env.SMTP_HOST!.trim()
      const port = parseInt(process.env.SMTP_PORT || "587", 10)
      const secure = process.env.SMTP_SECURE === "true" || port === 465

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER!.trim(),
          pass: process.env.SMTP_PASS!.trim(),
        },
      })

      const from = process.env.EMAIL_FROM?.trim() || process.env.SMTP_USER!.trim()

      await transporter.sendMail({
        from,
        to: email,
        subject: "Your password reset OTP",
        text: `Your OTP is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#111;margin-bottom:8px">Password Reset</h2>
            <p style="color:#555">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
            <div style="background:#f4f4f5;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
              <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#111">${otp}</span>
            </div>
            <p style="color:#888;font-size:13px">If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      })
    } else {
      // Dev fallback — log to console
      console.log(`[forgot-password] OTP for ${email}: ${otp}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }
    console.error("[forgot-password]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
