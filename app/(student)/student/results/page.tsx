"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3 } from "lucide-react"
import api from "@/lib/api"

export default function StudentResultsPage() {
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get("/student/me")
      .then((r) => setResults(r.data.student?.examResults ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  // Group by exam
  const byExam: Record<string, { exam: any; results: any[] }> = {}
  results.forEach((r) => {
    const key = r.exam?.id ?? "unknown"
    if (!byExam[key]) byExam[key] = { exam: r.exam, results: [] }
    byExam[key].results.push(r)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Results</h1>
        <p className="text-muted-foreground text-sm">Your exam results and grades</p>
      </div>

      {isLoading && <div className="h-48 rounded-2xl bg-muted animate-pulse" />}

      {!isLoading && results.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">No results available yet.</div>
      )}

      {Object.values(byExam).map(({ exam, results: examResults }) => {
        const total = examResults.reduce((s: number, r: any) => s + Number(r.marksObtained), 0)
        const max = examResults.reduce((s: number, r: any) => s + Number(r.maxMarks), 0)
        const pct = max > 0 ? Math.round((total / max) * 100) : 0

        return (
          <Card key={exam?.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  {exam?.name ?? "Unknown Exam"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{total}/{max}</span>
                  <Badge variant={pct >= 60 ? "default" : "destructive"}>{pct}%</Badge>
                </div>
              </div>
              {exam?.type && <p className="text-xs text-muted-foreground capitalize">{exam.type}</p>}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {examResults.map((r: any) => {
                  const p = r.maxMarks > 0 ? Math.round((r.marksObtained / r.maxMarks) * 100) : 0
                  return (
                    <div key={r.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{r.subject?.name}</p>
                        {r.subject?.code && <p className="text-xs text-muted-foreground">{r.subject.code}</p>}
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="text-sm font-bold">{r.marksObtained}/{r.maxMarks}</p>
                          <p className={`text-xs ${p >= 60 ? "text-emerald-600" : "text-rose-500"}`}>{p}%</p>
                        </div>
                        {r.grade && <Badge variant="outline" className="text-xs">{r.grade}</Badge>}
                      </div>
                    </div>
                  )
                })}
              </div>
              {examResults[0]?.remarks && (
                <p className="mt-3 text-xs text-muted-foreground italic">Remarks: {examResults[0].remarks}</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
