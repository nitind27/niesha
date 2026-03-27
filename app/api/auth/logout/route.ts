import { NextRequest, NextResponse } from "next/server"
import { clearAuthCookieOptions } from "@/lib/auth-cookies"

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ message: "Logged out successfully" })

  response.cookies.set("token", "", clearAuthCookieOptions())
  
  return response
}

