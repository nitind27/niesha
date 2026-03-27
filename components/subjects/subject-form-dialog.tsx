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

const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").max(100),
  code: z.string().max(50).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  classId: z.string().optional().or(z.literal("none")),
  teacherId: z.string().optional().or(z.literal("none")),
  credits: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
})

type SubjectFormData = z.infer<typeof subjectSchema>

interface SubjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject?: any
  onSuccess: () => void
}

export function SubjectFormDialog({
  open,
  onOpenChange,
  subject,
  onSuccess,
}: SubjectFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teachers, setTeachers] = useState<any[]>([])
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
  } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      status: "active" as const,
    },
  })

  useEffect(() => {
    if (open) {
      setLoadingData(true)
      Promise.all([
        api.get("/staff?limit=100").then((res) => setTeachers(res.data.staff || [])).catch(() => setTeachers([])),
        api.get("/classes?limit=100").then((res) => setClasses(res.data.classes || [])).catch(() => setClasses([])),
      ]).finally(() => setLoadingData(false))
    }
  }, [open])

  useEffect(() => {
    if (open) {
      if (subject) {
        reset({
          name: subject.name || "",
          code: subject.code || "",
          description: subject.description || "",
          classId: subject.classId || "none",
          teacherId: subject.teacherId || "none",
          credits: subject.credits ? String(subject.credits) : "",
          status: subject.status || "active",
        })
      } else {
        reset({
          status: "active",
        })
      }
      setError(null)
    } else {
      reset()
      setError(null)
    }
  }, [open, subject, reset])

  const onSubmit = async (data: SubjectFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const cleanedData: any = {
        name: data.name.trim(),
        status: data.status || "active",
        code: data.code?.trim() || undefined,
        description: data.description?.trim() || undefined,
        classId: data.classId && data.classId !== "none" ? data.classId : undefined,
        teacherId: data.teacherId && data.teacherId !== "none" ? data.teacherId : undefined,
        credits: data.credits && data.credits.trim() !== "" ? parseInt(data.credits) : undefined,
      }

      if (subject) {
        await api.patch(`/subjects/${subject.id}`, cleanedData)
        toast({
          variant: "success",
          title: "Subject Updated",
          description: `${cleanedData.name} has been updated successfully.`,
        })
      } else {
        await api.post("/subjects", cleanedData)
        toast({
          variant: "success",
          title: "Subject Created",
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
      console.error("Error saving subject:", error)
      let errorMessage = "Failed to save subject. Please try again."
      
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
        title: subject ? "Update Failed" : "Creation Failed",
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
          <DialogTitle>{subject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
          <DialogDescription>
            {subject ? "Update subject information." : "Fill in the details to add a new subject."}
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
                  Subject Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., Mathematics, English"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Subject Code (Optional)</Label>
                <Input
                  id="code"
                  {...register("code")}
                  placeholder="e.g., MATH101"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="classId">Class (Optional)</Label>
                <Select
                  value={watch("classId") || "none"}
                  onValueChange={(value) => setValue("classId", value)}
                  disabled={loadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Class</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacherId">Teacher (Optional)</Label>
                <Select
                  value={watch("teacherId") || "none"}
                  onValueChange={(value) => setValue("teacherId", value)}
                  disabled={loadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Teacher</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName} - {teacher.designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credits">Credits (Optional)</Label>
                <Input
                  id="credits"
                  type="number"
                  min="0"
                  {...register("credits")}
                  placeholder="Enter credits"
                />
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="Enter subject description"
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
              {subject ? "Update Subject" : "Create Subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

