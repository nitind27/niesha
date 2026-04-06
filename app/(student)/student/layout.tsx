"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthInit, useAuth } from "@/hooks/useAuth"
import { StudentSidebar } from "@/components/student/student-sidebar"
import { TopNav } from "@/components/layouts/top-nav"

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  useAuthInit()
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (user.role !== "student") {
      router.replace(user.role === "super_admin" ? "/admin/super" : "/dashboard")
    }
  }, [user, isLoading, router])

  // Show spinner while loading or redirecting
  if (isLoading || !user || user.role !== "student") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <StudentSidebar />
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
