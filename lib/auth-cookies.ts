/**
 * Auth cookie options shared by login, register, OAuth, and middleware.
 *
 * Secure=true on plain HTTP (common with IP-based production) prevents the
 * browser from storing the cookie — users appear logged out immediately.
 * Set NEXTAUTH_URL to https://... or COOKIE_SECURE=false for HTTP deployments.
 */
export function authCookieSecure(): boolean {
  const v = process.env.COOKIE_SECURE?.toLowerCase()
  if (v === "true" || v === "1") return true
  if (v === "false" || v === "0") return false
  const base = (process.env.NEXTAUTH_URL || "").trim()
  if (base.startsWith("https://")) return true
  if (base.startsWith("http://")) return false
  return process.env.NODE_ENV === "production"
}

export function authCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: authCookieSecure(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  }
}

export function clearAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: authCookieSecure(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  }
}
