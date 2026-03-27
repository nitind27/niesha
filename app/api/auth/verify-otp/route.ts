import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp } = schema.parse(body)

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

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
