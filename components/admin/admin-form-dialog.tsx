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

const adminSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .union([
      z.string().min(6, "Password must be at least 6 characters"),
      z.literal(""),
      z.undefined(),
    ])
    .optional(),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.union([z.string().max(50), z.literal(""), z.null()]).optional(),
  roleId: z.string().min(1, "Role is required"),
  schoolId: z.union([z.string(), z.literal("none")]).optional(),
  isActive: z.boolean(),
  language: z.string(),
})

type AdminFormData = z.infer<typeof adminSchema>

interface AdminFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  admin?: any
  /** Pass `{ createdEmail }` after creating a user so the parent can open login with that email. */
  onSuccess: (meta?: { createdEmail?: string }) => void
}

export function AdminFormDialog({
  open,
  onOpenChange,
  admin,
  onSuccess,
}: AdminFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roles, setRoles] = useState<any[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      isActive: true,
      language: "en",
    },
  })

  const selectedRoleId = watch("roleId")

  // Fetch roles and schools
  useEffect(() => {
    if (open) {
      setLoadingData(true)
      Promise.all([
        api.get("/admin/roles").then((res) => res.data.roles || []),
        api.get("/schools").then((res) => res.data?.schools || []).catch(() => []),
      ])
        .then(([rolesData, schoolsData]) => {
          setRoles(rolesData)
          setSchools(schoolsData)
        })
        .catch(() => {
          setRoles([])
          setSchools([])
        })
        .finally(() => {
          setLoadingData(false)
        })
    }
  }, [open])

  // Reset form when admin changes
  useEffect(() => {
    if (open) {
      if (admin) {
        reset({
          email: admin.email,
          password: "",
          firstName: admin.firstName,
          lastName: admin.lastName,
          phone: admin.phone || "",
          roleId: admin.roleId ?? admin.role?.id ?? "",
          schoolId: admin.schoolId ?? (admin.school?.id || "none"),
          isActive: admin.isActive,
          language: admin.language || "en",
        })
      } else {
        reset({
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          phone: "",
          roleId: "",
          schoolId: "none",
          isActive: true,
          language: "en",
        })
      }
    }
  }, [admin, open, reset])

  const onSubmit = async (data: AdminFormData) => {
    // Validate required fields before submitting
    if (!data.roleId || data.roleId.trim() === "") {
      toast({
        title: "Validation Error",
        description: "Please select a role",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const payload: any = {
        email: data.email.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone && data.phone.trim() !== "" ? data.phone.trim() : null,
        roleId: data.roleId.trim(),
        schoolId: data.schoolId === "none" || !data.schoolId ? null : data.schoolId,
        isActive: data.isActive,
        language: data.language || "en",
      }

      // Only include password if it's provided (for new admin or when updating)
      if (data.password && data.password.length > 0) {
        payload.password = data.password
      }

      if (admin) {
        await api.put(`/admin/users/${admin.id}`, payload)
        toast({
          title: "Success",
          description: "Admin updated successfully",
        })
        onSuccess()
      } else {
        if (!data.password || data.password.length < 6) {
          toast({
            title: "Password required",
            description: "Set a password of at least 6 characters for the new admin.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
        payload.password = data.password
        const res = await api.post("/admin/users", payload)
        const createdEmail = data.email.trim()
        const welcomeEmailSent = res.data?.welcomeEmailSent === true
        const skipped = res.data?.welcomeEmailSkipped as string | undefined
        const sendErr = res.data?.welcomeEmailError as string | undefined
        let description: string
        if (welcomeEmailSent) {
          description = `Welcome email sent to ${createdEmail}. A login tab also opens with their email filled in.`
        } else if (skipped === "smtp_not_configured") {
          description = `Account created. No email sent — uncomment and set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env, then restart the server. A login tab still opens for ${createdEmail}.`
        } else {
          description = `Account created but the welcome email failed${sendErr ? `: ${sendErr}` : ""}. Check SMTP settings and spam folder. A login tab opens for ${createdEmail}.`
        }
        toast({
          title: "Admin created",
          description,
        })
        onSuccess({ createdEmail })
      }

      onOpenChange(false)
    } catch (error: any) {
      let errorMessage = "An error occurred"
      
      if (error.response?.data) {
        if (error.response.data.details && Array.isArray(error.response.data.details)) {
          // Show validation errors
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{admin ? "Edit Admin" : "Create New Admin"}</DialogTitle>
          <DialogDescription>
            {admin
              ? "Update admin information and permissions"
              : "Create a new admin user with username and password"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                {...register("firstName")}
                placeholder="Enter first name"
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
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password {!admin && <span className="text-red-500">*</span>}
              {admin && <span className="text-gray-500 text-xs">(Leave empty to keep current)</span>}
            </Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              placeholder={admin ? "Enter new password (optional)" : "Enter password (min 6 characters)"}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="Enter phone number (optional)"
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roleId">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch("roleId") || ""}
                onValueChange={(value) => setValue("roleId", value, { shouldValidate: true })}
              >
                <SelectTrigger className={errors.roleId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {loadingData ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : roles.length === 0 ? (
                    <SelectItem value="no-roles" disabled>No roles available</SelectItem>
                  ) : (
                    roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.displayName || role.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.roleId && (
                <p className="text-sm text-red-500">{errors.roleId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolId">School</Label>
              <Select
                value={watch("schoolId") || "none"}
                onValueChange={(value) => setValue("schoolId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select school (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No School (Super Admin)</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={watch("language") || "en"}
                onValueChange={(value) => setValue("language", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <Select
                value={watch("isActive") ? "active" : "inactive"}
                onValueChange={(value) => setValue("isActive", value === "active")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
              {admin ? "Update Admin" : "Create Admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

