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
import { Loader2, ChevronRight, ChevronLeft, Check, User, Briefcase, Phone } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

const staffSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required").max(50),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other"]).optional(),
  phone: z.string().min(1, "Phone is required").max(20),
  email: z.string().email("Invalid email"),
  address: z.string().max(500).optional().or(z.literal("")),
  designation: z.string().min(1, "Designation is required").max(100),
  department: z.string().max(100).optional().or(z.literal("")),
  joiningDate: z.string().optional().or(z.literal("")),
  salary: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "on_leave", "terminated", "inactive"]),
  experience: z.string().optional().or(z.literal("")),
})

type StaffFormData = z.infer<typeof staffSchema>

interface StaffFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff?: any
  onSuccess: () => void
}

const STEPS = [
  { id: 1, title: "Basic Information", icon: User },
  { id: 2, title: "Professional Details", icon: Briefcase },
  { id: 3, title: "Contact Information", icon: Phone },
]

const DESIGNATIONS = [
  "Teacher",
  "Principal",
  "Vice Principal",
  "Accountant",
  "HR Manager",
  "Librarian",
  "Transport Manager",
  "Security Guard",
  "Cleaner",
  "Clerk",
  "IT Support",
  "Other",
]

export function StaffFormDialog({
  open,
  onOpenChange,
  staff,
  onSuccess,
}: StaffFormDialogProps) {
  const [currentStep, setCurrentStep] = useState(1)
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
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      status: "active" as const,
    },
  })

  // Load staff data when editing
  useEffect(() => {
    if (open) {
      setCurrentStep(1)
      if (staff) {
        reset({
          employeeId: staff.employeeId || "",
          firstName: staff.firstName || "",
          lastName: staff.lastName || "",
          dateOfBirth: staff.dateOfBirth
            ? new Date(staff.dateOfBirth).toISOString().split("T")[0]
            : "",
          gender: staff.gender || undefined,
          phone: staff.phone || "",
          email: staff.email || "",
          address: staff.address || "",
          designation: staff.designation || "",
          department: staff.department || "",
          joiningDate: staff.joiningDate
            ? new Date(staff.joiningDate).toISOString().split("T")[0]
            : "",
          salary: staff.salary ? String(staff.salary) : "",
          status: staff.status || "active",
          experience: staff.experience ? String(staff.experience) : "",
        })
      } else {
        reset({
          status: "active",
        })
      }
      setError(null)
    } else {
      // Reset form when dialog closes
      reset()
      setError(null)
      setCurrentStep(1)
    }
  }, [open, staff, reset])

  // Step navigation
  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Validate current step before proceeding
  const validateStep = (step: number): boolean => {
    const currentData = watch()
    
    switch (step) {
      case 1: // Basic Information
        if (!currentData.employeeId || !currentData.firstName || !currentData.lastName) {
          setError("Please fill all required fields in Basic Information")
          return false
        }
        return true
      case 2: // Professional Details
        if (!currentData.designation) {
          setError("Please fill all required fields in Professional Details")
          return false
        }
        return true
      case 3: // Contact Information
        if (!currentData.phone || !currentData.email) {
          setError("Please fill all required fields in Contact Information")
          return false
        }
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setError(null)
      nextStep()
    }
  }

  const onSubmit = async (data: StaffFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Clean up form data - handle empty strings
      const cleanedData: any = {
        employeeId: data.employeeId.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        designation: data.designation.trim(),
        status: data.status || "active",
        // Optional fields - convert empty strings to undefined
        dateOfBirth: data.dateOfBirth?.trim() || undefined,
        gender: data.gender || undefined,
        address: data.address?.trim() || undefined,
        department: data.department?.trim() || undefined,
        joiningDate: data.joiningDate?.trim() || undefined,
        salary: data.salary?.trim() ? parseFloat(data.salary) : undefined,
        experience: data.experience?.trim() ? parseInt(data.experience) : undefined,
      }
      
      // Remove undefined values for optional fields
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === undefined && 
            !["status", "gender"].includes(key)) {
          delete cleanedData[key]
        }
      })

      if (staff) {
        // Update
        await api.patch(`/staff/${staff.id}`, cleanedData)
        toast({
          variant: "success",
          title: "Staff Updated",
          description: `${cleanedData.firstName} ${cleanedData.lastName} has been updated successfully.`,
        })
      } else {
        // Create
        await api.post("/staff", cleanedData)
        toast({
          variant: "success",
          title: "Staff Created",
          description: `${cleanedData.firstName} ${cleanedData.lastName} has been added successfully.`,
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
      console.error("Error saving staff:", error)
      
      // Handle validation errors with details
      let errorMessage = "Failed to save staff. Please try again."
      let errorTitle = staff ? "Update Failed" : "Creation Failed"
      
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

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfo()
      case 2:
        return renderProfessionalInfo()
      case 3:
        return renderContactInfo()
      default:
        return null
    }
  }

  const renderBasicInfo = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
          <User className="h-5 w-5" />
          Basic Information
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">Enter the staff member&apos;s basic personal information.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="employeeId">
            Employee ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="employeeId"
            {...register("employeeId")}
            placeholder="Enter employee ID"
            disabled={!!staff}
          />
          {errors.employeeId && (
            <p className="text-sm text-destructive">{errors.employeeId.message}</p>
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
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstName">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            {...register("firstName")}
            placeholder="Enter first name"
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            {...register("lastName")}
            placeholder="Enter last name"
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            {...register("dateOfBirth")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={watch("gender") || ""}
            onValueChange={(value) => setValue("gender", value === "" ? undefined : value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )

  const renderProfessionalInfo = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 border border-green-200 dark:border-green-800">
        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Professional Information
        </h3>
        <p className="text-sm text-green-700 dark:text-green-300">Enter the staff member&apos;s professional details.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="designation">
            Designation <span className="text-destructive">*</span>
          </Label>
          <Select
            value={watch("designation") || ""}
            onValueChange={(value) => setValue("designation", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select designation" />
            </SelectTrigger>
            <SelectContent>
              {DESIGNATIONS.map((des) => (
                <SelectItem key={des} value={des}>
                  {des}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.designation && (
            <p className="text-sm text-destructive">{errors.designation.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            {...register("department")}
            placeholder="Enter department (optional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="joiningDate">Joining Date</Label>
          <Input
            id="joiningDate"
            type="date"
            {...register("joiningDate")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience">Experience (years)</Label>
          <Input
            id="experience"
            type="number"
            min="0"
            {...register("experience")}
            placeholder="Enter years of experience"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="salary">Salary</Label>
          <Input
            id="salary"
            type="number"
            min="0"
            step="0.01"
            {...register("salary")}
            placeholder="Enter salary (optional)"
          />
        </div>
      </div>
    </div>
  )

  const renderContactInfo = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 p-4 border border-purple-200 dark:border-purple-800">
        <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Contact Information
        </h3>
        <p className="text-sm text-purple-700 dark:text-purple-300">Enter the staff member&apos;s contact details.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            {...register("phone")}
            placeholder="Enter phone number"
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="Enter email address"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            {...register("address")}
            placeholder="Enter address (optional)"
          />
        </div>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle>{staff ? "Edit Staff" : "Add New Staff"}</DialogTitle>
          <DialogDescription>
            {staff
              ? "Update staff information step by step."
              : "Fill in the details step by step to add a new staff member."}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              const isLast = index === STEPS.length - 1

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                        isCompleted
                          ? "bg-primary border-primary text-primary-foreground"
                          : isActive
                          ? "bg-primary border-primary text-primary-foreground scale-110"
                          : "bg-background border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-2 text-xs font-medium text-center max-w-[80px] transition-colors",
                        isActive || isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-2 transition-all duration-300",
                        isCompleted ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-1">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 mb-4 animate-shake">
                {error}
              </div>
            )}
            
            {/* Step Content with Animation */}
            <div className="min-h-[400px]">
              {renderStepContent()}
            </div>
          </div>

          <DialogFooter className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (currentStep > 1) {
                    prevStep()
                    setError(null)
                  } else {
                    onOpenChange(false)
                  }
                }}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                {currentStep > 1 ? "Previous" : "Cancel"}
              </Button>

              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {STEPS.length}
              </div>

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {staff ? "Update Staff" : "Create Staff"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

