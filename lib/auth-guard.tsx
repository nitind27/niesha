"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: string
  allowedRoles?: string[]
}

export function AuthGuard({ children, requiredRole, allowedRoles }: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (!isLoading) {
      if (!user) {
        const currentPath = window.location.pathname
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
        return
      }

      if (requiredRole && user.role !== requiredRole) {
        router.push("/dashboard")
        return
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.push("/dashboard")
        return
      }
    }
  }, [user, isLoading, router, requiredRole, allowedRoles])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if redirecting
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (requiredRole && user.role !== requiredRole) {
    return null
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}

