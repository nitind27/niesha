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
import { Loader2, CheckSquare, Square } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

const planSchema = z.object({
  name: z.string().min(1, "Plan name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255).regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  tagline: z.string().max(500).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  monthlyPrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Invalid price"),
  yearlyPrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Invalid price"),
  originalMonthlyPrice: z.string().optional().or(z.literal("")),
  originalYearlyPrice: z.string().optional().or(z.literal("")),
  discount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, "Discount must be 0-100"),
  isPopular: z.boolean(),
  badge: z.string().max(100).optional().or(z.literal("")),
  isActive: z.boolean(),
  sortOrder: z.string().refine((val) => !isNaN(Number(val)), "Invalid sort order"),
  maxSchools: z.string().optional().or(z.literal("")),
  maxStudents: z.string().optional().or(z.literal("")),
  maxStaff: z.string().optional().or(z.literal("")),
  storageGB: z.string().optional().or(z.literal("")),
  modules: z.array(z.string()).min(1, "At least one module must be selected"),
  features: z.array(z.string()).optional(),
  supportLevel: z.string(),
})

type PlanFormData = z.infer<typeof planSchema>

interface PlanFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan?: any
  onSuccess: () => void
}

// Available modules
const AVAILABLE_MODULES = [
  { id: "student", name: "Student Management", description: "Manage students, admissions, records" },
  { id: "staff", name: "Staff Management", description: "Manage teachers and staff" },
  { id: "class", name: "Class Management", description: "Classes, sections, and academic structure" },
  { id: "subject", name: "Subject Management", description: "Subjects and curriculum" },
  { id: "attendance", name: "Attendance Tracking", description: "Student and staff attendance" },
  { id: "exam", name: "Exam Management", description: "Create and manage exams" },
  { id: "result", name: "Result Management", description: "Record and manage results" },
  { id: "fee", name: "Fee Management", description: "Fee structures and tracking" },
  { id: "payment", name: "Payment Management", description: "Payment processing and receipts" },
  { id: "library", name: "Library Management", description: "Book management and issues" },
  { id: "transport", name: "Transport Management", description: "Routes and vehicle management" },
  { id: "announcements", name: "Announcements", description: "School announcements and notices" },
  { id: "basic_reports", name: "Basic Reports", description: "Standard reports and analytics" },
  { id: "advanced_reports", name: "Advanced Reports", description: "Custom reports and analytics" },
  { id: "custom_reports", name: "Custom Reports Builder", description: "Build custom reports" },
  { id: "ai_analytics", name: "AI-Powered Analytics", description: "AI-driven insights" },
  { id: "advanced_permissions", name: "Advanced Permissions", description: "Granular permission control" },
  { id: "multi_branch", name: "Multi-branch Support", description: "Manage multiple school branches" },
  { id: "custom_workflows", name: "Custom Workflows", description: "Custom business processes" },
  { id: "api_webhooks", name: "API & Webhooks", description: "API access and webhooks" },
  { id: "third_party_integrations", name: "Third-party Integrations", description: "Integrate with other systems" },
]

export function PlanFormDialog({
  open,
  onOpenChange,
  plan,
  onSuccess,
}: PlanFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      isPopular: false,
      isActive: true,
      sortOrder: "0",
      discount: "0",
      supportLevel: "email",
      modules: [],
      features: [],
    },
  })

  const selectedModules = watch("modules") || []

  // Reset form when plan changes
  useEffect(() => {
    if (open) {
      if (plan) {
        reset({
          name: plan.name,
          slug: plan.slug,
          tagline: plan.tagline || "",
          description: plan.description || "",
          monthlyPrice: plan.monthlyPrice?.toString() || "0",
          yearlyPrice: plan.yearlyPrice?.toString() || "0",
          originalMonthlyPrice: plan.originalMonthlyPrice?.toString() || "",
          originalYearlyPrice: plan.originalYearlyPrice?.toString() || "",
          discount: plan.discount?.toString() || "0",
          isPopular: plan.isPopular || false,
          badge: plan.badge || "",
          isActive: plan.isActive ?? true,
          sortOrder: plan.sortOrder?.toString() || "0",
          maxSchools: plan.maxSchools?.toString() || "",
          maxStudents: plan.maxStudents?.toString() || "",
          maxStaff: plan.maxStaff?.toString() || "",
          storageGB: plan.storageGB?.toString() || "",
          modules: plan.modules || [],
          features: plan.features || [],
          supportLevel: plan.supportLevel || "email",
        })
      } else {
        reset({
          name: "",
          slug: "",
          tagline: "",
          description: "",
          monthlyPrice: "0",
          yearlyPrice: "0",
          originalMonthlyPrice: "",
          originalYearlyPrice: "",
          discount: "0",
          isPopular: false,
          badge: "",
          isActive: true,
          sortOrder: "0",
          maxSchools: "",
          maxStudents: "",
          maxStaff: "",
          storageGB: "",
          modules: [],
          features: [],
          supportLevel: "email",
        })
      }
    }
  }, [plan, open, reset])

  const handleToggleModule = (moduleId: string) => {
    const currentModules = watch("modules") || []
    if (currentModules.includes(moduleId)) {
      setValue("modules", currentModules.filter((m) => m !== moduleId))
    } else {
      setValue("modules", [...currentModules, moduleId])
    }
  }

  const onSubmit = async (data: PlanFormData) => {
    setIsSubmitting(true)
    try {
      const payload: any = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        tagline: data.tagline?.trim() || null,
        description: data.description?.trim() || null,
        monthlyPrice: Number(data.monthlyPrice),
        yearlyPrice: Number(data.yearlyPrice),
        originalMonthlyPrice: data.originalMonthlyPrice && data.originalMonthlyPrice !== "" ? Number(data.originalMonthlyPrice) : null,
        originalYearlyPrice: data.originalYearlyPrice && data.originalYearlyPrice !== "" ? Number(data.originalYearlyPrice) : null,
        discount: Number(data.discount),
        isPopular: data.isPopular,
        badge: data.badge?.trim() || null,
        isActive: data.isActive,
        sortOrder: Number(data.sortOrder),
        maxSchools: data.maxSchools && data.maxSchools !== "" ? Number(data.maxSchools) : null,
        maxStudents: data.maxStudents && data.maxStudents !== "" ? Number(data.maxStudents) : null,
        maxStaff: data.maxStaff && data.maxStaff !== "" ? Number(data.maxStaff) : null,
        storageGB: data.storageGB && data.storageGB !== "" ? Number(data.storageGB) : null,
        modules: data.modules,
        features: data.features || null,
        supportLevel: data.supportLevel,
      }

      if (plan) {
        await api.put(`/admin/plans/${plan.id}`, payload)
        toast({
          title: "Success",
          description: "Plan updated successfully",
        })
      } else {
        await api.post("/admin/plans", payload)
        toast({
          title: "Success",
          description: "Plan created successfully",
        })
      }

      onSuccess()
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
          <DialogDescription>
            {plan
              ? "Update plan details, pricing, and modules"
              : "Create a new subscription plan with pricing and module access"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Plan Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., Premium"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="slug"
                  {...register("slug")}
                  placeholder="e.g., premium"
                />
                {errors.slug && (
                  <p className="text-sm text-red-500">{errors.slug.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                {...register("tagline")}
                placeholder="e.g., Everything you need for growing schools"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                {...register("description")}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Plan description..."
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="font-semibold">Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyPrice">
                  Monthly Price (₹) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="monthlyPrice"
                  type="number"
                  step="0.01"
                  {...register("monthlyPrice")}
                  placeholder="999"
                />
                {errors.monthlyPrice && (
                  <p className="text-sm text-red-500">{errors.monthlyPrice.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearlyPrice">
                  Yearly Price (₹) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="yearlyPrice"
                  type="number"
                  step="0.01"
                  {...register("yearlyPrice")}
                  placeholder="9590.40"
                />
                {errors.yearlyPrice && (
                  <p className="text-sm text-red-500">{errors.yearlyPrice.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originalMonthlyPrice">Original Monthly Price (₹)</Label>
                <Input
                  id="originalMonthlyPrice"
                  type="number"
                  step="0.01"
                  {...register("originalMonthlyPrice")}
                  placeholder="2999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="originalYearlyPrice">Original Yearly Price (₹)</Label>
                <Input
                  id="originalYearlyPrice"
                  type="number"
                  step="0.01"
                  {...register("originalYearlyPrice")}
                  placeholder="28790.40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  {...register("discount")}
                  placeholder="67"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  {...register("sortOrder")}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Limits */}
          <div className="space-y-4">
            <h3 className="font-semibold">Limits (Leave empty for unlimited)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxSchools">Max Schools</Label>
                <Input
                  id="maxSchools"
                  type="number"
                  {...register("maxSchools")}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStudents">Max Students</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  {...register("maxStudents")}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStaff">Max Staff</Label>
                <Input
                  id="maxStaff"
                  type="number"
                  {...register("maxStaff")}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storageGB">Storage (GB)</Label>
                <Input
                  id="storageGB"
                  type="number"
                  {...register("storageGB")}
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>
          </div>

          {/* Modules Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Modules <span className="text-red-500">*</span></h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedModules.length === AVAILABLE_MODULES.length) {
                    setValue("modules", [])
                  } else {
                    setValue("modules", AVAILABLE_MODULES.map((m) => m.id))
                  }
                }}
              >
                {selectedModules.length === AVAILABLE_MODULES.length ? (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Select All
                  </>
                )}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4">
              {AVAILABLE_MODULES.map((module) => {
                const isSelected = selectedModules.includes(module.id)
                return (
                  <label
                    key={module.id}
                    className="flex items-start space-x-2 cursor-pointer p-2 rounded hover:bg-accent"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleModule(module.id)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{module.name}</div>
                      <div className="text-xs text-muted-foreground">{module.description}</div>
                    </div>
                  </label>
                )
              })}
            </div>
            {errors.modules && (
              <p className="text-sm text-red-500">{errors.modules.message}</p>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold">Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supportLevel">Support Level</Label>
                <Select
                  value={watch("supportLevel")}
                  onValueChange={(value) => setValue("supportLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Support</SelectItem>
                    <SelectItem value="priority">Priority Support (24/7)</SelectItem>
                    <SelectItem value="dedicated">Dedicated Support (24/7)</SelectItem>
                    <SelectItem value="premium">Premium Support (24/7)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="badge">Badge Text</Label>
                <Input
                  id="badge"
                  {...register("badge")}
                  placeholder="e.g., MOST POPULAR"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={watch("isPopular")}
                  onChange={(e) => setValue("isPopular", e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Mark as Popular Plan</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={watch("isActive")}
                  onChange={(e) => setValue("isActive", e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Active</span>
              </label>
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
              {plan ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

