"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Calendar, BookOpen, Clock, Briefcase } from "lucide-react"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

export default function StaffPortalHome() {
  const { user } = useAuth()
  const [staff, setStaff] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get("/staff/me")
      .then((r) => setStaff(r.data.staff))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}</div>
  }

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Profile not linked</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">Your login is not linked to a staff profile. Contact your administrator.</p>
      </div>
    )
  }

  const totalAttendance = staff.attendance?.length ?? 0
  const presentDays = staff.attendance?.filter((a: any) => a.status === "present").length ?? 0
  const attendancePct = totalAttendance > 0 ? Math.round((presentDays / totalAttendance) * 100) : 0

  const cards = [
    { title: "Designation", value: staff.designation, sub: staff.department || "", icon: Briefcase, color: "from-emerald-500 to-emerald-600", light: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600", href: "/staff-portal/profile" },
    { title: "Classes", value: staff.classes?.length ?? 0, sub: "Assigned classes", icon: GraduationCap, color: "from-blue-500 to-blue-600", light: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-600", href: "/staff-portal/classes" },
    { title: "Subjects", value: staff.subjects?.length ?? 0, sub: "Teaching subjects", icon: BookOpen, color: "from-violet-500 to-violet-600", light: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-600", href: "/staff-portal/subjects" },
    { title: "Attendance", value: `${attendancePct}%`, sub: `${presentDays}/${totalAttendance} days`, icon: Calendar, color: "from-amber-500 to-amber-600", light: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600", href: "/staff-portal/attendance" },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <p className="text-sm text-white/70 mb-1">Welcome back</p>
          <h1 className="text-2xl font-bold">{staff.firstName} {staff.lastName} 👋</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium">ID: {staff.employeeId}</span>
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium">{staff.designation}</span>
            {staff.department && <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium">{staff.department}</span>}
            <Badge className={`text-xs border-0 ${staff.status === "active" ? "bg-green-400/30 text-white" : "bg-white/20 text-white"}`}>{staff.status}</Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href}>
              <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${card.color} opacity-10`} />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.title}</p>
                    <p className="mt-1 text-2xl font-bold">{card.value}</p>
                    {card.sub && <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>}
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.light}`}>
                    <Icon className={`h-5 w-5 ${card.text}`} />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent Attendance */}
      {staff.attendance?.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Recent Attendance</CardTitle>
            <Link href="/staff-portal/attendance" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {staff.attendance.slice(0, 14).map((a: any) => (
                <div key={a.id} title={`${formatDate(a.date)} — ${a.status}`}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-default
                    ${a.status === "present" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                    : a.status === "absent" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"}`}
                >
                  {a.status === "present" ? "P" : a.status === "absent" ? "A" : "L"}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
