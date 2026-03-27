import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateToken, hashPassword } from "@/lib/auth"
import { authCookieOptions } from "@/lib/auth-cookies"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

// Get redirect URI - must match exactly what was sent in the initial request
function getRedirectUri(request: NextRequest): string {
  // First try to get from cookie (set during initial OAuth request)
  const storedRedirectUri = request.cookies.get("oauth_redirect_uri")?.value
  
  if (storedRedirectUri) {
    return storedRedirectUri
  }
  
  // Fallback to environment or request origin
  const envUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL
  if (envUrl) {
    return `${envUrl}/api/auth/google/callback`
  }
  
  // Last resort: use request origin
  const origin = request.nextUrl.origin
  return `${origin}/api/auth/google/callback`
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    // Check for OAuth errors
    if (error) {
      const errorDescription = searchParams.get("error_description") || ""
      let errorMessage = "Google authentication failed"
      
      if (error === "redirect_uri_mismatch") {
        const redirectUri = getRedirectUri(request)
        errorMessage = `Redirect URI mismatch. Please add this exact URI to your Google Cloud Console: ${redirectUri}`
      } else if (errorDescription) {
        errorMessage = errorDescription
      }
      
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorMessage)}`, request.url)
      )
    }

    // Verify state
    const storedState = request.cookies.get("oauth_state")?.value
    if (!state || state !== storedState) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("Invalid state parameter")}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("No authorization code received")}`, request.url)
      )
    }

    const redirectUri = getRedirectUri(request)

    // Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error("Token exchange error:", errorData)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("Failed to exchange token")}`, request.url)
      )
    }

    const tokens = await tokenResponse.json()
    const accessToken = tokens.access_token

    // Get user info from Google
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userResponse.ok) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("Failed to fetch user info")}`, request.url)
      )
    }

    const googleUser = await userResponse.json()

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        email: googleUser.email,
        isActive: true,
      },
      include: {
        role: true,
        school: true,
      },
    })

    // Check if this is a registration flow
    const isRegister = request.cookies.get("oauth_register")?.value === "true"

    // If user doesn't exist, create a new one
    if (!user) {
      // Get default role (student role for new registrations)
      const defaultRole = await prisma.role.findFirst({
        where: { name: "student" },
      })

      if (!defaultRole) {
        const errorPage = isRegister ? "/register" : "/login"
        return NextResponse.redirect(
          new URL(`${errorPage}?error=${encodeURIComponent("Default role not found")}`, request.url)
        )
      }

      // Create new user with Google data
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          firstName: googleUser.given_name || "",
          lastName: googleUser.family_name || "",
          avatar: googleUser.picture || null,
          roleId: defaultRole.id,
          isActive: true,
          language: "en",
          // Generate a random password (user won't need it for Google login)
          password: await hashPassword(Math.random().toString(36) + Date.now().toString()),
        },
        include: {
          role: true,
          school: true,
        },
      })
    } else {
      // Update last login and avatar if changed
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          lastLoginAt: new Date(),
          avatar: googleUser.picture || user.avatar,
        },
      })
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      schoolId: user.schoolId || undefined,
      role: user.role.name,
    })

    // Create response with redirect
    const redirectUrl = new URLSearchParams(request.nextUrl.search).get("redirect") ||
      (user.role.name === "super_admin" ? "/admin/super" : "/dashboard")

    const response = NextResponse.redirect(new URL(redirectUrl, request.url))

    // Set auth cookie
    response.cookies.set("token", token, authCookieOptions(60 * 60 * 24 * 7))

    // Clear OAuth cookies
    response.cookies.delete("oauth_state")
    response.cookies.delete("oauth_redirect_uri")
    response.cookies.delete("oauth_register")

    return response
  } catch (error) {
    console.error("Google OAuth callback error:", error)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("Authentication failed")}`, request.url)
    )
  }
}

