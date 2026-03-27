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

const classSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100),
  level: z.string().optional().or(z.literal("")),
  capacity: z.coerce.number().int().positive("Capacity must be a positive number"),
  classTeacherId: z.string().optional().or(z.literal("none")),
  status: z.enum(["active", "inactive"]),
})

type ClassFormData = z.infer<typeof classSchema>

interface ClassFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classData?: any
  onSuccess: () => void
}

export function ClassFormDialog({
  open,
  onOpenChange,
  classData,
  onSuccess,
}: ClassFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teachers, setTeachers] = useState<any[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      status: "active" as const,
      capacity: 40,
    },
  })

  // Fetch teachers
  useEffect(() => {
    if (open) {
      setLoadingTeachers(true)
      api
        .get("/staff?limit=100")
        .then((res) => {
          setTeachers(res.data.staff || [])
        })
        .catch(() => {
          setTeachers([])
        })
        .finally(() => {
          setLoadingTeachers(false)
        })
    }
  }, [open])

  // Load class data when editing
  useEffect(() => {
    if (open) {
      if (classData) {
        reset({
          name: classData.name || "",
          level: classData.level ? String(classData.level) : "",
          capacity: classData.capacity || 40,
          classTeacherId: classData.classTeacherId || "none",
          status: classData.status || "active",
        })
      } else {
        reset({
          status: "active",
          capacity: 40,
        })
      }
      setError(null)
    } else {
      // Reset form when dialog closes
      reset()
      setError(null)
    }
  }, [open, classData, reset])

  const onSubmit = async (data: ClassFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Clean up form data
      const cleanedData: any = {
        name: data.name.trim(),
        capacity: data.capacity,
        status: data.status || "active",
        level: data.level && data.level.trim() !== "" ? parseInt(data.level) : undefined,
        classTeacherId: data.classTeacherId && data.classTeacherId !== "none" ? data.classTeacherId : undefined,
      }

      if (classData) {
        // Update
        await api.patch(`/classes/${classData.id}`, cleanedData)
        toast({
          variant: "success",
          title: "Class Updated",
          description: `${cleanedData.name} has been updated successfully.`,
        })
      } else {
        // Create
        await api.post("/classes", cleanedData)
        toast({
          variant: "success",
          title: "Class Created",
          description: `${cleanedData.name} has been added successfully.`,
        })
      }
      
      // Reset form and close dialog
      reset()
      setError(null)
      onOpenChange(false)
      // Call onSuccess after a small delay to ensure dialog is closed
      setTimeout(() => {
        onSuccess()
      }, 100)
    } catch (error: any) {
      console.error("Error saving class:", error)
      
      // Handle validation errors with details
      let errorMessage = "Failed to save class. Please try again."
      let errorTitle = classData ? "Update Failed" : "Creation Failed"
      
      if (error.response?.data) {
        const errorData = error.response.data
        
        // If there are validation details, show them
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
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: errorTitle,
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
          <DialogTitle>{classData ? "Edit Class" : "Add New Class"}</DialogTitle>
          <DialogDescription>
            {classData
              ? "Update class information."
              : "Fill in the details to add a new class."}
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
                  Class Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., Grade 1, Class 1"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Level (Optional)</Label>
                <Input
                  id="level"
                  type="number"
                  min="1"
                  {...register("level")}
                  placeholder="e.g., 1, 2, 3"
                />
                {errors.level && (
                  <p className="text-sm text-destructive">{errors.level.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">
                  Capacity <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  {...register("capacity")}
                  placeholder="Enter capacity"
                />
                {errors.capacity && (
                  <p className="text-sm text-destructive">{errors.capacity.message}</p>
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="classTeacherId">Class Teacher (Optional)</Label>
                <Select
                  value={watch("classTeacherId") || "none"}
                  onValueChange={(value) => setValue("classTeacherId", value)}
                  disabled={loadingTeachers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Class Teacher</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName} - {teacher.designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              {classData ? "Update Class" : "Create Class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

