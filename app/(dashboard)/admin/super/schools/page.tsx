"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "@/hooks/useLanguage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Building2,
  Users,
  GraduationCap,
  MoreVertical,
  Eye,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/api"
import { SchoolFormDialog } from "@/components/admin/school-form-dialog"
import { Badge } from "@/components/ui/badge"
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

interface School {
  id: string
  name: string
  slug: string
  email: string
  phone?: string
  status: string
  subscriptionPlan?: string
  createdAt: string
  _count?: {
    users: number
    students: number
  }
}

export default function SchoolsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [schools, setSchools] = useState<School[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 300)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    totalUsers: 0,
    totalStudents: 0,
  })
  const { toast } = useToast()

  // Fetch schools
  const fetchSchools = async () => {
    setIsLoading(true)
    try {
      const response = await api.get("/schools")
      const allSchools = response.data.schools || []
      
      // Apply filters
      let filteredSchools = allSchools
      
      if (debouncedSearch) {
        filteredSchools = filteredSchools.filter((school: School) =>
          school.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          school.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          school.slug.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      }
      
      if (statusFilter) {
        filteredSchools = filteredSchools.filter(
          (school: School) => school.status === statusFilter
        )
      }
      
      // Calculate pagination
      const total = filteredSchools.length
      const startIndex = (pagination.page - 1) * pagination.limit
      const endIndex = startIndex + pagination.limit
      const paginatedSchools = filteredSchools.slice(startIndex, endIndex)
      
      setSchools(paginatedSchools)
      setPagination((prev) => ({
        ...prev,
        total,
        totalPages: Math.ceil(total / prev.limit),
      }))
      
      // Update stats
      setStats({
        totalSchools: allSchools.length,
        activeSchools: allSchools.filter((s: School) => s.status === "active").length,
        totalUsers: allSchools.reduce((sum: number, s: School) => sum + (s._count?.users || 0), 0),
        totalStudents: allSchools.reduce((sum: number, s: School) => sum + (s._count?.students || 0), 0),
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to fetch schools",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSchools()
  }, [pagination.page, debouncedSearch, statusFilter])

  if (user?.role !== "super_admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Access Denied</p>
      </div>
    )
  }

  const handleCreate = () => {
    setIsFormOpen(true)
  }

  const handleDelete = async (schoolId: string) => {
    const school = schools.find((s) => s.id === schoolId)
    const schoolName = school ? school.name : "this organization"

    if (!confirm(`Are you sure you want to delete ${schoolName}? This action cannot be undone and will delete all associated data.`))
      return

    try {
      // TODO: Implement delete endpoint
      toast({
        title: "Info",
        description: "Delete functionality will be implemented soon",
      })
      fetchSchools()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete school",
        variant: "destructive",
      })
    }
  }

  const handleSuccess = (meta?: { createdEmail?: string }) => {
    fetchSchools()
    if (typeof window !== "undefined" && meta?.createdEmail) {
      const q = new URLSearchParams({
        email: meta.createdEmail,
        hint: "new_tenant",
      })
      window.open(`/login?${q.toString()}`, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Organizations (tenants)</h1>
            <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-600 dark:text-purple-400">
              Super Administrator
            </span>
          </div>
          <p className="text-muted-foreground mt-2">
            Each tenant has isolated data. Creating one also creates its administrator (email + password on main login).
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add organization
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSchools}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSchools}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <CardTitle>All organizations</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or slug..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value)
                    setPagination((prev) => ({ ...prev, page: 1 }))
                  }}
                  className="pl-8"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Table */}
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No schools found
                        </TableCell>
                      </TableRow>
                    ) : (
                      schools.map((school) => (
                        <TableRow key={school.id}>
                          <TableCell className="font-medium">
                            {school.name}
                          </TableCell>
                          <TableCell>{school.email}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {school.slug}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant={school.status === "active" ? "default" : "secondary"}>
                              {school.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{school._count?.users || 0}</TableCell>
                          <TableCell>{school._count?.students || 0}</TableCell>
                          <TableCell>
                            {new Date(school.createdAt).toLocaleDateString()}
                          </TableCell>
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
                                <DropdownMenuItem onClick={() => handleDelete(school.id)}>
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

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} organizations
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                      }
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.totalPages, prev.page + 1),
                        }))
                      }
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* School Form Dialog */}
      <SchoolFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

