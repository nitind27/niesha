import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "./lib/auth"
import { clearAuthCookieOptions } from "./lib/auth-cookies"
import { getRoutePermission, canAccessRoute } from "./lib/route-permissions"
import { PERMISSIONS, ROLE_PERMISSIONS } from "./lib/permissions"
import { prisma } from "./lib/prisma"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  const { pathname } = request.nextUrl

  // Static files and Next.js internals - allow without auth
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    (pathname.includes(".") && !pathname.startsWith("/api"))
  ) {
    return NextResponse.next()
  }

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register", "/forgot-password"]
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route))
  
  // API routes
  const isApiRoute = pathname.startsWith("/api")
  
  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // If API auth route (login, logout, me), allow without token check
  if (isApiRoute && pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }
  
  // Protect all other routes (non-public, non-API auth)
  // This includes dashboard, admin, and any other routes
  if (!isPublicRoute) {
    if (!token) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Verify token for all protected routes
    const payload = verifyToken(token)
    if (!payload) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      // Clear invalid token cookie
      const response = NextResponse.redirect(loginUrl)
      response.cookies.set("token", "", clearAuthCookieOptions())
      return response
    }

    // For API routes (non-auth), add user info to headers
    if (isApiRoute) {
      // Add user info to request headers for server components
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set("x-user-id", payload.userId)
      requestHeaders.set("x-role", payload.role)
      requestHeaders.set("x-school-id", payload.schoolId || "")

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }

    // For dashboard/admin routes, check permissions
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
      // Super admin can access everything
      if (payload.role === "super_admin") {
        return NextResponse.next()
      }

      // Check permissions for route access
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          include: { role: true },
        })

        if (!user || !user.isActive) {
          const loginUrl = new URL("/login", request.url)
          // Clear invalid user cookie
          const response = NextResponse.redirect(loginUrl)
          response.cookies.set("token", "", clearAuthCookieOptions())
          return response
        }

        // Parse permissions from role
        let permissions: string[] = []
        if (user.role.permissions) {
          if (Array.isArray(user.role.permissions)) {
            permissions = user.role.permissions.filter((p): p is string => typeof p === 'string' && p !== null)
          } else if (typeof user.role.permissions === 'string') {
            try {
              const parsed = JSON.parse(user.role.permissions)
              permissions = Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string' && p !== null) : []
            } catch {
              permissions = []
            }
          }
        }

        // Merge with role defaults (same logic as /api/auth/me)
        // This ensures users created without a plan still get their role's default permissions
        const roleDefaults = (ROLE_PERMISSIONS[user.role.name] ?? []) as string[]
        permissions = [...new Set([...roleDefaults, ...permissions])]

        // Check if user has permission for this route
        if (!canAccessRoute(permissions, pathname)) {
          // Redirect to dashboard if no permission
          return NextResponse.redirect(new URL("/dashboard", request.url))
        }
      } catch (error) {
        // If error fetching user, redirect to login
        console.error("Middleware permission check error:", error)
        const loginUrl = new URL("/login", request.url)
        const response = NextResponse.redirect(loginUrl)
        response.cookies.set("token", "", clearAuthCookieOptions())
        return response
      }

      // Role-based route protection (fallback)
      if (pathname.startsWith("/admin/super") && payload.role !== "super_admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
