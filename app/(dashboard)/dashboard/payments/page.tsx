"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ArrowUpDown,
  Download,
  DollarSign,
  Calendar,
} from "lucide-react"
import { usePayments } from "@/hooks/usePayments"
import { useDebounce } from "@/hooks/useDebounce"
import { TableSkeleton } from "@/components/loading/table-skeleton"
import { PaymentFormDialog } from "@/components/payments/payment-form-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import api from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { ErpModuleStrip } from "@/components/erp/erp-module-strip"

export default function PaymentsPage() {
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 300)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [fees, setFees] = useState<any[]>([])
  const [sortConfig, setSortConfig] = useState<{
    field: string
    direction: "asc" | "desc"
  }>({ field: "paymentDate", direction: "desc" })
  const { toast } = useToast()

  const {
    payments,
    isLoading,
    error,
    pagination,
    filters,
    setFilters,
    setPage,
    refetch,
  } = usePayments()

  // Fetch dropdown data
  useEffect(() => {
    Promise.all([
      api.get("/students?limit=100").then((res) => setStudents(res.data.students || [])).catch(() => setStudents([])),
      api.get("/fees?limit=100").then((res) => setFees(res.data.fees || [])).catch(() => setFees([])),
    ])
  }, [])

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters({ search: debouncedSearch || undefined })
    }
  }, [debouncedSearch, filters.search, setFilters])

  const handleResetFilters = () => {
    setFilters({})
    setSearchInput("")
  }

  const handleCreate = () => {
    setSelectedPayment(null)
    setIsFormOpen(true)
  }

  const handleEdit = (payment: any) => {
    setSelectedPayment(payment)
    setIsFormOpen(true)
  }

  const handleDelete = async (paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId)
    const paymentName = payment
      ? `${payment.student?.firstName} ${payment.student?.lastName} - ${payment.fee?.name}`
      : "this payment"
    
    if (!confirm(`Are you sure you want to delete ${paymentName}? This action cannot be undone.`)) return

    try {
      await api.delete(`/payments/${paymentId}`)
      toast({
        variant: "success",
        title: "Payment Deleted",
        description: "Payment has been deleted successfully.",
      })
      refetch()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.response?.data?.error || "Failed to delete payment. Please try again.",
      })
    }
  }

  const handleSort = (field: string) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }))
    setFilters({
      sortBy: field,
      sortOrder: sortConfig.field === field && sortConfig.direction === "asc" ? "desc" : "asc",
    })
  }

  const handleExport = () => {
    const headers = [
      "Student",
      "Admission Number",
      "Fee",
      "Amount",
      "Payment Date",
      "Payment Method",
      "Status",
      "Transaction ID",
      "Remarks",
    ]
    const rows = payments.map((p) => [
      `${p.student?.firstName} ${p.student?.lastName}`,
      p.student?.admissionNumber || "-",
      p.fee?.name || "-",
      Number(p.amount).toFixed(2),
      formatDate(p.paymentDate),
      p.paymentMethod.replace("_", " "),
      p.status,
      p.transactionId || "-",
      p.remarks || "-",
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payments-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
        return "destructive"
      case "refunded":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getPaymentMethodLabel = (method: string) => {
    return method.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort(field)}>
      <div className="flex items-center gap-2">
        {children}
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      </div>
    </TableHead>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Manage payment records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Payment
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student name, admission number, fee, or transaction ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select
                value={filters.studentId || "all"}
                onValueChange={(value) =>
                  setFilters({ studentId: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select
                value={filters.feeId || "all"}
                onValueChange={(value) =>
                  setFilters({ feeId: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by fee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fees</SelectItem>
                  {fees.map((fee) => (
                    <SelectItem key={fee.id} value={fee.id}>
                      {fee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({ status: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input
                type="date"
                placeholder="From Date"
                value={filters.startDate || ""}
                onChange={(e) => setFilters({ startDate: e.target.value || undefined })}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input
                type="date"
                placeholder="To Date"
                value={filters.endDate || ""}
                onChange={(e) => setFilters({ endDate: e.target.value || undefined })}
              />
            </div>
            {(filters.studentId || filters.feeId || filters.status || filters.startDate || filters.endDate) && (
              <Button variant="outline" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {isLoading ? (
            <TableSkeleton rows={10} cols={8} />
          ) : payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No payments found. Try adjusting your filters.
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader field="student.firstName">Student</SortableHeader>
                      <TableHead>Admission No.</TableHead>
                      <SortableHeader field="fee.name">Fee</SortableHeader>
                      <SortableHeader field="amount">Amount</SortableHeader>
                      <SortableHeader field="paymentDate">Payment Date</SortableHeader>
                      <TableHead>Method</TableHead>
                      <SortableHeader field="status">Status</SortableHeader>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.student?.firstName} {payment.student?.lastName}
                        </TableCell>
                        <TableCell>{payment.student?.admissionNumber || "-"}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.fee?.name || "-"}</div>
                            {payment.student?.class && (
                              <div className="text-sm text-muted-foreground">
                                {payment.student.class.name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {Number(payment.amount).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(payment.paymentDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getPaymentMethodLabel(payment.paymentMethod)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(payment.status)}>
                            {getStatusLabel(payment.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(payment)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(payment.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} payments
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrevPage}
                      onClick={() => setPage(pagination.page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i
                        } else {
                          pageNum = pagination.page - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNextPage}
                      onClick={() => setPage(pagination.page + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ErpModuleStrip module="payments" />

      <PaymentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        payment={selectedPayment}
        onSuccess={() => {
          refetch()
        }}
      />
    </div>
  )
}
