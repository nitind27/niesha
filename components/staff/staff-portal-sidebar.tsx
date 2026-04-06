"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useSiteSettings } from "@/lib/site-settings-context"
import {
  LayoutDashboard, User, GraduationCap, BookOpen,
  Calendar, Megaphone, ClipboardList,
} from "lucide-react"

const NAV = [
  { href: "/staff-portal", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/staff-portal/profile", label: "My Profile", icon: User },
  { href: "/staff-portal/classes", label: "My Classes", icon: GraduationCap },
  { href: "/staff-portal/subjects", label: "My Subjects", icon: BookOpen },
  { href: "/staff-portal/attendance", label: "My Attendance", icon: Calendar },
  { href: "/staff-portal/exams", label: "Exams", icon: ClipboardList },
  { href: "/staff-portal/announcements", label: "Announcements", icon: Megaphone },
]

export function StaffPortalSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const site = useSiteSettings()

  return (
    <div className="flex h-full w-64 flex-col border-r border-border/50 bg-gradient-to-b from-card via-card to-muted/30 shadow-lg">
      <div className="flex h-16 items-center border-b border-border/50 px-6 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent">
        <div className="flex items-center gap-2">
          {site.site_logo_url ? (
            <img src={site.site_logo_url} alt={site.site_name} className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white text-xs font-bold">
              {site.site_name.charAt(0)}
            </div>
          )}
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-foreground leading-tight truncate max-w-[9rem]">
              {user?.school?.name ?? site.site_name}
            </h2>
            <p className="text-xs text-muted-foreground">Staff Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border/50 p-4">
        <div className="text-xs text-muted-foreground text-center">
          <p>{user?.firstName} {user?.lastName}</p>
          <p className="text-muted-foreground/60 capitalize">{user?.role?.replace("_", " ")}</p>
        </div>
      </div>
    </div>
  )
}
