"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileStack, Plus, Trash2 } from "lucide-react"

type DocRow = {
  id: string
  title: string
  category: string
  reference: string
  reviewDate: string
  owner: string
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const storageKey = useMemo(
    () => `erp_documents_${user?.schoolId ?? "local"}`,
    [user?.schoolId]
  )

  const [rows, setRows] = useState<DocRow[]>([])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({
    title: "",
    category: "legal",
    reference: "",
    reviewDate: "",
    owner: "",
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setRows(JSON.parse(raw))
    } catch {
      setRows([])
    }
  }, [storageKey])

  const persist = (next: DocRow[]) => {
    setRows(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const add = () => {
    if (!draft.title.trim()) return
    const row: DocRow = {
      id: crypto.randomUUID(),
      title: draft.title.trim(),
      category: draft.category,
      reference: draft.reference.trim(),
      reviewDate: draft.reviewDate,
      owner: draft.owner.trim(),
    }
    persist([row, ...rows])
    setDraft({ title: "", category: "legal", reference: "", reviewDate: "", owner: "" })
    setOpen(false)
  }

  const remove = (id: string) => persist(rows.filter((r) => r.id !== id))

  const upcoming = rows.filter((r) => {
    if (!r.reviewDate) return false
    const d = new Date(r.reviewDate)
    const in30 = new Date()
    in30.setDate(in30.getDate() + 30)
    return d <= in30 && d >= new Date(new Date().toDateString())
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileStack className="h-8 w-8 text-primary" />
            Document center
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Register policies, MoUs, licenses, and HR letters. Attach files in your DMS later; this board tracks what
            matters for audits.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Register document
        </Button>
      </div>

      {upcoming.length > 0 && (
        <Card className="border-sky-500/40 bg-sky-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Review within 30 days</CardTitle>
            <CardDescription>Renewals and compliance reviews</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {upcoming.map((r) => (
              <Badge key={r.id} variant="secondary">
                {r.title} — {r.reviewDate}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Registry</CardTitle>
          <CardDescription>Title, category, internal reference, owner, next review.</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No documents registered yet.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Next review</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {r.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.reference || "—"}</TableCell>
                      <TableCell>{r.owner || "—"}</TableCell>
                      <TableCell>{r.reviewDate || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => remove(r.id)} aria-label="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Internal reference</Label>
              <Input
                value={draft.reference}
                onChange={(e) => setDraft({ ...draft, reference: e.target.value })}
                placeholder="e.g. MOU-2024-01"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Owner</Label>
                <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Next review</Label>
                <Input
                  type="date"
                  value={draft.reviewDate}
                  onChange={(e) => setDraft({ ...draft, reviewDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={add}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
