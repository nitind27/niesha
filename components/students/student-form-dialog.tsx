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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import api from "@/lib/api"
import { Loader2, ChevronRight, ChevronLeft, Check, User, MapPin, GraduationCap, Users, Home } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

const studentSchema = z.object({
  admissionNumber: z.string().min(1, "Admission number is required").max(50),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Gender is required",
  }),
  bloodGroup: z.string().max(10).optional(),
  // Current Address
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  // Permanent Address
  permanentAddress: z.string().max(500).optional(),
  permanentCity: z.string().max(100).optional(),
  permanentState: z.string().max(100).optional(),
  permanentCountry: z.string().max(100).optional(),
  permanentZipCode: z.string().max(20).optional(),
  parentPhone: z.string().max(20).optional().or(z.literal("")),
  parentEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  classId: z.string().optional().or(z.literal("none")),
  sectionId: z.string().optional().or(z.literal("none")),
  status: z.enum(["active", "inactive", "graduated", "transferred"]),
})

type StudentFormData = z.infer<typeof studentSchema>

interface StudentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: any
  onSuccess: () => void
}

const STEPS = [
  { id: 1, title: "Basic Information", icon: User },
  { id: 2, title: "Current Address", icon: MapPin },
  { id: 3, title: "Permanent Address", icon: Home },
  { id: 4, title: "Academic Info", icon: GraduationCap },
  { id: 5, title: "Parent Details", icon: Users },
]

export function StudentFormDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
}: StudentFormDialogProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [classes, setClasses] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copyAddress, setCopyAddress] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      status: "active" as const,
    },
  })

  const selectedClassId = watch("classId")

  // Fetch classes
  useEffect(() => {
    if (open) {
      setLoadingClasses(true)
      api
        .get("/classes")
        .then((res) => {
          setClasses(res.data.classes || [])
        })
        .catch(() => {
          setClasses([])
        })
        .finally(() => {
          setLoadingClasses(false)
        })
    }
  }, [open])

  // Fetch sections when class changes
  useEffect(() => {
    if (selectedClassId) {
      api
        .get(`/classes/${selectedClassId}/sections`)
        .then((res) => {
          setSections(res.data.sections || [])
        })
        .catch(() => {
          setSections([])
        })
    } else {
      setSections([])
    }
  }, [selectedClassId])

  // Watch current address fields for copying
  const currentAddress = watch("address")
  const currentCity = watch("city")
  const currentState = watch("state")
  const currentCountry = watch("country")
  const currentZipCode = watch("zipCode")

  // Handle copy address checkbox
  useEffect(() => {
    if (copyAddress) {
      setValue("permanentAddress", currentAddress || "")
      setValue("permanentCity", currentCity || "")
      setValue("permanentState", currentState || "")
      setValue("permanentCountry", currentCountry || "")
      setValue("permanentZipCode", currentZipCode || "")
    }
  }, [copyAddress, currentAddress, currentCity, currentState, currentCountry, currentZipCode, setValue])

  // Load student data when editing
  useEffect(() => {
    if (open) {
      setCurrentStep(1) // Reset to first step
      setCopyAddress(false)
      if (student) {
        reset({
          admissionNumber: student.admissionNumber || "",
          firstName: student.firstName || "",
          lastName: student.lastName || "",
          dateOfBirth: student.dateOfBirth
            ? new Date(student.dateOfBirth).toISOString().split("T")[0]
            : "",
          gender: student.gender || "male",
          bloodGroup: student.bloodGroup || "",
          address: student.address || "",
          city: student.city || "",
          state: student.state || "",
          country: student.country || "",
          zipCode: student.zipCode || "",
          phone: student.phone || "",
          email: student.email || "",
          permanentAddress: student.permanentAddress || "",
          permanentCity: student.permanentCity || "",
          permanentState: student.permanentState || "",
          permanentCountry: student.permanentCountry || "",
          permanentZipCode: student.permanentZipCode || "",
          parentPhone: student.parentPhone || "",
          parentEmail: student.parentEmail || "",
          classId: student.classId || undefined,
          sectionId: student.sectionId || undefined,
          status: student.status || "active",
        })
        // Load sections if class is already selected
        if (student.classId) {
          api
            .get(`/classes/${student.classId}/sections`)
            .then((res) => {
              setSections(res.data.sections || [])
            })
            .catch(() => {
              setSections([])
            })
        }
      } else {
        reset({
          status: "active",
          gender: "male",
        })
        setSections([])
      }
      setError(null)
    } else {
      // Reset form when dialog closes
      reset()
      setError(null)
      setSections([])
      setCurrentStep(1)
      setCopyAddress(false)
    }
  }, [open, student, reset])

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
        if (!currentData.admissionNumber || !currentData.firstName || !currentData.lastName || !currentData.dateOfBirth || !currentData.gender) {
          setError("Please fill all required fields in Basic Information")
          return false
        }
        return true
      case 2: // Current Address
        return true // All optional
      case 3: // Permanent Address
        return true // All optional
      case 4: // Academic Info
        return true // All optional
      case 5: // Parent Details
        return true // All optional
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

  const onSubmit = async (data: StudentFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Clean up form data - convert "none" to undefined and handle empty strings
      const cleanedData: any = {
        admissionNumber: data.admissionNumber.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        status: data.status || "active",
        // Optional fields - convert empty strings to null/undefined
        bloodGroup: data.bloodGroup?.trim() || undefined,
        // Current Address
        address: data.address?.trim() || undefined,
        city: data.city?.trim() || undefined,
        state: data.state?.trim() || undefined,
        country: data.country?.trim() || undefined,
        zipCode: data.zipCode?.trim() || undefined,
        // Permanent Address
        permanentAddress: data.permanentAddress?.trim() || undefined,
        permanentCity: data.permanentCity?.trim() || undefined,
        permanentState: data.permanentState?.trim() || undefined,
        permanentCountry: data.permanentCountry?.trim() || undefined,
        permanentZipCode: data.permanentZipCode?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        email: data.email?.trim() || undefined,
        parentPhone: data.parentPhone?.trim() || undefined,
        parentEmail: data.parentEmail?.trim() || undefined,
        // Handle class and section - convert "none" to undefined
        classId: data.classId && data.classId !== "none" ? data.classId : undefined,
        sectionId: data.sectionId && data.sectionId !== "none" ? data.sectionId : undefined,
      }
      
      // Remove undefined values for optional fields to avoid sending them
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === undefined && 
            !["classId", "sectionId", "status"].includes(key)) {
          delete cleanedData[key]
        }
      })

      // Validate date of birth
      const dob = new Date(cleanedData.dateOfBirth)
      const today = new Date()
      if (dob >= today) {
        setError("Date of birth must be in the past")
        setIsSubmitting(false)
        return
      }

      // Validate age (should be reasonable for a student)
      const age = today.getFullYear() - dob.getFullYear()
      if (age < 3 || age > 25) {
        setError("Student age should be between 3 and 25 years")
        setIsSubmitting(false)
        return
      }

      if (student) {
        // Update
        const response = await api.patch(`/students/${student.id}`, cleanedData)
        toast({
          variant: "success",
          title: "Student Updated",
          description: `${cleanedData.firstName} ${cleanedData.lastName} has been updated successfully.`,
        })
      } else {
        // Create
        const response = await api.post("/students", cleanedData)
        toast({
          variant: "success",
          title: "Student Created",
          description: `${cleanedData.firstName} ${cleanedData.lastName} has been added successfully.`,
        })
      }
      
      // Reset form and close dialog
      reset()
      setError(null)
      setSections([])
      onOpenChange(false)
      // Call onSuccess after a small delay to ensure dialog is closed
      setTimeout(() => {
        onSuccess()
      }, 100)
    } catch (error: any) {
      console.error("Error saving student:", error)
      
      // Handle validation errors with details
      let errorMessage = "Failed to save student. Please try again."
      let errorTitle = student ? "Update Failed" : "Creation Failed"
      
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
        return renderCurrentAddress()
      case 3:
        return renderPermanentAddress()
      case 4:
        return renderAcademicInfo()
      case 5:
        return renderParentInfo()
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
        <p className="text-sm text-blue-700 dark:text-blue-300">Enter the student&apos;s basic personal information.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
              <Label htmlFor="admissionNumber">
                Admission Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="admissionNumber"
                {...register("admissionNumber")}
                placeholder="Enter admission number"
                disabled={!!student}
              />
              {errors.admissionNumber && (
                <p className="text-sm text-destructive">{errors.admissionNumber.message}</p>
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
                  <SelectItem value="graduated">Graduated</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
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
              <Label htmlFor="dateOfBirth">
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register("dateOfBirth")}
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">
                Gender <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch("gender")}
                onValueChange={(value) => setValue("gender", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-sm text-destructive">{errors.gender.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <Input
                id="bloodGroup"
                {...register("bloodGroup")}
                placeholder="e.g., A+, B-, O+"
              />
            </div>

      </div>
    </div>
  )

  const renderCurrentAddress = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Current Address & Contact Information
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">Enter the student&apos;s current residential address and contact details.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            {...register("phone")}
            placeholder="Enter phone number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
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
          <Label htmlFor="address">Current Address</Label>
          <Input
            id="address"
            {...register("address")}
            placeholder="Enter current address"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...register("city")} placeholder="Enter city" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" {...register("state")} placeholder="Enter state" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            {...register("country")}
            placeholder="Enter country"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zipCode">Zip Code</Label>
          <Input
            id="zipCode"
            {...register("zipCode")}
            placeholder="Enter zip code"
          />
        </div>
      </div>
    </div>
  )

  const renderPermanentAddress = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 p-4 border border-purple-200 dark:border-purple-800">
        <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
          <Home className="h-5 w-5" />
          Permanent Address
        </h3>
        <p className="text-sm text-purple-700 dark:text-purple-300">Enter the student&apos;s permanent address. You can copy from current address if same.</p>
      </div>
      
      <div className="flex items-center space-x-2 p-4 bg-accent rounded-lg border-2 border-dashed transition-all duration-300 hover:border-primary">
        <Checkbox
          id="copyAddress"
          checked={copyAddress}
          onCheckedChange={(checked) => {
            setCopyAddress(checked === true)
          }}
        />
        <Label
          htmlFor="copyAddress"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
        >
          Copy current address to permanent address
        </Label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="permanentAddress">Permanent Address</Label>
          <Input
            id="permanentAddress"
            {...register("permanentAddress")}
            placeholder="Enter permanent address"
            disabled={copyAddress}
            className={cn(copyAddress && "bg-muted")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="permanentCity">City</Label>
          <Input
            id="permanentCity"
            {...register("permanentCity")}
            placeholder="Enter city"
            disabled={copyAddress}
            className={cn(copyAddress && "bg-muted")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="permanentState">State</Label>
          <Input
            id="permanentState"
            {...register("permanentState")}
            placeholder="Enter state"
            disabled={copyAddress}
            className={cn(copyAddress && "bg-muted")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="permanentCountry">Country</Label>
          <Input
            id="permanentCountry"
            {...register("permanentCountry")}
            placeholder="Enter country"
            disabled={copyAddress}
            className={cn(copyAddress && "bg-muted")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="permanentZipCode">Zip Code</Label>
          <Input
            id="permanentZipCode"
            {...register("permanentZipCode")}
            placeholder="Enter zip code"
            disabled={copyAddress}
            className={cn(copyAddress && "bg-muted")}
          />
        </div>
      </div>
    </div>
  )

  const renderAcademicInfo = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 border border-green-200 dark:border-green-800">
        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Academic Information
        </h3>
        <p className="text-sm text-green-700 dark:text-green-300">Assign class and section for the student.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="classId">Class</Label>
              <Select
                value={watch("classId") || undefined}
                onValueChange={(value) => {
                  if (value === "none") {
                    setValue("classId", undefined)
                    setValue("sectionId", undefined)
                  } else {
                    setValue("classId", value)
                    setValue("sectionId", undefined)
                  }
                }}
                disabled={loadingClasses}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class (optional)" />
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
              <Label htmlFor="sectionId">Section</Label>
              <Select
                value={watch("sectionId") || undefined}
                onValueChange={(value) => {
                  if (value === "none") {
                    setValue("sectionId", undefined)
                  } else {
                    setValue("sectionId", value)
                  }
                }}
                disabled={!selectedClassId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Section</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
      </div>
    </div>
  )

  const renderParentInfo = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 p-4 border border-orange-200 dark:border-orange-800">
        <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Parent/Guardian Information
        </h3>
        <p className="text-sm text-orange-700 dark:text-orange-300">Enter parent or guardian contact details.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="parentPhone">Parent Phone</Label>
          <Input
            id="parentPhone"
            {...register("parentPhone")}
            placeholder="Enter parent phone number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="parentEmail">Parent Email</Label>
          <Input
            id="parentEmail"
            type="email"
            {...register("parentEmail")}
            placeholder="Enter parent email"
          />
          {errors.parentEmail && (
            <p className="text-sm text-destructive">{errors.parentEmail.message}</p>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle>{student ? "Edit Student" : "Add New Student"}</DialogTitle>
          <DialogDescription>
            {student
              ? "Update student information step by step."
              : "Fill in the details step by step to add a new student."}
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
                  {student ? "Update Student" : "Create Student"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

