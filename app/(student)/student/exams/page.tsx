"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, Clock, CheckCircle2 } from "lucide-react"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

export default function StudentExamsPage() {
  const [exams, setExams] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get("/exams?limit=50")
      .then(async (r) => {
        const list = r.data.exams ?? []
        setExams(list)
        // Check submission status for each ongoing/completed exam
        const subs: Record<string, any> = {}
        await Promise.all(
          list.map(async (exam: any) => {
            try {
              const s = await api.get(`/exams/${exam.id}/submit`)
              if (s.data.submission) subs[exam.id] = s.data.submission
            } catch {}
          })
        )
        setSubmissions(subs)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
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
        <h1 className="text-2xl font-bold">My Exams</h1>
        <p className="text-muted-foreground text-sm">Upcoming and active exams for your class</p>
      </div>

      {isLoading && <div className="h-48 rounded-2xl bg-muted animate-pulse" />}
      {!isLoading && exams.length === 0 && <div className="text-center py-20 text-muted-foreground">No exams scheduled yet.</div>}

      <div className="space-y-3">
        {exams.map((exam) => {
          const sub = submissions[exam.id]
          const alreadySubmitted = sub?.status === "submitted"
          return (
            <Card key={exam.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{exam.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{exam.type?.replace("_", " ")}</p>
                      {exam.class && <p className="text-xs text-muted-foreground mt-0.5">{exam.class.name}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(exam.startDate)}</span>
                        {exam.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{exam.duration} min</span>}
                        {exam.totalMarks && <span>{exam.totalMarks} marks</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor[exam.status] ?? "bg-muted text-muted-foreground"}`}>
                      {exam.status}
                    </span>

                    {alreadySubmitted ? (
                      <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Submitted
                        {sub.percentage != null && <span>· {sub.percentage}%</span>}
                      </div>
                    ) : exam.status === "ongoing" ? (
                      <Link href={`/student/exams/${exam.id}`}>
                        <Button size="sm" className="h-8 text-xs">Take Exam</Button>
                      </Link>
                    ) : null}

                    {alreadySubmitted && (
                      <Link href={`/student/exams/${exam.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">View Result</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
