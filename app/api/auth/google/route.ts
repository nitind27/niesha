import { NextRequest, NextResponse } from "next/server"

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

// Get redirect URI - use request origin for dynamic detection
function getRedirectUri(request: NextRequest): string {
  // Try to get from environment first
  const envUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL
  
  if (envUrl) {
    return `${envUrl}/api/auth/google/callback`
  }
  
  // Fallback to request origin
  const origin = request.nextUrl.origin
  return `${origin}/api/auth/google/callback`
}

export async function GET(request: NextRequest) {
  try {
    // Check if we have Google OAuth credentials
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { 
          error: "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables.",
          redirectUri: getRedirectUri(request),
          instructions: "Add this redirect URI to your Google Cloud Console: " + getRedirectUri(request)
        },
        { status: 500 }
      )
    }

    const redirectUri = getRedirectUri(request)
    const searchParams = request.nextUrl.searchParams
    const isRegister = searchParams.get("register") === "true"
    
    // Log the redirect URI for debugging (remove in production)
    console.log("🔍 Google OAuth Redirect URI:", redirectUri)
    console.log("🔍 Make sure this EXACT URI is added to Google Console")
    
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    // Build OAuth URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("scope", "openid email profile")
    authUrl.searchParams.set("state", state)
    authUrl.searchParams.set("access_type", "offline")
    authUrl.searchParams.set("prompt", "consent")
    
    // Store state and redirect URI in cookie for verification
    const response = NextResponse.redirect(authUrl.toString())

    // Set state and redirect URI in cookies for verification
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    })
    
    response.cookies.set("oauth_redirect_uri", redirectUri, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    })

    // Store register flag in cookie
    if (isRegister) {
      response.cookies.set("oauth_register", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 minutes
        path: "/",
      })
    }

    return response
  } catch (error) {
    console.error("Google OAuth error:", error)
    return NextResponse.json(
      { error: "Failed to initiate Google login" },
      { status: 500 }
    )
  }
}

