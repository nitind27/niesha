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

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["general", "academic", "event", "emergency"], {
    errorMap: () => ({ message: "Please select a type" }),
  }),
  targetAudience: z.array(z.string()).min(1, "At least one target audience is required"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  isPublished: z.boolean(),
})

type AnnouncementFormData = z.infer<typeof announcementSchema>

interface AnnouncementFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  announcement?: any
  onSuccess: () => void
}

const AVAILABLE_ROLES = [
  { value: "all", label: "All" },
  { value: "student", label: "Students" },
  { value: "parent", label: "Parents" },
  { value: "teacher", label: "Teachers" },
  { value: "principal", label: "Principal" },
  { value: "school_admin", label: "School Admin" },
]

export function AnnouncementFormDialog({
  open,
  onOpenChange,
  announcement,
  onSuccess,
}: AnnouncementFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      priority: "normal",
      isPublished: false,
      targetAudience: ["all"],
    },
  })

  const selectedAudience = watch("targetAudience") || []

  useEffect(() => {
    if (open) {
      if (announcement) {
        const startDate = announcement.startDate ? new Date(announcement.startDate).toISOString().split("T")[0] : ""
        const endDate = announcement.endDate ? new Date(announcement.endDate).toISOString().split("T")[0] : ""
        const targetAudience = announcement.targetAudience
          ? (Array.isArray(announcement.targetAudience) ? announcement.targetAudience : [announcement.targetAudience])
          : ["all"]
        
        reset({
          title: announcement.title || "",
          content: announcement.content || "",
          type: announcement.type || "general",
          targetAudience: targetAudience,
          priority: announcement.priority || "normal",
          startDate: startDate,
          endDate: endDate,
          isPublished: announcement.isPublished ?? false,
        })
      } else {
        reset({
          title: "",
          content: "",
          type: "general",
          targetAudience: ["all"],
          priority: "normal",
          startDate: "",
          endDate: "",
          isPublished: false,
        })
      }
      setError(null)
    } else {
      reset()
      setError(null)
    }
  }, [open, announcement, reset])

  const handleAudienceChange = (role: string, checked: boolean) => {
    let updatedAudience: string[]
    
    if (role === "all") {
      updatedAudience = checked ? ["all"] : []
    } else {
      const currentAudience = selectedAudience.filter((r) => r !== "all")
      if (checked) {
        updatedAudience = [...currentAudience, role]
      } else {
        updatedAudience = currentAudience.filter((r) => r !== role)
      }
    }
    
    setValue("targetAudience", updatedAudience.length > 0 ? updatedAudience : ["all"])
  }

  const onSubmit = async (data: AnnouncementFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Validate dates
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate)
        const end = new Date(data.endDate)
        if (start > end) {
          setError("Start date cannot be after end date")
          setIsSubmitting(false)
          return
        }
      }

      const cleanedData: any = {
        title: data.title.trim(),
        content: data.content.trim(),
        type: data.type,
        targetAudience: data.targetAudience.length > 0 ? data.targetAudience : ["all"],
        priority: data.priority,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        isPublished: data.isPublished,
      }

      if (announcement) {
        await api.patch(`/announcements/${announcement.id}`, cleanedData)
        toast({
          variant: "success",
          title: "Announcement Updated",
          description: "Announcement has been updated successfully.",
        })
      } else {
        await api.post("/announcements", cleanedData)
        toast({
          variant: "success",
          title: "Announcement Created",
          description: "Announcement has been created successfully.",
        })
      }
      
      reset()
      setError(null)
      onOpenChange(false)
      setTimeout(() => {
        onSuccess()
      }, 100)
    } catch (error: any) {
      console.error("Error saving announcement:", error)
      let errorMessage = "Failed to save announcement. Please try again."
      
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
        title: announcement ? "Update Failed" : "Creation Failed",
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{announcement ? "Edit Announcement" : "Add New Announcement"}</DialogTitle>
          <DialogDescription>
            {announcement ? "Update announcement information." : "Fill in the details to create a new announcement."}
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
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Enter announcement title"
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="content">
                  Content <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="content"
                  {...register("content")}
                  placeholder="Enter announcement content"
                  rows={6}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {errors.content && (
                  <p className="text-sm text-destructive">{errors.content.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("type") || "general"}
                  onValueChange={(value) => setValue("type", value as "general" | "academic" | "event" | "emergency")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-destructive">{errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">
                  Priority <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch("priority") || "normal"}
                  onValueChange={(value) => setValue("priority", value as "low" | "normal" | "high" | "urgent")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                {errors.priority && (
                  <p className="text-sm text-destructive">{errors.priority.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date (Optional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register("endDate")}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>
                  Target Audience <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3 p-4 border rounded-md">
                  {AVAILABLE_ROLES.map((role) => (
                    <div key={role.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`audience-${role.value}`}
                        checked={selectedAudience.includes(role.value)}
                        onCheckedChange={(checked) =>
                          handleAudienceChange(role.value, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`audience-${role.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {role.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.targetAudience && (
                  <p className="text-sm text-destructive">{errors.targetAudience.message}</p>
                )}
              </div>

              <div className="space-y-2 flex items-center gap-2">
                <Checkbox
                  id="isPublished"
                  checked={watch("isPublished")}
                  onCheckedChange={(checked) => setValue("isPublished", checked as boolean)}
                />
                <Label htmlFor="isPublished" className="cursor-pointer">
                  Publish immediately
                </Label>
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
              {announcement ? "Update Announcement" : "Create Announcement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

