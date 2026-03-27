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
  Users,
  Shield,
  Building2,
  MoreVertical,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/api"
import { AdminFormDialog } from "@/components/admin/admin-form-dialog"
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

interface Admin {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  isActive: boolean
  language: string
  role: {
    id: string
    name: string
    displayName: string
  }
  school?: {
    id: string
    name: string
    slug: string
  }
  createdAt: string
}

export default function AdminsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 300)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [roleFilter, setRoleFilter] = useState<string>("")
  const [schoolFilter, setSchoolFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [roles, setRoles] = useState<any[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    totalSchools: 0,
    totalRoles: 0,
  })
  const { toast } = useToast()

  // Fetch admins
  const fetchAdmins = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(roleFilter && { roleId: roleFilter }),
        ...(schoolFilter && { schoolId: schoolFilter }),
        ...(statusFilter && { status: statusFilter }),
      })

      const response = await api.get(`/admin/users?${params}`)
      setAdmins(response.data.users || [])
      setPagination(response.data.pagination || pagination)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to fetch admins",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch roles and schools
  useEffect(() => {
    Promise.all([
      api.get("/admin/roles").then((res) => res.data.roles || []),
      api.get("/schools").then((res) => res.data.schools || []),
    ])
      .then(([rolesData, schoolsData]) => {
        setRoles(rolesData)
        setSchools(schoolsData)
      })
      .catch(() => {
        setRoles([])
        setSchools([])
      })
  }, [])

  // Fetch stats
  useEffect(() => {
    Promise.all([
      api.get("/admin/users?limit=1").then((res) => ({
        total: res.data.pagination?.total || 0,
        active: res.data.users?.filter((u: Admin) => u.isActive).length || 0,
      })),
      api.get("/schools").then((res) => res.data.schools?.length || 0),
      api.get("/admin/roles").then((res) => res.data.roles?.length || 0),
    ])
      .then(([usersData, schoolsCount, rolesCount]) => {
        setStats({
          totalAdmins: usersData.total,
          activeAdmins: usersData.active,
          totalSchools: schoolsCount,
          totalRoles: rolesCount,
        })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchAdmins()
  }, [pagination.page, debouncedSearch, roleFilter, schoolFilter, statusFilter])

  if (user?.role !== "super_admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Access Denied</p>
      </div>
    )
  }

  const handleCreate = () => {
    setSelectedAdmin(null)
    setIsFormOpen(true)
  }

  const handleEdit = (admin: Admin) => {
    setSelectedAdmin(admin)
    setIsFormOpen(true)
  }

  const handleDelete = async (adminId: string) => {
    const admin = admins.find((a) => a.id === adminId)
    const adminName = admin ? `${admin.firstName} ${admin.lastName}` : "this admin"

    if (!confirm(`Are you sure you want to delete ${adminName}? This action cannot be undone.`))
      return

    try {
      await api.delete(`/admin/users/${adminId}`)
      toast({
        title: "Success",
        description: `${adminName} has been deleted successfully.`,
      })
      fetchAdmins()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete admin",
        variant: "destructive",
      })
    }
  }

  const handleSuccess = (meta?: { createdEmail?: string }) => {
    fetchAdmins()
    api
      .get("/admin/users?limit=1")
      .then((res) => {
        const total = res.data.pagination?.total || 0
        const active = res.data.users?.filter((u: Admin) => u.isActive).length || 0
        setStats((prev) => ({ ...prev, totalAdmins: total, activeAdmins: active }))
      })
      .catch(() => {})

    if (typeof window !== "undefined" && meta?.createdEmail) {
      const q = new URLSearchParams({
        email: meta.createdEmail,
        hint: "new_admin",
      })
      window.open(`/login?${q.toString()}`, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Admin Users Management</h1>
            <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-600 dark:text-purple-400">
              Super Administrator
            </span>
          </div>
          <p className="text-muted-foreground mt-2">
            Create and manage admin users. Assign roles and permissions to control access.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Admin
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAdmins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAdmins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSchools}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRoles}</div>
          </CardContent>
        </Card>
      </div>

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.displayName || role.name}
                </option>
              ))}
            </select>
            <select
              value={schoolFilter}
              onChange={(e) => {
                setSchoolFilter(e.target.value)
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Schools</option>
              <option value="superAdminOnly">Super Admins Only</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
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
                      <TableHead>Role</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No admins found
                        </TableCell>
                      </TableRow>
                    ) : (
                      admins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">
                            {admin.firstName} {admin.lastName}
                          </TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{admin.role.displayName || admin.role.name}</Badge>
                          </TableCell>
                          <TableCell>
                            {admin.school ? (
                              <span>{admin.school.name}</span>
                            ) : (
                              <Badge variant="secondary">Super Admin</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={admin.isActive ? "default" : "secondary"}>
                              {admin.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(admin.createdAt).toLocaleDateString()}
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
                                <DropdownMenuItem onClick={() => handleEdit(admin)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(admin.id)}
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

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} admins
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

      {/* Admin Form Dialog */}
      <AdminFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        admin={selectedAdmin}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

