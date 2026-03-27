import { NextRequest, NextResponse } from "next/server"

// Debug endpoint to show what redirect URI is being used
export async function GET(request: NextRequest) {
  const envUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL
  const origin = request.nextUrl.origin
  
  const redirectUri = envUrl 
    ? `${envUrl}/api/auth/google/callback`
    : `${origin}/api/auth/google/callback`

  return NextResponse.json({
    message: "Google OAuth Debug Information",
    redirectUri: redirectUri,
    instructions: [
      "1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials",
      "2. Select your OAuth 2.0 Client ID",
      "3. Add the redirect URI above to 'Authorized redirect URIs'",
      "4. Make sure the URI matches EXACTLY (including http/https, trailing slashes, etc.)",
      "5. Click Save",
      "6. Wait a few minutes for changes to propagate",
    ],
    environment: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "Not set",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "Not set",
      requestOrigin: origin,
    },
    googleOAuthConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  })
}

