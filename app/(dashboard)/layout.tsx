"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Sidebar } from "@/components/layouts/sidebar"
import { TopNav } from "@/components/layouts/top-nav"
import { useAuthInit, useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/lib/auth-guard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useAuthInit()
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Redirect super_admin away from regular dashboard routes to super admin panel
  useEffect(() => {
    if (!isLoading && user?.role === "super_admin" && pathname.startsWith("/dashboard")) {
      router.push("/admin/super")
    }
  }, [user, isLoading, pathname, router])

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-y-auto bg-muted/30">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}

