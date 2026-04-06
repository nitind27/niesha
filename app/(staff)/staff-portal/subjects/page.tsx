"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen } from "lucide-react"
import api from "@/lib/api"

export default function StaffSubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get("/staff/me").then((r) => setSubjects(r.data.staff?.subjects ?? [])).catch(() => {}).finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Subjects</h1>
        <p className="text-muted-foreground text-sm">Subjects you are teaching</p>
      </div>
      {isLoading && <div className="h-48 rounded-2xl bg-muted animate-pulse" />}
      {!isLoading && subjects.length === 0 && <div className="text-center py-20 text-muted-foreground">No subjects assigned yet.</div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => (
          <Card key={s.id}>
            <CardContent className="pt-5 pb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
                <BookOpen className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="font-semibold">{s.name}</p>
                {s.code && <p className="text-xs text-muted-foreground font-mono">{s.code}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
