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
import { Plus, Contact2, Trash2 } from "lucide-react"
import { getOrganizationLabels } from "@/lib/organization-labels"
import { Textarea } from "@/components/ui/textarea"

type Contact = {
  id: string
  name: string
  email: string
  phone: string
  tag: string
  stage: "lead" | "active" | "dormant"
  notes: string
}

const stages = [
  { value: "lead", label: "Lead / prospect" },
  { value: "active", label: "Active" },
  { value: "dormant", label: "Dormant" },
] as const

export default function CrmPage() {
  const { user } = useAuth()
  const storageKey = useMemo(
    () => `erp_crm_${user?.schoolId ?? "local"}`,
    [user?.schoolId]
  )
  const labels = getOrganizationLabels(user?.school?.organizationType)

  const [rows, setRows] = useState<Contact[]>([])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    phone: "",
    tag: "stakeholder",
    stage: "lead" as Contact["stage"],
    notes: "",
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setRows(JSON.parse(raw))
    } catch {
      setRows([])
    }
  }, [storageKey])

  const persist = (next: Contact[]) => {
    setRows(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const addRow = () => {
    if (!draft.name.trim()) return
    const row: Contact = {
      id: crypto.randomUUID(),
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      tag: draft.tag,
      stage: draft.stage,
      notes: draft.notes.trim(),
    }
    persist([row, ...rows])
    setDraft({ name: "", email: "", phone: "", tag: "stakeholder", stage: "lead", notes: "" })
    setOpen(false)
  }

  const remove = (id: string) => persist(rows.filter((r) => r.id !== id))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Contact2 className="h-8 w-8 text-primary" />
            CRM & contacts
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Track donors, clients, guardians, or vendors. Data stays in this browser for your workspace until you
            connect a central CRM API.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Tip: Link contacts to {labels.memberSingular.toLowerCase()} records and{" "}
            {labels.feePlural.toLowerCase()} in your process.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add contact
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline</CardTitle>
          <CardDescription>Filter and export from Reports when you wire backend storage.</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No contacts yet. Add your first stakeholder.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.email || "—"}</TableCell>
                      <TableCell>{r.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.tag}</Badge>
                      </TableCell>
                      <TableCell className="capitalize">{r.stage}</TableCell>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New contact</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tag</Label>
              <Select value={draft.tag} onValueChange={(v) => setDraft({ ...draft, tag: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stakeholder">Stakeholder</SelectItem>
                  <SelectItem value="donor">Donor</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select
                value={draft.stage}
                onValueChange={(v) => setDraft({ ...draft, stage: v as Contact["stage"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addRow}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
