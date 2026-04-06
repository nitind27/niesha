"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"

export default function StudentAttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get("/student/me")
      .then((r) => setAttendance(r.data.student?.attendance ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const total = attendance.length
  const present = attendance.filter((a) => a.status === "present").length
  const absent = attendance.filter((a) => a.status === "absent").length
  const late = attendance.filter((a) => a.status === "late").length
  const pct = total > 0 ? Math.round((present / total) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <p className="text-muted-foreground text-sm">Your attendance record</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {[
          { label: "Total Days", value: total, color: "text-foreground" },
          { label: "Present", value: present, color: "text-emerald-600" },
          { label: "Absent", value: absent, color: "text-rose-500" },
          { label: "Late", value: late, color: "text-amber-500" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Attendance Log
            </CardTitle>
            <Badge variant={pct >= 75 ? "default" : "destructive"}>{pct}% overall</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="h-32 bg-muted animate-pulse rounded-xl" />}
          {!isLoading && attendance.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No attendance records yet.</p>
          )}
          <div className="space-y-2">
            {attendance.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                <p className="text-sm font-medium">{formatDate(a.date)}</p>
                <div className="flex items-center gap-2">
                  {a.remarks && <p className="text-xs text-muted-foreground">{a.remarks}</p>}
                  <Badge
                    variant={a.status === "present" ? "default" : a.status === "absent" ? "destructive" : "secondary"}
                    className="capitalize"
                  >
                    {a.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
