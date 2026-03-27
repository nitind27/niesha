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
import { Textarea } from "@/components/ui/textarea"
import api from "@/lib/api"
import { Loader2, Calendar, Clock, CheckCircle2, Sparkles } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { format, addDays, isAfter, startOfDay } from "date-fns"

const demoRequestSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required").max(50),
  schoolName: z.string().max(200).optional(),
  schoolType: z.string().optional(),
  position: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  preferredDate: z.string().min(1, "Please select a date"),
  preferredTime: z.string().min(1, "Please select a time slot"),
  message: z.string().max(1000).optional(),
})

type DemoFormData = z.infer<typeof demoRequestSchema>

interface DemoBookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Available time slots
const TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
]

// School types
const SCHOOL_TYPES = [
  "Primary School",
  "Secondary School",
  "High School",
  "College",
  "University",
  "Other",
]

// Positions
const POSITIONS = [
  "Principal",
  "Vice Principal",
  "Administrator",
  "School Owner",
  "IT Manager",
  "Academic Coordinator",
  "Other",
]

export function DemoBookingModal({ open, onOpenChange }: DemoBookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<DemoFormData>({
    resolver: zodResolver(demoRequestSchema),
  })

  const preferredDate = watch("preferredDate")
  const preferredTime = watch("preferredTime")

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      reset()
      setIsSuccess(false)
      setSelectedDate(null)
    }
  }, [open, reset])

  // Generate available dates (next 30 days, excluding weekends)
  const getAvailableDates = () => {
    const dates: Date[] = []
    const today = startOfDay(new Date())
    
    for (let i = 1; i <= 30; i++) {
      const date = addDays(today, i)
      const dayOfWeek = date.getDay()
      // Exclude weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dates.push(date)
      }
    }
    
    return dates
  }

  const availableDates = getAvailableDates()

  const onSubmit = async (data: DemoFormData) => {
    setIsSubmitting(true)
    try {
      const payload = {
        ...data,
        schoolName: data.schoolName || null,
        schoolType: data.schoolType || null,
        position: data.position || null,
        country: data.country || null,
        state: data.state || null,
        city: data.city || null,
        message: data.message || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }

      const response = await api.post("/demo-requests", payload)
      
      setIsSuccess(true)
      
      toast({
        title: "Demo Request Submitted!",
        description: "We'll contact you soon to confirm your demo session.",
      })

      // Reset form after 2 seconds
      setTimeout(() => {
        setIsSuccess(false)
        reset()
        onOpenChange(false)
      }, 2000)
    } catch (error: any) {
      let errorMessage = "An error occurred"
      
      if (error.response?.data) {
        if (error.response.data.details && Array.isArray(error.response.data.details)) {
          const validationErrors = error.response.data.details
            .map((err: any) => `${err.path.join(".")}: ${err.message}`)
            .join(", ")
          errorMessage = `Validation failed: ${validationErrors}`
        } else {
          errorMessage = error.response.data.error || errorMessage
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-purple-600/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                      Schedule a Demo
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      Book a personalized demo session and see how we can transform your school management
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        {...register("firstName")}
                        placeholder="Enter your first name"
                        className="h-11"
                      />
                      {errors.firstName && (
                        <p className="text-sm text-red-500">{errors.firstName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        {...register("lastName")}
                        placeholder="Enter your last name"
                        className="h-11"
                      />
                      {errors.lastName && (
                        <p className="text-sm text-red-500">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        placeholder="your.email@example.com"
                        className="h-11"
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Phone <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...register("phone")}
                        placeholder="+1 (234) 567-890"
                        className="h-11"
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-500">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* School Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    School Information
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schoolName">School Name</Label>
                      <Input
                        id="schoolName"
                        {...register("schoolName")}
                        placeholder="Enter school name"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="schoolType">School Type</Label>
                      <Select
                        value={watch("schoolType") || ""}
                        onValueChange={(value) => setValue("schoolType", value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select school type" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCHOOL_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        {...register("country")}
                        placeholder="Country"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        {...register("state")}
                        placeholder="State"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        {...register("city")}
                        placeholder="City"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Your Position</Label>
                    <Select
                      value={watch("position") || ""}
                      onValueChange={(value) => setValue("position", value)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select your position" />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {pos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Meeting Schedule */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Select Meeting Time
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="preferredDate">
                        Preferred Date <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={preferredDate || ""}
                        onValueChange={(value) => {
                          setValue("preferredDate", value)
                          setSelectedDate(new Date(value))
                        }}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select a date" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {availableDates.map((date) => (
                            <SelectItem key={date.toISOString()} value={date.toISOString()}>
                              {format(date, "EEEE, MMMM d, yyyy")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.preferredDate && (
                        <p className="text-sm text-red-500">{errors.preferredDate.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferredTime">
                        Preferred Time <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={preferredTime || ""}
                        onValueChange={(value) => setValue("preferredTime", value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select a time slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.preferredTime && (
                        <p className="text-sm text-red-500">{errors.preferredTime.message}</p>
                      )}
                    </div>
                  </div>

                  {preferredDate && preferredTime && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg bg-primary/10 border border-primary/20"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          Selected: {format(new Date(preferredDate), "EEEE, MMMM d, yyyy")} at {preferredTime}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Additional Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">Additional Message (Optional)</Label>
                  <Textarea
                    id="message"
                    {...register("message")}
                    placeholder="Tell us about your specific requirements or questions..."
                    className="min-h-[100px] resize-none"
                    maxLength={1000}
                  />
                  {errors.message && (
                    <p className="text-sm text-red-500">{errors.message.message}</p>
                  )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule Demo
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="mb-6"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">Demo Request Submitted!</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Thank you for your interest! We&apos;ve received your demo request and will contact you soon to confirm your session.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>Check your email for confirmation details</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

