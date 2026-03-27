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
import api from "@/lib/api"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ORGANIZATION_TYPES } from "@/lib/organization-labels"

const schoolSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(200),
  email: z.string().email("Invalid organization email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  // Admin user details
  adminEmail: z.string().email("Invalid admin email address"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
  adminFirstName: z.string().min(1, "First name is required").max(100),
  adminLastName: z.string().min(1, "Last name is required").max(100),
  adminPhone: z.string().optional(),
  // Subscription
  subscriptionPlan: z.string().optional(),
  maxUsers: z.number().int().positive().optional(),
  maxStudents: z.number().int().positive().optional(),
  organizationType: z.enum(["school", "company", "trust", "ngo", "other"]).optional(),
  industry: z.string().max(120).optional(),
})

type SchoolFormData = z.infer<typeof schoolSchema>

interface SchoolFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (meta?: { createdEmail?: string }) => void
}

export function SchoolFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: SchoolFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SchoolFormData>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      maxUsers: 50,
      maxStudents: 500,
      organizationType: "school",
      industry: "",
    },
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
        website: "",
        adminEmail: "",
        adminPassword: "",
        adminFirstName: "",
        adminLastName: "",
        adminPhone: "",
        subscriptionPlan: "",
        maxUsers: 50,
        maxStudents: 500,
        organizationType: "school",
        industry: "",
      })
    }
  }, [open, reset])

  const onSubmit = async (data: SchoolFormData) => {
    setIsSubmitting(true)
    try {
      const payload: any = {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        country: data.country?.trim() || null,
        zipCode: data.zipCode?.trim() || null,
        website: data.website && data.website.trim() !== "" ? data.website.trim() : null,
        adminEmail: data.adminEmail.trim(),
        adminPassword: data.adminPassword,
        adminFirstName: data.adminFirstName.trim(),
        adminLastName: data.adminLastName.trim(),
        adminPhone: data.adminPhone?.trim() || null,
        subscriptionPlan: data.subscriptionPlan || null,
        maxUsers: data.maxUsers || 50,
        maxStudents: data.maxStudents || 500,
        organizationType: data.organizationType || "school",
        industry:
          data.industry && data.industry.trim() !== "" ? data.industry.trim() : null,
      }

      await api.post("/schools", payload)

      const tenantAdminEmail = data.adminEmail.trim()
      toast({
        title: "Organization created",
        description: `A login tab opens with ${tenantAdminEmail} filled in — enter the tenant admin password to open their dashboard.`,
      })

      onSuccess({ createdEmail: tenantAdminEmail })
      onOpenChange(false)
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
        <DialogHeader>
          <DialogTitle>Create tenant organization</DialogTitle>
          <DialogDescription>
            Creates a new isolated workspace (school, company, trust, etc.) and a dedicated tenant administrator. That
            person signs in with the email and password below — same login page as everyone else.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Organization</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Organization name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Acme Corp, Sunrise Trust, City High School…"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Organization email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="contact@organization.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  {...register("website")}
                  placeholder="https://example.com"
                />
                {errors.website && (
                  <p className="text-sm text-red-500">{errors.website.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="Enter address"
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...register("city")}
                  placeholder="Enter city"
                />
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  {...register("state")}
                  placeholder="Enter state"
                />
                {errors.state && (
                  <p className="text-sm text-red-500">{errors.state.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  {...register("country")}
                  placeholder="Enter country"
                />
                {errors.country && (
                  <p className="text-sm text-red-500">{errors.country.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                {...register("zipCode")}
                placeholder="Enter zip code"
              />
              {errors.zipCode && (
                <p className="text-sm text-red-500">{errors.zipCode.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organizationType">Organization type</Label>
                <select
                  id="organizationType"
                  {...register("organizationType")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {ORGANIZATION_TYPES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry / focus (optional)</Label>
                <Input id="industry" {...register("industry")} placeholder="e.g. K-12, retail, NGO" />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Tenant administrator (login)</h3>
            <p className="text-sm text-muted-foreground rounded-md border border-dashed bg-muted/40 p-3">
              This user is the <strong>only</strong> admin for this tenant at first. They use{" "}
              <strong>admin email + password</strong> on the main login page — no separate URL. Role: full tenant
              admin (<span className="font-mono">school_admin</span>).
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminFirstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="adminFirstName"
                  {...register("adminFirstName")}
                  placeholder="Enter first name"
                />
                {errors.adminFirstName && (
                  <p className="text-sm text-red-500">{errors.adminFirstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminLastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="adminLastName"
                  {...register("adminLastName")}
                  placeholder="Enter last name"
                />
                {errors.adminLastName && (
                  <p className="text-sm text-red-500">{errors.adminLastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminEmail">
                  Admin sign-in email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="adminEmail"
                  type="email"
                  {...register("adminEmail")}
                  placeholder="admin@their-company.com"
                />
                {errors.adminEmail && (
                  <p className="text-sm text-red-500">{errors.adminEmail.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPassword">
                  Admin password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="adminPassword"
                  type="password"
                  {...register("adminPassword")}
                  placeholder="Enter password (min 6 characters)"
                />
                {errors.adminPassword && (
                  <p className="text-sm text-red-500">{errors.adminPassword.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPhone">Admin Phone</Label>
              <Input
                id="adminPhone"
                {...register("adminPhone")}
                placeholder="Enter phone number (optional)"
              />
              {errors.adminPhone && (
                <p className="text-sm text-red-500">{errors.adminPhone.message}</p>
              )}
            </div>
          </div>

          {/* Subscription Settings */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Subscription Settings</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
                <Input
                  id="subscriptionPlan"
                  {...register("subscriptionPlan")}
                  placeholder="Plan slug (optional)"
                />
                {errors.subscriptionPlan && (
                  <p className="text-sm text-red-500">{errors.subscriptionPlan.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUsers">Max Users</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  {...register("maxUsers", { valueAsNumber: true })}
                  placeholder="50"
                />
                {errors.maxUsers && (
                  <p className="text-sm text-red-500">{errors.maxUsers.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStudents">Max members (students / seats)</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  {...register("maxStudents", { valueAsNumber: true })}
                  placeholder="500"
                />
                {errors.maxStudents && (
                  <p className="text-sm text-red-500">{errors.maxStudents.message}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
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
              Create organization & admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

