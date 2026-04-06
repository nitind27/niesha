"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { GraduationCap } from "lucide-react"
import api from "@/lib/api"

export default function StaffClassesPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get("/staff/me").then((r) => setClasses(r.data.staff?.classes ?? [])).catch(() => {}).finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Classes</h1>
        <p className="text-muted-foreground text-sm">Classes assigned to you</p>
      </div>
      {isLoading && <div className="h-48 rounded-2xl bg-muted animate-pulse" />}
      {!isLoading && classes.length === 0 && <div className="text-center py-20 text-muted-foreground">No classes assigned yet.</div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
          <Card key={c.id}>
            <CardContent className="pt-5 pb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold">{c.name}</p>
                {c.level && <p className="text-xs text-muted-foreground">Level {c.level}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
