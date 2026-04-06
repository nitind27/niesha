"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthInit, useAuth } from "@/hooks/useAuth"
import { StaffPortalSidebar } from "@/components/staff/staff-portal-sidebar"
import { TopNav } from "@/components/layouts/top-nav"

const STAFF_ROLES = ["teacher", "principal", "accountant", "hr_manager", "librarian", "transport_manager"]

export default function StaffPortalLayout({ children }: { children: React.ReactNode }) {
  useAuthInit()
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) { router.replace("/login"); return }
    if (user.role === "super_admin") { router.replace("/admin/super"); return }
    if (user.role === "school_admin") { router.replace("/dashboard"); return }
    if (user.role === "student") { router.replace("/student"); return }
  }, [user, isLoading, router])

  if (isLoading || !user || !STAFF_ROLES.includes(user.role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <StaffPortalSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
