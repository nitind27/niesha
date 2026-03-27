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
import { Checkbox } from "@/components/ui/checkbox"
import api from "@/lib/api"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const feeSchema = z.object({
  name: z.string().min(1, "Fee name is required").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  amount: z.string().min(1, "Amount is required"),
  frequency: z.enum(["monthly", "quarterly", "yearly", "one_time"], {
    errorMap: () => ({ message: "Please select a frequency" }),
  }),
  classId: z.string().optional().or(z.literal("")),
  isActive: z.boolean(),
  dueDate: z.string().optional().or(z.literal("")),
})

type FeeFormData = z.infer<typeof feeSchema>

interface FeeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fee?: any
  onSuccess: () => void
}

export function FeeFormDialog({
  open,
  onOpenChange,
  fee,
  onSuccess,
}: FeeFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FeeFormData>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      isActive: true,
      frequency: "monthly",
    },
  })

  useEffect(() => {
    if (open) {
      setLoadingData(true)
      api
        .get("/classes?limit=100")
        .then((res) => setClasses(res.data.classes || []))
        .catch(() => setClasses([]))
        .finally(() => setLoadingData(false))
    }
  }, [open])

  useEffect(() => {
    if (open) {
      if (fee) {
        const dueDate = fee.dueDate ? new Date(fee.dueDate).toISOString().split("T")[0] : ""
        reset({
          name: fee.name || "",
          description: fee.description || "",
          amount: fee.amount ? String(fee.amount) : "",
          frequency: fee.frequency || "monthly",
          classId: fee.classId || "",
          isActive: fee.isActive ?? true,
          dueDate: dueDate,
        })
      } else {
        reset({
          name: "",
          description: "",
          amount: "",
          frequency: "monthly",
          classId: "",
          isActive: true,
          dueDate: "",
        })
      }
      setError(null)
    } else {
      reset()
      setError(null)
    }
  }, [open, fee, reset])

  const onSubmit = async (data: FeeFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const amount = parseFloat(data.amount)

      if (isNaN(amount) || amount < 0) {
        setError("Please enter a valid amount")
        setIsSubmitting(false)
        return
      }

      const cleanedData: any = {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        amount: amount,
        frequency: data.frequency,
        classId: data.classId || undefined,
        isActive: data.isActive,
        dueDate: data.dueDate || undefined,
      }

      if (fee) {
        await api.patch(`/fees/${fee.id}`, cleanedData)
        toast({
          variant: "success",
          title: "Fee Updated",
          description: "Fee has been updated successfully.",
        })
      } else {
        await api.post("/fees", cleanedData)
        toast({
          variant: "success",
          title: "Fee Created",
          description: "Fee has been created successfully.",
        })
      }
      
      reset()
      setError(null)
      onOpenChange(false)
      setTimeout(() => {
        onSuccess()
      }, 100)
    } catch (error: any) {
      console.error("Error saving fee:", error)
      let errorMessage = "Failed to save fee. Please try again."
      
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
        title: fee ? "Update Failed" : "Creation Failed",
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{fee ? "Edit Fee" : "Add New Fee"}</DialogTitle>
          <DialogDescription>
            {fee ? "Update fee information." : "Fill in the details to add a new fee."}
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">
                  Fee Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., Tuition Fee, Admission Fee"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
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
                  {...register("amount")}
                  placeholder="Enter amount"
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">
                  Frequency <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("frequency") || "monthly"}
                  onValueChange={(value) => setValue("frequency", value as "monthly" | "quarterly" | "yearly" | "one_time")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="one_time">One Time</SelectItem>
                  </SelectContent>
                </Select>
                {errors.frequency && (
                  <p className="text-sm text-destructive">{errors.frequency.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="classId">Class (Optional)</Label>
                <Select
                  value={watch("classId") || "all"}
                  onValueChange={(value) => setValue("classId", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...register("dueDate")}
                />
              </div>

              <div className="space-y-2 flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={watch("isActive")}
                  onCheckedChange={(checked) => setValue("isActive", checked as boolean)}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active
                </Label>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="Enter description"
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
              {fee ? "Update Fee" : "Create Fee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

