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

const examSchema = z.object({
  name: z.string().min(1, "Exam name is required").max(100),
  type: z.enum(["mid_term", "final", "quiz", "assignment"]),
  classId: z.string().min(1, "Class is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]),
  description: z.string().max(500).optional().or(z.literal("")),
  duration: z.number().int().positive().optional().nullable(),
  passingMarks: z.number().int().positive().optional().nullable(),
  shuffleQuestions: z.boolean().default(false),
  showResults: z.boolean().default(true),
})

type ExamFormData = z.infer<typeof examSchema>

interface ExamFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exam?: any
  onSuccess: () => void
}

export function ExamFormDialog({
  open,
  onOpenChange,
  exam,
  onSuccess,
}: ExamFormDialogProps) {
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
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      status: "scheduled" as const,
      type: "mid_term" as const,
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
      if (exam) {
        reset({
          name: exam.name || "",
          type: exam.type || "mid_term",
          classId: exam.classId || "",
          startDate: exam.startDate ? new Date(exam.startDate).toISOString().slice(0, 16) : "",
          endDate: exam.endDate ? new Date(exam.endDate).toISOString().slice(0, 16) : "",
          status: exam.status || "scheduled",
          description: exam.description || "",
          duration: exam.duration ?? null,
          passingMarks: exam.passingMarks ?? null,
          shuffleQuestions: exam.shuffleQuestions ?? false,
          showResults: exam.showResults ?? true,
        })
      } else {
        reset({ status: "scheduled", type: "mid_term", shuffleQuestions: false, showResults: true })
      }
      setError(null)
    } else {
      reset()
      setError(null)
    }
  }, [open, exam, reset])

  const onSubmit = async (data: ExamFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const cleanedData: any = {
        name: data.name.trim(),
        type: data.type,
        classId: data.classId,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status || "scheduled",
        description: data.description?.trim() || undefined,
        duration: data.duration ?? null,
        passingMarks: data.passingMarks ?? null,
        shuffleQuestions: data.shuffleQuestions ?? false,
        showResults: data.showResults ?? true,
      }

      if (exam) {
        await api.patch(`/exams/${exam.id}`, cleanedData)
        toast({
          variant: "success",
          title: "Exam Updated",
          description: `${cleanedData.name} has been updated successfully.`,
        })
      } else {
        await api.post("/exams", cleanedData)
        toast({
          variant: "success",
          title: "Exam Created",
          description: `${cleanedData.name} has been added successfully.`,
        })
      }
      
      reset()
      setError(null)
      onOpenChange(false)
      setTimeout(() => {
        onSuccess()
      }, 100)
    } catch (error: any) {
      console.error("Error saving exam:", error)
      let errorMessage = "Failed to save exam. Please try again."
      
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
        title: exam ? "Update Failed" : "Creation Failed",
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
          <DialogTitle>{exam ? "Edit Exam" : "Add New Exam"}</DialogTitle>
          <DialogDescription>
            {exam ? "Update exam information." : "Fill in the details to add a new exam."}
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
                <Label htmlFor="name">
                  Exam Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., Mid Term Exam 2024"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  Exam Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("type")}
                  onValueChange={(value) => setValue("type", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mid_term">Mid Term</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-destructive">{errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="classId">
                  Class <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("classId") || ""}
                  onValueChange={(value) => setValue("classId", value)}
                  disabled={loadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.classId && (
                  <p className="text-sm text-destructive">{errors.classId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  {...register("startDate")}
                />
                {errors.startDate && (
                  <p className="text-sm text-destructive">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  {...register("endDate")}
                />
                {errors.endDate && (
                  <p className="text-sm text-destructive">{errors.endDate.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="Enter exam description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes, optional)</Label>
                <Input id="duration" type="number" min={1} {...register("duration", { valueAsNumber: true })} placeholder="e.g. 60" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passingMarks">Passing Marks (optional)</Label>
                <Input id="passingMarks" type="number" min={1} {...register("passingMarks", { valueAsNumber: true })} placeholder="e.g. 40" />
              </div>

              <div className="flex items-center gap-3 md:col-span-2 pt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" {...register("shuffleQuestions")} className="rounded" />
                  Shuffle questions for each student
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer ml-6">
                  <input type="checkbox" {...register("showResults")} className="rounded" />
                  Show results to student after submission
                </label>
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
              {exam ? "Update Exam" : "Create Exam"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

