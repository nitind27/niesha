"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Megaphone } from "lucide-react"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"

export default function StaffAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get("/announcements?limit=50").then((r) => setAnnouncements(r.data.announcements ?? [])).catch(() => {}).finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-muted-foreground text-sm">School notices and updates</p>
      </div>
      {isLoading && <div className="h-48 rounded-2xl bg-muted animate-pulse" />}
      {!isLoading && announcements.length === 0 && <div className="text-center py-20 text-muted-foreground">No announcements yet.</div>}
      <div className="space-y-3">
        {announcements.map((a) => (
          <Card key={a.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0 mt-0.5">
                  <Megaphone className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm">{a.title}</p>
                    {a.priority && <Badge variant={a.priority === "high" ? "destructive" : "secondary"} className="text-xs flex-shrink-0 capitalize">{a.priority}</Badge>}
                  </div>
                  {a.content && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.content}</p>}
                  <p className="text-xs text-muted-foreground mt-2">{formatDate(a.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
