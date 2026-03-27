"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, Shield, LayoutDashboard, CreditCard, Building2, Settings2 } from "lucide-react"

export function SuperAdminNav() {
  const pathname = usePathname()

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin/super",
      icon: LayoutDashboard,
      description: "Admin Management",
    },
    {
      title: "Organizations",
      href: "/admin/super/schools",
      icon: Building2,
      description: "Tenants & tenant admins",
    },
    {
      title: "Roles & Permissions",
      href: "/admin/super/roles",
      icon: Shield,
      description: "Manage roles and permissions",
    },
    {
      title: "Subscription Plans",
      href: "/admin/super/plans",
      icon: CreditCard,
      description: "Manage subscription plans",
    },
    {
      title: "Global Settings",
      href: "/admin/super/global-settings",
      icon: Settings2,
      description: "Platform branding & behavior",
    },
  ]

  return (
    <div className="mb-6">
      <div className="flex gap-1 border-b bg-muted/30 p-1 rounded-t-lg">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

