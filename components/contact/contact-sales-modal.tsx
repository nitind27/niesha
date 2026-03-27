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
import { Loader2, Mail, Phone, Building2, MessageSquare, CheckCircle2, Sparkles, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"

const contactSalesSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required").max(50),
  company: z.string().max(200).optional(),
  position: z.string().max(100).optional(),
  schoolName: z.string().max(200).optional(),
  schoolType: z.string().optional(),
  numberOfStudents: z.string().optional(),
  inquiryType: z.string().min(1, "Please select an inquiry type"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
})

type ContactSalesFormData = z.infer<typeof contactSalesSchema>

interface ContactSalesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const INQUIRY_TYPES = [
  "Custom Plan Request",
  "Enterprise Solution",
  "Bulk Pricing",
  "Integration Questions",
  "Technical Support",
  "Partnership Inquiry",
  "Other",
]

const SCHOOL_TYPES = [
  "Primary School",
  "Secondary School",
  "High School",
  "College",
  "University",
  "Other",
]

const STUDENT_RANGES = [
  "1-100",
  "101-500",
  "501-1000",
  "1001-5000",
  "5000+",
]

export function ContactSalesModal({ open, onOpenChange }: ContactSalesModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ContactSalesFormData>({
    resolver: zodResolver(contactSalesSchema),
  })

  const inquiryType = watch("inquiryType")

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      reset()
      setIsSuccess(false)
    }
  }, [open, reset])

  const onSubmit = async (data: ContactSalesFormData) => {
    setIsSubmitting(true)
    try {
      // For now, we'll just show success. Later you can create an API endpoint
      // const response = await api.post("/contact-sales", payload)
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      setIsSuccess(true)
      
      toast({
        title: "Message Sent Successfully!",
        description: "Our sales team will contact you within 24 hours.",
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
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                      Contact Sales Team
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      Get in touch with our sales team for custom plans, enterprise solutions, or any questions
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
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
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          placeholder="your.email@example.com"
                          className="h-11 pl-10"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Phone <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          {...register("phone")}
                          placeholder="+1 (234) 567-890"
                          className="h-11 pl-10"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-sm text-red-500">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company/Organization</Label>
                      <Input
                        id="company"
                        {...register("company")}
                        placeholder="Enter company name"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="position">Your Position</Label>
                      <Input
                        id="position"
                        {...register("position")}
                        placeholder="e.g., Principal, Admin, Owner"
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* School Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
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

                  <div className="space-y-2">
                    <Label htmlFor="numberOfStudents">Number of Students</Label>
                    <Select
                      value={watch("numberOfStudents") || ""}
                      onValueChange={(value) => setValue("numberOfStudents", value)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select student range" />
                      </SelectTrigger>
                      <SelectContent>
                        {STUDENT_RANGES.map((range) => (
                          <SelectItem key={range} value={range}>
                            {range} students
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Inquiry Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Inquiry Details
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="inquiryType">
                      Inquiry Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={inquiryType || ""}
                      onValueChange={(value) => setValue("inquiryType", value)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select inquiry type" />
                      </SelectTrigger>
                      <SelectContent>
                        {INQUIRY_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.inquiryType && (
                      <p className="text-sm text-red-500">{errors.inquiryType.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Message <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      {...register("message")}
                      placeholder="Tell us about your requirements, questions, or how we can help you..."
                      className="min-h-[120px] resize-none"
                      maxLength={2000}
                    />
                    {errors.message && (
                      <p className="text-sm text-red-500">{errors.message.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {watch("message")?.length || 0} / 2000 characters
                    </p>
                  </div>
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
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Message
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
              <h3 className="text-2xl font-bold mb-2">Message Sent Successfully!</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Thank you for contacting us! Our sales team will get back to you within 24 hours with a personalized solution.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Check your email for confirmation</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

