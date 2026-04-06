"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign } from "lucide-react"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"

export default function StudentFeesPage() {
  const [fees, setFees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get("/student/me")
      .then((r) => setFees(r.data.student?.feePayments ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const paid = fees.filter((f) => f.status === "paid")
  const pending = fees.filter((f) => f.status === "pending")
  const totalPaid = paid.reduce((s: number, f: any) => s + Number(f.amount), 0)
  const totalPending = pending.reduce((s: number, f: any) => s + Number(f.amount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Fees</h1>
        <p className="text-muted-foreground text-sm">Your fee payment history</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Paid</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalPaid.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{paid.length} payment(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending</p>
            <p className={`text-2xl font-bold mt-1 ${totalPending > 0 ? "text-rose-500" : "text-emerald-600"}`}>
              ₹{totalPending.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{pending.length} payment(s) due</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" /> Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="h-32 bg-muted animate-pulse rounded-xl" />}
          {!isLoading && fees.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No fee records found.</p>
          )}
          <div className="space-y-2">
            {fees.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                <div>
                  <p className="text-sm font-bold">₹{Number(f.amount).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.paymentDate ? formatDate(f.paymentDate) : "—"}
                    {f.paymentMethod ? ` · ${f.paymentMethod}` : ""}
                  </p>
                  {f.transactionId && (
                    <p className="text-xs text-muted-foreground font-mono">{f.transactionId}</p>
                  )}
                </div>
                <Badge variant={f.status === "paid" ? "default" : f.status === "pending" ? "destructive" : "secondary"} className="capitalize">
                  {f.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
