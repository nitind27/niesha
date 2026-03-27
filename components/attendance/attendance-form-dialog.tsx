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

const attendanceSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["present", "absent", "late", "excused"], {
    errorMap: () => ({ message: "Please select a status" }),
  }),
  remarks: z.string().max(500).optional().or(z.literal("")),
})

type AttendanceFormData = z.infer<typeof attendanceSchema>

interface AttendanceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attendance?: any
  onSuccess: () => void
}

export function AttendanceFormDialog({
  open,
  onOpenChange,
  attendance,
  onSuccess,
}: AttendanceFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
  })

  useEffect(() => {
    if (open) {
      setLoadingData(true)
      api
        .get("/students?limit=100")
        .then((res) => setStudents(res.data.students || []))
        .catch(() => setStudents([]))
        .finally(() => setLoadingData(false))
    }
  }, [open])

  useEffect(() => {
    if (open) {
      if (attendance) {
        const date = new Date(attendance.date)
        const dateString = date.toISOString().split("T")[0]
        reset({
          studentId: attendance.studentId || "",
          date: dateString,
          status: attendance.status || "present",
          remarks: attendance.remarks || "",
        })
      } else {
        const today = new Date().toISOString().split("T")[0]
        reset({
          date: today,
          status: "present",
        })
      }
      setError(null)
    } else {
      reset()
      setError(null)
    }
  }, [open, attendance, reset])

  const onSubmit = async (data: AttendanceFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const cleanedData: any = {
        studentId: data.studentId,
        date: data.date,
        status: data.status,
        remarks: data.remarks?.trim() || undefined,
      }

      if (attendance) {
        await api.patch(`/attendance/${attendance.id}`, cleanedData)
        toast({
          variant: "success",
          title: "Attendance Updated",
          description: "Attendance record has been updated successfully.",
        })
      } else {
        await api.post("/attendance", cleanedData)
        toast({
          variant: "success",
          title: "Attendance Marked",
          description: "Attendance has been marked successfully.",
        })
      }
      
      reset()
      setError(null)
      onOpenChange(false)
      setTimeout(() => {
        onSuccess()
      }, 100)
    } catch (error: any) {
      console.error("Error saving attendance:", error)
      let errorMessage = "Failed to save attendance. Please try again."
      
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
        title: attendance ? "Update Failed" : "Creation Failed",
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
          <DialogTitle>{attendance ? "Edit Attendance" : "Mark Attendance"}</DialogTitle>
          <DialogDescription>
            {attendance ? "Update attendance information." : "Fill in the details to mark attendance."}
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
                  disabled={loadingData || !!attendance}
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
                <Label htmlFor="date">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  {...register("date")}
                />
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("status") || "present"}
                  onValueChange={(value) => setValue("status", value as "present" | "absent" | "late" | "excused")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="excused">Excused</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-destructive">{errors.status.message}</p>
                )}
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
              {attendance ? "Update Attendance" : "Mark Attendance"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

