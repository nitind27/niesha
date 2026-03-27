"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/useLanguage"
import { useAuth } from "@/hooks/useAuth"
import { canAccessRoute } from "@/lib/route-permissions"
import { PERMISSIONS } from "@/lib/permissions"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  Calendar,
  DollarSign,
  Library,
  Bus,
  Megaphone,
  BarChart3,
  Settings,
  School,
  Shield,
  CreditCard,
  Building2,
  LayoutGrid,
  Contact2,
  Package,
  FolderKanban,
  FileStack,
  Settings2,
} from "lucide-react"

import { useSiteSettings } from "@/lib/site-settings-context"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requiredPermission?: string
  roles?: string[] // Keep for backward compatibility
}}

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { user } = useAuth()
  const site = useSiteSettings()

  const navItems: NavItem[] = [
    { title: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard, requiredPermission: PERMISSIONS.SETTINGS_READ },
    // Super Admin menu items
    { title: "Dashboard", href: "/admin/super", icon: LayoutDashboard, requiredPermission: PERMISSIONS.SUPER_ADMIN_ALL },
    { title: "Admin Users", href: "/admin/super/admins", icon: Users, requiredPermission: PERMISSIONS.SUPER_ADMIN_ALL },
    { title: "Organizations", href: "/admin/super/schools", icon: Building2, requiredPermission: PERMISSIONS.SUPER_ADMIN_ALL },
    { title: "Roles & Permissions", href: "/admin/super/roles", icon: Shield, requiredPermission: PERMISSIONS.SUPER_ADMIN_ALL },
    { title: "Subscription Plans", href: "/admin/super/plans", icon: CreditCard, requiredPermission: PERMISSIONS.SUPER_ADMIN_ALL },
    { title: "Global Settings", href: "/admin/super/global-settings", icon: Settings2, requiredPermission: PERMISSIONS.SUPER_ADMIN_ALL },
    // Regular school admin menu items
    { title: t("nav.students"), href: "/dashboard/students", icon: GraduationCap, requiredPermission: PERMISSIONS.STUDENT_READ },
    { title: t("nav.staff"), href: "/dashboard/staff", icon: Users, requiredPermission: PERMISSIONS.STAFF_READ },
    { title: t("nav.classes"), href: "/dashboard/classes", icon: School, requiredPermission: PERMISSIONS.CLASS_READ },
    { title: t("nav.subjects"), href: "/dashboard/subjects", icon: BookOpen, requiredPermission: PERMISSIONS.SUBJECT_READ },
    { title: t("nav.exams"), href: "/dashboard/exams", icon: FileText, requiredPermission: PERMISSIONS.EXAM_READ },
    { title: t("nav.results"), href: "/dashboard/results", icon: FileText, requiredPermission: PERMISSIONS.RESULT_READ },
    { title: t("nav.attendance"), href: "/dashboard/attendance", icon: Calendar, requiredPermission: PERMISSIONS.ATTENDANCE_READ },
    { title: t("nav.fees"), href: "/dashboard/fees", icon: DollarSign, requiredPermission: PERMISSIONS.FEE_READ },
    { title: t("nav.payments"), href: "/dashboard/payments", icon: DollarSign, requiredPermission: PERMISSIONS.PAYMENT_READ },
    { title: t("nav.library"), href: "/dashboard/library", icon: Library, requiredPermission: PERMISSIONS.LIBRARY_READ },
    { title: t("nav.transport"), href: "/dashboard/transport", icon: Bus, requiredPermission: PERMISSIONS.TRANSPORT_READ },
    { title: t("nav.erpHub"), href: "/dashboard/erp", icon: LayoutGrid, requiredPermission: PERMISSIONS.ERP_READ },
    { title: t("nav.crm"), href: "/dashboard/crm", icon: Contact2, requiredPermission: PERMISSIONS.ERP_READ },
    { title: t("nav.inventory"), href: "/dashboard/inventory", icon: Package, requiredPermission: PERMISSIONS.ERP_READ },
    { title: t("nav.projects"), href: "/dashboard/projects", icon: FolderKanban, requiredPermission: PERMISSIONS.ERP_READ },
    { title: t("nav.documents"), href: "/dashboard/documents", icon: FileStack, requiredPermission: PERMISSIONS.ERP_READ },
    { title: t("nav.announcements"), href: "/dashboard/announcements", icon: Megaphone, requiredPermission: PERMISSIONS.ANNOUNCEMENT_READ },
    { title: t("nav.reports"), href: "/dashboard/reports", icon: BarChart3, requiredPermission: PERMISSIONS.REPORT_READ },
    { title: t("nav.settings"), href: "/dashboard/settings", icon: Settings, requiredPermission: PERMISSIONS.SETTINGS_READ },
  ]

  // Filter nav items based on user permissions
  const filteredItems = navItems.filter((item) => {
    if (!user) return false
    
    // Super admin should see only super admin menu items
    if (user.role === "super_admin") {
      // Show only super admin menu items
      return item.href.startsWith("/admin/super")
    }
    
    // School admin and other roles should NOT see Super Admin links
    if (item.href.startsWith("/admin/super")) {
      return false
    }
    
    // For other users, check permissions
    if (user.permissions && user.permissions.length > 0) {
      if (item.requiredPermission) {
        return canAccessRoute(user.permissions, item.href)
      }
      return true
    }
    
    // Fallback to role-based check for backward compatibility
    if (item.roles && item.roles.length > 0) {
      return item.roles.includes(user.role)
    }
    
    return true
  })

  return (
    <div className="flex h-full w-64 flex-col border-r border-border/50 bg-gradient-to-b from-card via-card to-muted/30 backdrop-blur-sm shadow-lg">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-border/50 px-6 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
        <div className="flex items-center gap-2">
          {site.site_logo_url ? (
            <img src={site.site_logo_url} alt={site.site_name} className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white text-xs font-bold flex-shrink-0">
              {site.site_name.charAt(0)}
            </div>
          )}
          <div className="flex flex-col">
            <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent leading-tight">
              {user?.role === "super_admin" ? "Super Admin" : site.site_name}
            </h2>
            {user?.role === "school_admin" && (
              <p className="text-xs text-muted-foreground font-medium truncate max-w-[9rem]">
                {user?.school?.name ?? "Organization"}
              </p>
            )}
            {user?.role === "super_admin" && (
              <p className="text-xs text-muted-foreground font-medium">Control Panel</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative",
                isActive
                  ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-gradient-to-r hover:from-accent hover:to-accent/50 hover:text-accent-foreground hover:shadow-md"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full" />
              )}
              <Icon className={cn(
                "h-5 w-5 transition-transform duration-200",
                isActive ? "scale-110" : "group-hover:scale-110"
              )} />
              <span className="flex-1">{item.title}</span>
              {isActive && (
                <div className="w-2 h-2 rounded-full bg-primary-foreground/50 animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>
      
      {/* Footer */}
      <div className="border-t border-border/50 p-4 bg-gradient-to-t from-muted/50 to-transparent">
        <div className="text-xs text-muted-foreground text-center">
          <p className="font-medium">{site.site_footer_text || `© ${new Date().getFullYear()} ${site.site_name}`}</p>
        </div>
      </div>
    </div>
  )
}

