"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar } from "lucide-react"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"

export default function StaffExamsPage() {
  const [exams, setExams] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get("/exams?limit=50").then((r) => setExams(r.data.exams ?? [])).catch(() => {}).finally(() => setIsLoading(false))
  }, [])

  const statusColor: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    ongoing: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exams</h1>
        <p className="text-muted-foreground text-sm">All exams in your school</p>
      </div>
      {isLoading && <div className="h-48 rounded-2xl bg-muted animate-pulse" />}
      {!isLoading && exams.length === 0 && <div className="text-center py-20 text-muted-foreground">No exams found.</div>}
      <div className="space-y-3">
        {exams.map((exam) => (
          <Card key={exam.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{exam.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{exam.type}</p>
                    {exam.class && <p className="text-xs text-muted-foreground mt-0.5">{exam.class.name}</p>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor[exam.status] ?? "bg-muted text-muted-foreground"}`}>{exam.status}</span>
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground justify-end">
                    <Calendar className="h-3 w-3" />
                    {formatDate(exam.startDate)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
