"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Star,
  Check,
  X,
  MoreVertical,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/api"
import { PlanFormDialog } from "@/components/admin/plan-form-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useDebounce } from "@/hooks/useDebounce"
import { TableSkeleton } from "@/components/loading/table-skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Plan {
  id: string
  name: string
  slug: string
  tagline?: string
  monthlyPrice: number
  yearlyPrice: number
  originalMonthlyPrice?: number
  originalYearlyPrice?: number
  discount: number
  isPopular: boolean
  badge?: string
  isActive: boolean
  sortOrder: number
  maxSchools?: number
  maxStudents?: number
  maxStaff?: number
  storageGB?: number
  modules: string[]
  features?: string[]
  supportLevel: string
  _count?: {
    schools: number
  }
}

export default function PlansManagementPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 300)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const { toast } = useToast()

  // Fetch plans
  const fetchPlans = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) {
        params.append("search", debouncedSearch)
      }

      const response = await api.get(`/admin/plans?${params}`)
      console.log("Fetched plans response:", response.data)
      const plansData = response.data?.plans || response.data || []
      console.log("Plans data:", plansData)
      setPlans(plansData)
    } catch (error: any) {
      console.error("Error fetching plans:", error)
      console.error("Error response:", error.response?.data)
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to fetch plans",
        variant: "destructive",
      })
      setPlans([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === "super_admin") {
      fetchPlans()
    }
  }, [user, debouncedSearch])

  const handleCreate = () => {
    setSelectedPlan(null)
    setIsFormOpen(true)
  }

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan)
    setIsFormOpen(true)
  }

  const handleDelete = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId)
    const planName = plan ? plan.name : "this plan"

    if (!confirm(`Are you sure you want to delete ${planName}? This action cannot be undone.`))
      return

    try {
      await api.delete(`/admin/plans/${planId}`)
      toast({
        title: "Success",
        description: `${planName} has been deleted successfully.`,
      })
      fetchPlans()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete plan",
        variant: "destructive",
      })
    }
  }

  const handleSuccess = () => {
    fetchPlans()
  }

  if (user?.role !== "super_admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Access Denied</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Plans Management</h1>
          <p className="text-muted-foreground">
            Create and manage subscription plans. Set prices, modules, and limits for each plan.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plans..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Monthly Price</TableHead>
                    <TableHead>Yearly Price</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Modules</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Schools</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No plans found
                      </TableCell>
                    </TableRow>
                  ) : (
                    plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {plan.isPopular && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                            <span className="font-medium">{plan.name}</span>
                            {plan.badge && (
                              <Badge variant="default">{plan.badge}</Badge>
                            )}
                          </div>
                          {plan.tagline && (
                            <p className="text-xs text-muted-foreground mt-1">{plan.tagline}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">₹{plan.monthlyPrice.toLocaleString()}</span>
                            {plan.originalMonthlyPrice && (
                              <span className="text-xs text-muted-foreground line-through ml-2">
                                ₹{plan.originalMonthlyPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">₹{plan.yearlyPrice.toLocaleString()}</span>
                            {plan.originalYearlyPrice && (
                              <span className="text-xs text-muted-foreground line-through ml-2">
                                ₹{plan.originalYearlyPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{plan.discount}% OFF</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{plan.modules?.length || 0} modules</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={plan.isActive ? "default" : "secondary"}>
                            {plan.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{plan._count?.schools || 0}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEdit(plan)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(plan.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Form Dialog */}
      <PlanFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        plan={selectedPlan}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

