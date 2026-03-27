"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { useTranslation } from "@/hooks/useLanguage"
import {
  GraduationCap, Users, School, DollarSign, ClipboardList, AlertCircle,
  LayoutGrid, Contact2, Package, FolderKanban, FileStack, ArrowRight,
  TrendingUp, Bus, Megaphone, BarChart3, Settings,
  FileText, Library, Zap, ChevronRight, Activity, Clock,
} from "lucide-react"
import api from "@/lib/api"
import { getOrganizationLabels, organizationTypeLabel } from "@/lib/organization-labels"
import { Badge } from "@/components/ui/badge"
import { canAccessRoute } from "@/lib/route-permissions"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [stats, setStats] = useState({
    totalStudents: 0, totalStaff: 0, totalClasses: 0,
    totalRevenue: 0, attendanceToday: 0, pendingPayments: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [greeting, setGreeting] = useState("Good morning")

  const orgLabels = getOrganizationLabels(user?.school?.organizationType)
  const canErp = user?.permissions && canAccessRoute(user.permissions, "/dashboard/erp")

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening")
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await api.get("/dashboard/stats")
      setStats(res.data)
    } catch {}
    finally { setIsLoading(false) }
  }

  useEffect(() => {
    if (user?.role === "super_admin") window.location.href = "/admin/super"
  }, [user])

  if (user?.role === "super_admin") return null

  const statCards = [
    {
      title: t("dashboard.totalStudents"),
      value: stats.totalStudents,
      icon: GraduationCap,
      gradient: "from-blue-500 to-blue-600",
      light: "bg-blue-50 dark:bg-blue-950/40",
      text: "text-blue-600 dark:text-blue-400",
      href: "/dashboard/students",
      change: "+12%",
      positive: true,
    },
    {
      title: t("dashboard.totalStaff"),
      value: stats.totalStaff,
      icon: Users,
      gradient: "from-emerald-500 to-emerald-600",
      light: "bg-emerald-50 dark:bg-emerald-950/40",
      text: "text-emerald-600 dark:text-emerald-400",
      href: "/dashboard/staff",
      change: "+3%",
      positive: true,
    },
    {
      title: t("dashboard.totalClasses"),
      value: stats.totalClasses,
      icon: School,
      gradient: "from-violet-500 to-violet-600",
      light: "bg-violet-50 dark:bg-violet-950/40",
      text: "text-violet-600 dark:text-violet-400",
      href: "/dashboard/classes",
      change: "0%",
      positive: true,
    },
    {
      title: t("dashboard.totalRevenue"),
      value: `₹${Number(stats.totalRevenue).toLocaleString()}`,
      icon: DollarSign,
      gradient: "from-amber-500 to-amber-600",
      light: "bg-amber-50 dark:bg-amber-950/40",
      text: "text-amber-600 dark:text-amber-400",
      href: "/dashboard/payments",
      change: "+8%",
      positive: true,
    },
    {
      title: t("dashboard.attendanceToday"),
      value: stats.attendanceToday,
      icon: ClipboardList,
      gradient: "from-cyan-500 to-cyan-600",
      light: "bg-cyan-50 dark:bg-cyan-950/40",
      text: "text-cyan-600 dark:text-cyan-400",
      href: "/dashboard/attendance",
      change: "Today",
      positive: true,
    },
    {
      title: t("dashboard.pendingPayments"),
      value: stats.pendingPayments,
      icon: AlertCircle,
      gradient: "from-rose-500 to-rose-600",
      light: "bg-rose-50 dark:bg-rose-950/40",
      text: "text-rose-600 dark:text-rose-400",
      href: "/dashboard/fees",
      change: "Pending",
      positive: false,
    },
  ]

  const quickLinks = [
    { href: "/dashboard/students", label: orgLabels.memberPlural, icon: GraduationCap, color: "text-blue-500" },
    { href: "/dashboard/staff", label: "Staff", icon: Users, color: "text-emerald-500" },
    { href: "/dashboard/classes", label: "Classes", icon: School, color: "text-violet-500" },
    { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardList, color: "text-cyan-500" },
    { href: "/dashboard/exams", label: "Exams", icon: FileText, color: "text-orange-500" },
    { href: "/dashboard/results", label: "Results", icon: BarChart3, color: "text-pink-500" },
    { href: "/dashboard/fees", label: "Fees", icon: DollarSign, color: "text-amber-500" },
    { href: "/dashboard/library", label: "Library", icon: Library, color: "text-teal-500" },
    { href: "/dashboard/transport", label: "Transport", icon: Bus, color: "text-indigo-500" },
    { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone, color: "text-red-500" },
    { href: "/dashboard/reports", label: "Reports", icon: BarChart3, color: "text-slate-500" },
    { href: "/dashboard/settings", label: "Settings", icon: Settings, color: "text-gray-500" },
  ]

  const erpModules = [
    { href: "/dashboard/erp", label: "ERP Hub", icon: LayoutGrid, desc: "Overview" },
    { href: "/dashboard/crm", label: "CRM", icon: Contact2, desc: "Contacts" },
    { href: "/dashboard/inventory", label: "Inventory", icon: Package, desc: "Stock" },
    { href: "/dashboard/projects", label: "Projects", icon: FolderKanban, desc: "Tasks" },
    { href: "/dashboard/documents", label: "Documents", icon: FileStack, desc: "Files" },
  ]

  const recentActivity = [
    { icon: GraduationCap, text: `New ${orgLabels.memberSingular.toLowerCase()} enrolled`, time: "2h ago", color: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
    { icon: DollarSign, text: "Payment received", time: "5h ago", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" },
    { icon: ClipboardList, text: "Attendance marked", time: "6h ago", color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400" },
    { icon: Megaphone, text: "New announcement posted", time: "1d ago", color: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400" },
    { icon: FileText, text: "Exam scheduled", time: "2d ago", color: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400" },
  ]

  return (
    <div className="space-y-6 pb-8">

      {/* ── Welcome Banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-violet-600 p-6 text-white shadow-xl shadow-primary/20">
        {/* decorative circles */}
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 right-24 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white/70 mb-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {greeting}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {greeting}, {user?.firstName}! 👋
            </h1>
            <p className="mt-1.5 text-sm text-white/70 max-w-md">{orgLabels.tagline}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {user?.role === "school_admin" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                  <Zap className="h-3 w-3" /> Admin
                </span>
              )}
              {user?.school?.organizationType && (
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                  {organizationTypeLabel(user.school.organizationType)}
                </span>
              )}
              {user?.school?.name && (
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                  {user.school.name}
                </span>
              )}
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-2 text-right">
            <div className="text-3xl font-bold">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
            <div className="text-sm text-white/70">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric" })}</div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
            ))
          : statCards.map((card, i) => {
              const Icon = card.icon
              return (
                <Link key={i} href={card.href}>
                  <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30 cursor-pointer">
                    {/* gradient accent top-right */}
                    <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                    <div className="relative flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.title}</p>
                        <p className="mt-2 text-3xl font-bold tracking-tight">{card.value}</p>
                        <span className={cn(
                          "mt-2 inline-flex items-center gap-1 text-xs font-medium",
                          card.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                        )}>
                          <TrendingUp className="h-3 w-3" />
                          {card.change}
                        </span>
                      </div>
                      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", card.light)}>
                        <Icon className={cn("h-6 w-6", card.text)} />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      View details <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              )
            })}
      </div>

      {/* ── Quick Access Grid ───────────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Quick Access
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {quickLinks.map(({ href, label, icon: Icon, color }) => (
            <Link key={href} href={href}>
              <div className="group flex flex-col items-center gap-2 rounded-2xl border border-border/50 bg-card p-4 text-center shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                  <Icon className={cn("h-5 w-5 transition-colors group-hover:text-primary", color)} />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-tight">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── ERP Modules ────────────────────────────────────────────────── */}
      {canErp && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-primary" /> ERP Suite
            </h2>
            <Badge variant="outline" className="text-[10px] px-2 py-0">Extended</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {erpModules.map(({ href, label, icon: Icon, desc }) => (
              <Link key={href} href={href}>
                <div className="group flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 cursor-pointer">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom Row: Activity + Quick Actions ───────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Recent Activity */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Recent Activity
            </h2>
            <span className="text-xs text-muted-foreground">Last 7 days</span>
          </div>
          <div className="divide-y divide-border/40">
            {recentActivity.map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs", item.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.text}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {item.time}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Quick Actions
            </h2>
          </div>
          <div className="p-4 space-y-2">
            {[
              { href: "/dashboard/students", label: `Add / manage ${orgLabels.memberPlural.toLowerCase()}`, icon: GraduationCap, color: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" },
              { href: "/dashboard/attendance", label: "Mark today's attendance", icon: ClipboardList, color: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400" },
              { href: "/dashboard/exams", label: "Schedule an assessment", icon: FileText, color: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400" },
              { href: "/dashboard/fees", label: "Manage fees & payments", icon: DollarSign, color: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" },
              { href: "/dashboard/announcements", label: "Post an announcement", icon: Megaphone, color: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400" },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link key={href} href={href}>
                <div className="group flex items-center gap-3 rounded-xl border border-border/40 bg-background/50 px-4 py-3 transition-all hover:border-primary/30 hover:bg-muted/40 hover:shadow-sm cursor-pointer">
                  <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg", color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-sm font-medium">{label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
