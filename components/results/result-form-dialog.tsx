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

const resultSchema = z.object({
  examId: z.string().min(1, "Exam is required"),
  studentId: z.string().min(1, "Student is required"),
  subjectId: z.string().min(1, "Subject is required"),
  marksObtained: z.string().min(1, "Marks obtained is required"),
  maxMarks: z.string().min(1, "Maximum marks is required"),
  grade: z.string().max(10).optional().or(z.literal("")),
  remarks: z.string().max(500).optional().or(z.literal("")),
})

type ResultFormData = z.infer<typeof resultSchema>

interface ResultFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  result?: any
  onSuccess: () => void
}

export function ResultFormDialog({
  open,
  onOpenChange,
  result,
  onSuccess,
}: ResultFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exams, setExams] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ResultFormData>({
    resolver: zodResolver(resultSchema),
  })

  const selectedExamId = watch("examId")

  useEffect(() => {
    if (open) {
      setLoadingData(true)
      Promise.all([
        api.get("/exams?limit=100").then((res) => setExams(res.data.exams || [])).catch(() => setExams([])),
        api.get("/students?limit=100").then((res) => setStudents(res.data.students || [])).catch(() => setStudents([])),
        api.get("/subjects?limit=100").then((res) => setSubjects(res.data.subjects || [])).catch(() => setSubjects([])),
      ]).finally(() => setLoadingData(false))
    }
  }, [open])

  // Filter subjects based on selected exam's class
  useEffect(() => {
    if (selectedExamId && exams.length > 0) {
      const selectedExam = exams.find((e) => e.id === selectedExamId)
      if (selectedExam?.classId) {
        api
          .get(`/subjects?limit=100&classId=${selectedExam.classId}`)
          .then((res) => setSubjects(res.data.subjects || []))
          .catch(() => setSubjects([]))
      }
    }
  }, [selectedExamId, exams])

  useEffect(() => {
    if (open) {
      if (result) {
        reset({
          examId: result.examId || "",
          studentId: result.studentId || "",
          subjectId: result.subjectId || "",
          marksObtained: result.marksObtained ? String(result.marksObtained) : "",
          maxMarks: result.maxMarks ? String(result.maxMarks) : "",
          grade: result.grade || "",
          remarks: result.remarks || "",
        })
      } else {
        reset({
          marksObtained: "",
          maxMarks: "100",
        })
      }
      setError(null)
    } else {
      reset()
      setError(null)
    }
  }, [open, result, reset])

  const onSubmit = async (data: ResultFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const marksObtained = parseFloat(data.marksObtained)
      const maxMarks = parseFloat(data.maxMarks)

      if (isNaN(marksObtained) || isNaN(maxMarks)) {
        setError("Please enter valid numbers for marks")
        setIsSubmitting(false)
        return
      }

      if (marksObtained > maxMarks) {
        setError("Marks obtained cannot be greater than maximum marks")
        setIsSubmitting(false)
        return
      }

      const cleanedData: any = {
        examId: data.examId,
        studentId: data.studentId,
        subjectId: data.subjectId,
        marksObtained: marksObtained,
        maxMarks: maxMarks,
        grade: data.grade?.trim() || undefined,
        remarks: data.remarks?.trim() || undefined,
      }

      if (result) {
        await api.patch(`/results/${result.id}`, cleanedData)
        toast({
          variant: "success",
          title: "Result Updated",
          description: "Result has been updated successfully.",
        })
      } else {
        await api.post("/results", cleanedData)
        toast({
          variant: "success",
          title: "Result Created",
          description: "Result has been added successfully.",
        })
      }
      
      reset()
      setError(null)
      onOpenChange(false)
      setTimeout(() => {
        onSuccess()
      }, 100)
    } catch (error: any) {
      console.error("Error saving result:", error)
      let errorMessage = "Failed to save result. Please try again."
      
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
        title: result ? "Update Failed" : "Creation Failed",
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate percentage and grade
  const marksObtained = watch("marksObtained")
  const maxMarks = watch("maxMarks")
  const percentage = marksObtained && maxMarks && !isNaN(parseFloat(marksObtained)) && !isNaN(parseFloat(maxMarks))
    ? ((parseFloat(marksObtained) / parseFloat(maxMarks)) * 100).toFixed(2)
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{result ? "Edit Result" : "Add New Result"}</DialogTitle>
          <DialogDescription>
            {result ? "Update result information." : "Fill in the details to add a new result."}
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
                <Label htmlFor="examId">
                  Exam <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("examId") || ""}
                  onValueChange={(value) => setValue("examId", value)}
                  disabled={loadingData || !!result}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.name} - {exam.class?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.examId && (
                  <p className="text-sm text-destructive">{errors.examId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId">
                  Student <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("studentId") || ""}
                  onValueChange={(value) => setValue("studentId", value)}
                  disabled={loadingData || !!result}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} ({student.admissionNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.studentId && (
                  <p className="text-sm text-destructive">{errors.studentId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectId">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("subjectId") || ""}
                  onValueChange={(value) => setValue("subjectId", value)}
                  disabled={loadingData || !selectedExamId || !!result}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name} {subject.code ? `(${subject.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subjectId && (
                  <p className="text-sm text-destructive">{errors.subjectId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxMarks">
                  Maximum Marks <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="maxMarks"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("maxMarks")}
                  placeholder="Enter maximum marks"
                />
                {errors.maxMarks && (
                  <p className="text-sm text-destructive">{errors.maxMarks.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="marksObtained">
                  Marks Obtained <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="marksObtained"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("marksObtained")}
                  placeholder="Enter marks obtained"
                />
                {errors.marksObtained && (
                  <p className="text-sm text-destructive">{errors.marksObtained.message}</p>
                )}
                {percentage && (
                  <p className="text-sm text-muted-foreground">
                    Percentage: {percentage}%
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grade (Optional)</Label>
                <Input
                  id="grade"
                  {...register("grade")}
                  placeholder="e.g., A+, A, B, C"
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
              {result ? "Update Result" : "Create Result"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

