import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp, password } = schema.parse(body)

    const record = await prisma.passwordResetOtp.findFirst({
      where: { email, otp, used: false },
      orderBy: { createdAt: "desc" },
    })

    if (!record) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
    }

    if (record.expiresAt < new Date()) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 })
    }

    const hashed = await hashPassword(password)

    // Update all matching users (handles multi-tenant same email edge case)
    await prisma.user.updateMany({
      where: { email, isActive: true },
      data: { password: hashed },
    })

    // Mark OTP as used
    await prisma.passwordResetOtp.update({
      where: { id: record.id },
      data: { used: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("[reset-password]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
