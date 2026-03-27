"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { FolderKanban, Plus } from "lucide-react"

type Col = "planned" | "active" | "done"

type Task = {
  id: string
  title: string
  owner: string
  due: string
  column: Col
}

const columns: { id: Col; title: string; hint: string }[] = [
  { id: "planned", title: "Planned", hint: "Ideas, approvals, backlog" },
  { id: "active", title: "Active", hint: "In progress" },
  { id: "done", title: "Done", hint: "Closed / handed over" },
]

export default function ProjectsPage() {
  const { user } = useAuth()
  const storageKey = useMemo(
    () => `erp_projects_${user?.schoolId ?? "local"}`,
    [user?.schoolId]
  )

  const [tasks, setTasks] = useState<Task[]>([])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({ title: "", owner: "", due: "", column: "planned" as Col })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setTasks(JSON.parse(raw))
    } catch {
      setTasks([])
    }
  }, [storageKey])

  const persist = (next: Task[]) => {
    setTasks(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const add = () => {
    if (!draft.title.trim()) return
    const t: Task = {
      id: crypto.randomUUID(),
      title: draft.title.trim(),
      owner: draft.owner.trim(),
      due: draft.due,
      column: draft.column,
    }
    persist([t, ...tasks])
    setDraft({ title: "", owner: "", due: "", column: "planned" })
    setOpen(false)
  }

  const move = (id: string, column: Col) => {
    persist(tasks.map((t) => (t.id === id ? { ...t, column } : t)))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderKanban className="h-8 w-8 text-primary" />
            Projects & programs
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Kanban for CSR, trust programs, school initiatives, or delivery squads. Board data is stored in this
            browser per tenant.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New card
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((col) => (
          <Card key={col.id} className="min-h-[320px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{col.title}</CardTitle>
              <CardDescription>{col.hint}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.filter((t) => t.column === col.id).length === 0 ? (
                <p className="text-xs text-muted-foreground">Drop work here</p>
              ) : null}
              {tasks
                .filter((t) => t.column === col.id)
                .map((t) => (
                  <div key={t.id} className="rounded-lg border bg-card p-3 space-y-2 shadow-sm">
                    <p className="font-medium text-sm">{t.title}</p>
                    <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                      {t.owner ? <Badge variant="outline">{t.owner}</Badge> : null}
                      {t.due ? <span>Due {t.due}</span> : null}
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {columns
                        .filter((c) => c.id !== col.id)
                        .map((c) => (
                          <Button key={c.id} variant="secondary" size="sm" onClick={() => move(t.id, c.id)}>
                            → {c.title}
                          </Button>
                        ))}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New project card</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input type="date" value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Column</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={draft.column}
                onChange={(e) => setDraft({ ...draft, column: e.target.value as Col })}
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={add}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
