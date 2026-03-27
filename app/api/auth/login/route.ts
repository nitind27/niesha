import { NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth"
import { authCookieOptions } from "@/lib/auth-cookies"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    const result = await authenticateUser(email, password)

    if (!result) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const response = NextResponse.json({
      user: result.user,
      token: result.token,
    })

    response.cookies.set(
      "token",
      result.token,
      authCookieOptions(60 * 60 * 24 * 7)
    )

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

