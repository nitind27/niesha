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
import { Badge } from "@/components/ui/badge"
import { Package, Plus, Trash2 } from "lucide-react"

type Item = {
  id: string
  sku: string
  name: string
  qty: number
  location: string
  custodian: string
}

export default function InventoryPage() {
  const { user } = useAuth()
  const storageKey = useMemo(
    () => `erp_inventory_${user?.schoolId ?? "local"}`,
    [user?.schoolId]
  )

  const [rows, setRows] = useState<Item[]>([])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({
    sku: "",
    name: "",
    qty: 1,
    location: "",
    custodian: "",
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setRows(JSON.parse(raw))
    } catch {
      setRows([])
    }
  }, [storageKey])

  const persist = (next: Item[]) => {
    setRows(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const add = () => {
    if (!draft.name.trim()) return
    const row: Item = {
      id: crypto.randomUUID(),
      sku: draft.sku.trim() || `SKU-${rows.length + 1}`,
      name: draft.name.trim(),
      qty: Math.max(0, Number(draft.qty) || 0),
      location: draft.location.trim(),
      custodian: draft.custodian.trim(),
    }
    persist([row, ...rows])
    setDraft({ sku: "", name: "", qty: 1, location: "", custodian: "" })
    setOpen(false)
  }

  const remove = (id: string) => persist(rows.filter((r) => r.id !== id))

  const lowStock = rows.filter((r) => r.qty > 0 && r.qty < 5)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Inventory & assets
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Stock, IT assets, furniture, or fleet parts — scoped per organization. Stored locally until you plug in
            inventory APIs.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add item
        </Button>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Low stock (&lt; 5)</CardTitle>
            <CardDescription>Reorder or transfer these SKUs</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {lowStock.map((r) => (
              <Badge key={r.id} variant="secondary">
                {r.name} ({r.qty})
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
          <CardDescription>SKU, quantity, location, and custodian for audits.</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Add your first inventory line.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Custodian</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.sku}</TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.qty}</TableCell>
                      <TableCell>{r.location || "—"}</TableCell>
                      <TableCell>{r.custodian || "—"}</TableCell>
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
            <DialogTitle>Add inventory line</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.qty}
                  onChange={(e) => setDraft({ ...draft, qty: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={draft.location}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Custodian</Label>
                <Input
                  value={draft.custodian}
                  onChange={(e) => setDraft({ ...draft, custodian: e.target.value })}
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
