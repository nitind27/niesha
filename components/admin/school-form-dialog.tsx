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

// ── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(200),
  email: z.string().email("Invalid organization email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  adminEmail: z.string().email("Invalid admin email address"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
  adminFirstName: z.string().min(1, "First name is required").max(100),
  adminLastName: z.string().min(1, "Last name is required").max(100),
  adminPhone: z.string().optional(),
  subscriptionPlan: z.string().optional(),
  maxUsers: z.number().int().positive().optional(),
  maxStudents: z.number().int().positive().optional(),
  organizationType: z.enum(["school", "company", "trust", "ngo", "other"]).optional(),
  industry: z.string().max(120).optional(),
})

const editSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(200),
  email: z.string().email("Invalid organization email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  status: z.enum(["active", "suspended", "inactive"]).optional(),
  subscriptionPlan: z.string().optional(),
  maxUsers: z.number().int().positive().optional(),
  maxStudents: z.number().int().positive().optional(),
  organizationType: z.enum(["school", "company", "trust", "ngo", "other"]).optional(),
  industry: z.string().max(120).optional(),
})

type CreateFormData = z.infer<typeof createSchema>
type EditFormData = z.infer<typeof editSchema>

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SchoolEditData {
  id: string
  name: string
  email: string
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  zipCode?: string | null
  website?: string | null
  status?: string
  subscriptionPlan?: string | null
  maxUsers?: number
  maxStudents?: number
  organizationType?: string
  industry?: string | null
}

interface SchoolFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (meta?: { createdEmail?: string }) => void
  editData?: SchoolEditData | null
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SchoolFormDialog({ open, onOpenChange, onSuccess, editData }: SchoolFormDialogProps) {
  const isEdit = !!editData
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { maxUsers: 50, maxStudents: 500, organizationType: "school", industry: "" },
  })

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: { maxUsers: 50, maxStudents: 500, organizationType: "school", industry: "" },
  })

  // Populate / reset forms when dialog opens
  useEffect(() => {
    if (!open) return
    if (isEdit && editData) {
      editForm.reset({
        name: editData.name ?? "",
        email: editData.email ?? "",
        phone: editData.phone ?? "",
        address: editData.address ?? "",
        city: editData.city ?? "",
        state: editData.state ?? "",
        country: editData.country ?? "",
        zipCode: editData.zipCode ?? "",
        website: editData.website ?? "",
        status: (editData.status as any) ?? "active",
        subscriptionPlan: editData.subscriptionPlan ?? "",
        maxUsers: editData.maxUsers ?? 50,
        maxStudents: editData.maxStudents ?? 500,
        organizationType: (editData.organizationType as any) ?? "school",
        industry: editData.industry ?? "",
      })
    } else {
      createForm.reset({
        name: "", email: "", phone: "", address: "", city: "", state: "",
        country: "", zipCode: "", website: "", adminEmail: "", adminPassword: "",
        adminFirstName: "", adminLastName: "", adminPhone: "", subscriptionPlan: "",
        maxUsers: 50, maxStudents: 500, organizationType: "school", industry: "",
      })
    }
  }, [open, isEdit, editData])

  // ── Submit handlers ──────────────────────────────────────────────────────

  const onCreateSubmit = async (data: CreateFormData) => {
    setIsSubmitting(true)
    try {
      const payload = {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        country: data.country?.trim() || null,
        zipCode: data.zipCode?.trim() || null,
        website: data.website?.trim() || null,
        adminEmail: data.adminEmail.trim(),
        adminPassword: data.adminPassword,
        adminFirstName: data.adminFirstName.trim(),
        adminLastName: data.adminLastName.trim(),
        adminPhone: data.adminPhone?.trim() || null,
        subscriptionPlan: data.subscriptionPlan || null,
        maxUsers: data.maxUsers || 50,
        maxStudents: data.maxStudents || 500,
        organizationType: data.organizationType || "school",
        industry: data.industry?.trim() || null,
      }
      await api.post("/schools", payload)
      toast({ title: "Organization created", description: `A login tab opens with ${data.adminEmail.trim()} filled in.` })
      onSuccess({ createdEmail: data.adminEmail.trim() })
      onOpenChange(false)
    } catch (error: any) {
      toast({ title: "Error", description: extractError(error), variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onEditSubmit = async (data: EditFormData) => {
    if (!editData) return
    setIsSubmitting(true)
    try {
      const payload = {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        country: data.country?.trim() || null,
        zipCode: data.zipCode?.trim() || null,
        website: data.website?.trim() || null,
        status: data.status,
        subscriptionPlan: data.subscriptionPlan || null,
        maxUsers: data.maxUsers || 50,
        maxStudents: data.maxStudents || 500,
        organizationType: data.organizationType || "school",
        industry: data.industry?.trim() || null,
      }
      await api.put(`/schools/${editData.id}`, payload)
      toast({ title: "Organization updated", description: `${data.name} has been updated.` })
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({ title: "Error", description: extractError(error), variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit organization" : "Create tenant organization"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the organization details below."
              : "Creates a new isolated workspace and a dedicated tenant administrator."}
          </DialogDescription>
        </DialogHeader>

        {isEdit ? (
          <EditForm
            form={editForm}
            onSubmit={onEditSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
          />
        ) : (
          <CreateForm
            form={createForm}
            onSubmit={onCreateSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Sub-forms ─────────────────────────────────────────────────────────────────

function OrgFields({ register, errors }: { register: any; errors: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Organization</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Organization name <span className="text-red-500">*</span></Label>
          <Input id="name" {...register("name")} placeholder="Acme Corp, Sunrise Trust…" />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Organization email <span className="text-red-500">*</span></Label>
          <Input id="email" type="email" {...register("email")} placeholder="contact@organization.com" />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} placeholder="Enter phone number" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" {...register("website")} placeholder="https://example.com" />
          {errors.website && <p className="text-sm text-red-500">{errors.website.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...register("address")} placeholder="Enter address" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...register("city")} placeholder="City" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" {...register("state")} placeholder="State" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...register("country")} placeholder="Country" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="zipCode">Zip Code</Label>
        <Input id="zipCode" {...register("zipCode")} placeholder="Zip code" />
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
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industry / focus (optional)</Label>
          <Input id="industry" {...register("industry")} placeholder="e.g. K-12, retail, NGO" />
        </div>
      </div>
    </div>
  )
}

function SubscriptionFields({ register, errors }: { register: any; errors: any }) {
  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="text-lg font-semibold">Subscription Settings</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
          <Input id="subscriptionPlan" {...register("subscriptionPlan")} placeholder="Plan slug (optional)" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxUsers">Max Users</Label>
          <Input id="maxUsers" type="number" {...register("maxUsers", { valueAsNumber: true })} placeholder="50" />
          {errors.maxUsers && <p className="text-sm text-red-500">{errors.maxUsers.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxStudents">Max members</Label>
          <Input id="maxStudents" type="number" {...register("maxStudents", { valueAsNumber: true })} placeholder="500" />
          {errors.maxStudents && <p className="text-sm text-red-500">{errors.maxStudents.message}</p>}
        </div>
      </div>
    </div>
  )
}

function CreateForm({ form, onSubmit, isSubmitting, onCancel }: any) {
  const { register, handleSubmit, formState: { errors } } = form
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <OrgFields register={register} errors={errors} />

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">Tenant administrator (login)</h3>
        <p className="text-sm text-muted-foreground rounded-md border border-dashed bg-muted/40 p-3">
          This user is the <strong>only</strong> admin for this tenant at first. Role:{" "}
          <span className="font-mono">school_admin</span>.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="adminFirstName">First Name <span className="text-red-500">*</span></Label>
            <Input id="adminFirstName" {...register("adminFirstName")} placeholder="First name" />
            {errors.adminFirstName && <p className="text-sm text-red-500">{errors.adminFirstName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminLastName">Last Name <span className="text-red-500">*</span></Label>
            <Input id="adminLastName" {...register("adminLastName")} placeholder="Last name" />
            {errors.adminLastName && <p className="text-sm text-red-500">{errors.adminLastName.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="adminEmail">Admin sign-in email <span className="text-red-500">*</span></Label>
            <Input id="adminEmail" type="email" {...register("adminEmail")} placeholder="admin@their-company.com" />
            {errors.adminEmail && <p className="text-sm text-red-500">{errors.adminEmail.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminPassword">Admin password <span className="text-red-500">*</span></Label>
            <Input id="adminPassword" type="password" {...register("adminPassword")} placeholder="Min 6 characters" />
            {errors.adminPassword && <p className="text-sm text-red-500">{errors.adminPassword.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminPhone">Admin Phone</Label>
          <Input id="adminPhone" {...register("adminPhone")} placeholder="Optional" />
        </div>
      </div>

      <SubscriptionFields register={register} errors={errors} />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create organization & admin
        </Button>
      </DialogFooter>
    </form>
  )
}

function EditForm({ form, onSubmit, isSubmitting, onCancel }: any) {
  const { register, handleSubmit, formState: { errors } } = form
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <OrgFields register={register} errors={errors} />

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">Status</h3>
        <div className="space-y-2">
          <Label htmlFor="status">Organization status</Label>
          <select
            id="status"
            {...register("status")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <SubscriptionFields register={register} errors={errors} />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </DialogFooter>
    </form>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractError(error: any): string {
  if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
    return "Validation failed: " + error.response.data.details.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", ")
  }
  return error.response?.data?.error || error.message || "An error occurred"
}
