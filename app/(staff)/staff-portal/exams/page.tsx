"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, FileQuestion, Plus } from "lucide-react"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { ExamFormDialog } from "@/components/exams/exam-form-dialog"
import { useAuth } from "@/hooks/useAuth"

export default function StaffExamsPage() {
  const { user } = useAuth()
  const [exams, setExams] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<any>(null)

  const canCreate = user?.role === "teacher" || user?.role === "principal"

  const load = () => {
    setIsLoading(true)
    api.get("/exams?limit=100")
      .then((r) => setExams(r.data.exams ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  const statusColor: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    ongoing: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Exams</h1>
          <p className="text-muted-foreground text-sm">Create and manage exams for your classes</p>
        </div>
        {canCreate && (
          <Button onClick={() => { setSelectedExam(null); setIsFormOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" /> Create Exam
          </Button>
        )}
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
                    <p className="text-xs text-muted-foreground capitalize">{exam.type?.replace("_", " ")}</p>
                    {exam.class && <p className="text-xs text-muted-foreground mt-0.5">{exam.class.name}</p>}
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(exam.startDate)}
                      {exam.totalMarks && <span className="ml-2">{exam.totalMarks} marks</span>}
                      {exam._count?.results != null && <span className="ml-2">{exam._count.results} submissions</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor[exam.status] ?? "bg-muted text-muted-foreground"}`}>
                    {exam.status}
                  </span>
                  {canCreate && (
                    <Link href={`/staff-portal/exams/${exam.id}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <FileQuestion className="h-3.5 w-3.5" /> Questions
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ExamFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        exam={selectedExam}
        onSuccess={load}
      />
    </div>
  )
}
