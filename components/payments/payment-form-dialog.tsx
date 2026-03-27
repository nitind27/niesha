"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import api from "@/lib/api"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const paymentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  feeId: z.string().min(1, "Fee is required"),
  amount: z.string().min(1, "Amount is required"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.enum(["cash", "card", "bank_transfer", "online"], {
    errorMap: () => ({ message: "Please select a payment method" }),
  }),
  transactionId: z.string().max(100).optional().or(z.literal("")),
  status: z.enum(["pending", "completed", "failed", "refunded"]),
  remarks: z.string().max(500).optional().or(z.literal("")),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface PaymentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment?: any
  onSuccess: () => void
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  payment,
  onSuccess,
}: PaymentFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [fees, setFees] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [selectedFee, setSelectedFee] = useState<string>("")
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      status: "pending",
      paymentMethod: "cash",
    },
  })

  const selectedFeeId = watch("feeId")

  useEffect(() => {
    if (open) {
      setLoadingData(true)
      Promise.all([
        api.get("/students?limit=100").then((res) => setStudents(res.data.students || [])).catch(() => setStudents([])),
        api.get("/fees?limit=100").then((res) => setFees(res.data.fees || [])).catch(() => setFees([])),
      ]).finally(() => setLoadingData(false))
    }
  }, [open])

  // Update max amount when fee changes
  useEffect(() => {
    if (selectedFeeId && fees.length > 0) {
      const fee = fees.find((f) => f.id === selectedFeeId)
      if (fee) {
        setSelectedFee(fee.id)
        // Optionally set amount to fee amount
        if (!payment) {
          setValue("amount", String(fee.amount))
        }
      }
    }
  }, [selectedFeeId, fees, payment, setValue])

  useEffect(() => {
    if (open) {
      if (payment) {
        const paymentDate = new Date(payment.paymentDate)
        const dateString = paymentDate.toISOString().split("T")[0]
        reset({
          studentId: payment.studentId || "",
          feeId: payment.feeId || "",
          amount: payment.amount ? String(payment.amount) : "",
          paymentDate: dateString,
          paymentMethod: payment.paymentMethod || "cash",
          transactionId: payment.transactionId || "",
          status: payment.status || "pending",
          remarks: payment.remarks || "",
        })
        setSelectedFee(payment.feeId)
      } else {
        const today = new Date().toISOString().split("T")[0]
        reset({
          paymentDate: today,
          paymentMethod: "cash",
          status: "pending",
        })
        setSelectedFee("")
      }
      setError(null)
    } else {
      reset()
      setError(null)
      setSelectedFee("")
    }
  }, [open, payment, reset])

  const onSubmit = async (data: PaymentFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const amount = parseFloat(data.amount)

      if (isNaN(amount) || amount < 0) {
        setError("Please enter a valid amount")
        setIsSubmitting(false)
        return
      }

      // Validate amount against fee amount
      const fee = fees.find((f) => f.id === data.feeId)
      if (fee && amount > Number(fee.amount)) {
        setError(`Payment amount cannot exceed fee amount of ${Number(fee.amount).toFixed(2)}`)
        setIsSubmitting(false)
        return
      }

      const cleanedData: any = {
        studentId: data.studentId,
        feeId: data.feeId,
        amount: amount,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId?.trim() || undefined,
        status: data.status,
        remarks: data.remarks?.trim() || undefined,
      }

      if (payment) {
        await api.patch(`/payments/${payment.id}`, cleanedData)
        toast({
          variant: "success",
          title: "Payment Updated",
          description: "Payment has been updated successfully.",
        })
      } else {
        await api.post("/payments", cleanedData)
        toast({
          variant: "success",
          title: "Payment Created",
          description: "Payment has been created successfully.",
        })
      }
      
      reset()
      setError(null)
      onOpenChange(false)
      setTimeout(() => {
        onSuccess()
      }, 100)
    } catch (error: any) {
      console.error("Error saving payment:", error)
      let errorMessage = "Failed to save payment. Please try again."
      
      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details
            .map((err: any) => {
              const field = err.path?.join(".") || "field"
              return `${field}: ${err.message}`
            })
            .join(", ")
          errorMessage = `Validation errors: ${validationErrors}`
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
      }
      
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: payment ? "Update Failed" : "Creation Failed",
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedFeeData = fees.find((f) => f.id === selectedFeeId)
  const maxAmount = selectedFeeData ? Number(selectedFeeData.amount) : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{payment ? "Edit Payment" : "Add New Payment"}</DialogTitle>
          <DialogDescription>
            {payment ? "Update payment information." : "Fill in the details to add a new payment."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="studentId">
                  Student <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("studentId") || ""}
                  onValueChange={(value) => setValue("studentId", value)}
                  disabled={loadingData || !!payment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} ({student.admissionNumber})
                        {student.class && ` - ${student.class.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.studentId && (
                  <p className="text-sm text-destructive">{errors.studentId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="feeId">
                  Fee <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("feeId") || ""}
                  onValueChange={(value) => {
                    setValue("feeId", value)
                    setSelectedFee(value)
                  }}
                  disabled={loadingData || !!payment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fee" />
                  </SelectTrigger>
                  <SelectContent>
                    {fees.map((fee) => (
                      <SelectItem key={fee.id} value={fee.id}>
                        {fee.name} - {Number(fee.amount).toFixed(2)}
                        {fee.class && ` (${fee.class.name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.feeId && (
                  <p className="text-sm text-destructive">{errors.feeId.message}</p>
                )}
                {selectedFeeData && (
                  <p className="text-sm text-muted-foreground">
                    Fee Amount: {Number(selectedFeeData.amount).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  max={maxAmount}
                  {...register("amount")}
                  placeholder="Enter amount"
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
                {maxAmount && (
                  <p className="text-sm text-muted-foreground">
                    Maximum: {maxAmount.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDate">
                  Payment Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="paymentDate"
                  type="date"
                  {...register("paymentDate")}
                />
                {errors.paymentDate && (
                  <p className="text-sm text-destructive">{errors.paymentDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">
                  Payment Method <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("paymentMethod") || "cash"}
                  onValueChange={(value) => setValue("paymentMethod", value as "cash" | "card" | "bank_transfer" | "online")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
                {errors.paymentMethod && (
                  <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("status") || "pending"}
                  onValueChange={(value) => setValue("status", value as "pending" | "completed" | "failed" | "refunded")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-destructive">{errors.status.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                <Input
                  id="transactionId"
                  {...register("transactionId")}
                  placeholder="Enter transaction ID"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Input
                  id="remarks"
                  {...register("remarks")}
                  placeholder="Enter remarks"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {payment ? "Update Payment" : "Create Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

