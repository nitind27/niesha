"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Calendar, BarChart3, DollarSign, BookOpen, Clock } from "lucide-react"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

export default function StudentHomePage() {
  const { user } = useAuth()
  const [student, setStudent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get("/student/me")
      .then((r) => setStudent(r.data.student))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Profile not linked</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Your login account is not linked to a student profile yet. Please contact your school administrator.
        </p>
      </div>
    )
  }

  const totalAttendance = student.attendance?.length ?? 0
  const presentDays = student.attendance?.filter((a: any) => a.status === "present").length ?? 0
  const attendancePct = totalAttendance > 0 ? Math.round((presentDays / totalAttendance) * 100) : 0
  const pendingFees = student.feePayments?.filter((f: any) => f.status === "pending").length ?? 0
  const recentResults = student.examResults?.slice(0, 3) ?? []

  const quickCards = [
    {
      title: "Class",
      value: student.class?.name ?? "Not assigned",
      sub: student.section ? `Section ${student.section.name}` : "",
      icon: GraduationCap,
      color: "from-blue-500 to-blue-600",
      light: "bg-blue-50 dark:bg-blue-950/40",
      text: "text-blue-600",
      href: "/student/profile",
    },
    {
      title: "Attendance",
      value: `${attendancePct}%`,
      sub: `${presentDays} / ${totalAttendance} days`,
      icon: Calendar,
      color: "from-emerald-500 to-emerald-600",
      light: "bg-emerald-50 dark:bg-emerald-950/40",
      text: "text-emerald-600",
      href: "/student/attendance",
    },
    {
      title: "Results",
      value: student.examResults?.length ?? 0,
      sub: "Total results",
      icon: BarChart3,
      color: "from-violet-500 to-violet-600",
      light: "bg-violet-50 dark:bg-violet-950/40",
      text: "text-violet-600",
      href: "/student/results",
    },
    {
      title: "Pending Fees",
      value: pendingFees,
      sub: "Payments due",
      icon: DollarSign,
      color: pendingFees > 0 ? "from-rose-500 to-rose-600" : "from-emerald-500 to-emerald-600",
      light: pendingFees > 0 ? "bg-rose-50 dark:bg-rose-950/40" : "bg-emerald-50 dark:bg-emerald-950/40",
      text: pendingFees > 0 ? "text-rose-600" : "text-emerald-600",
      href: "/student/fees",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <p className="text-sm text-white/70 mb-1">Welcome back</p>
          <h1 className="text-2xl font-bold">
            {student.firstName} {student.lastName} 👋
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
              Admission: {student.admissionNumber}
            </span>
            {student.class && (
              <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                {student.class.name}{student.section ? ` — ${student.section.name}` : ""}
              </span>
            )}
            <Badge
              className={`text-xs ${student.status === "active" ? "bg-green-400/30 text-white border-0" : "bg-white/20 text-white border-0"}`}
            >
              {student.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickCards.map((card) => {
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

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Recent Results
            </CardTitle>
            <Link href="/student/results" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentResults.map((r: any) => {
                const pct = r.maxMarks > 0 ? Math.round((r.marksObtained / r.maxMarks) * 100) : 0
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{r.exam?.name}</p>
                      <p className="text-xs text-muted-foreground">{r.subject?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{r.marksObtained}/{r.maxMarks}</p>
                      <p className={`text-xs font-medium ${pct >= 60 ? "text-emerald-600" : "text-rose-500"}`}>{pct}%{r.grade ? ` · ${r.grade}` : ""}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Attendance */}
      {student.attendance?.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Recent Attendance
            </CardTitle>
            <Link href="/student/attendance" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {student.attendance.slice(0, 14).map((a: any) => (
                <div
                  key={a.id}
                  title={`${formatDate(a.date)} — ${a.status}`}
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
