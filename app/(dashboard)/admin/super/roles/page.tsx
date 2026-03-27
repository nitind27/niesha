"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Edit,
  Save,
  CheckSquare,
  Square,
  Search,
  Plus,
  Trash2,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import api from "@/lib/api"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/components/ui/use-toast"
import { useDebounce } from "@/hooks/useDebounce"

interface Role {
  id: string
  name: string
  displayName: string
  description?: string | null
  permissions: string[]
  isSystem: boolean
  _count?: {
    users: number
  }
}

const PERMISSION_GROUPS: Record<string, string[]> = {
  "Super admin": [PERMISSIONS.SUPER_ADMIN_ALL],
  "Organization (tenant)": [
    PERMISSIONS.SCHOOL_CREATE,
    PERMISSIONS.SCHOOL_READ,
    PERMISSIONS.SCHOOL_UPDATE,
    PERMISSIONS.SCHOOL_DELETE,
  ],
  "Users": [
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
  ],
  "Members / students": [
    PERMISSIONS.STUDENT_CREATE,
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.STUDENT_UPDATE,
    PERMISSIONS.STUDENT_DELETE,
  ],
  "Staff": [
    PERMISSIONS.STAFF_CREATE,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.STAFF_UPDATE,
    PERMISSIONS.STAFF_DELETE,
  ],
  "Structure & curriculum": [
    PERMISSIONS.CLASS_CREATE,
    PERMISSIONS.CLASS_READ,
    PERMISSIONS.CLASS_UPDATE,
    PERMISSIONS.CLASS_DELETE,
    PERMISSIONS.SUBJECT_CREATE,
    PERMISSIONS.SUBJECT_READ,
    PERMISSIONS.SUBJECT_UPDATE,
    PERMISSIONS.SUBJECT_DELETE,
  ],
  "Exams & results": [
    PERMISSIONS.EXAM_CREATE,
    PERMISSIONS.EXAM_READ,
    PERMISSIONS.EXAM_UPDATE,
    PERMISSIONS.EXAM_DELETE,
    PERMISSIONS.RESULT_CREATE,
    PERMISSIONS.RESULT_READ,
    PERMISSIONS.RESULT_UPDATE,
    PERMISSIONS.RESULT_DELETE,
  ],
  Attendance: [
    PERMISSIONS.ATTENDANCE_CREATE,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_UPDATE,
  ],
  "Billing & payments": [
    PERMISSIONS.FEE_CREATE,
    PERMISSIONS.FEE_READ,
    PERMISSIONS.FEE_UPDATE,
    PERMISSIONS.FEE_DELETE,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.PAYMENT_UPDATE,
  ],
  Library: [
    PERMISSIONS.LIBRARY_CREATE,
    PERMISSIONS.LIBRARY_READ,
    PERMISSIONS.LIBRARY_UPDATE,
    PERMISSIONS.LIBRARY_DELETE,
  ],
  Transport: [
    PERMISSIONS.TRANSPORT_CREATE,
    PERMISSIONS.TRANSPORT_READ,
    PERMISSIONS.TRANSPORT_UPDATE,
    PERMISSIONS.TRANSPORT_DELETE,
  ],
  Communication: [
    PERMISSIONS.ANNOUNCEMENT_CREATE,
    PERMISSIONS.ANNOUNCEMENT_READ,
    PERMISSIONS.ANNOUNCEMENT_UPDATE,
    PERMISSIONS.ANNOUNCEMENT_DELETE,
  ],
  Reports: [PERMISSIONS.REPORT_READ, PERMISSIONS.REPORT_EXPORT],
  Settings: [PERMISSIONS.SETTINGS_READ, PERMISSIONS.SETTINGS_UPDATE],
  ERP: [PERMISSIONS.ERP_READ, PERMISSIONS.ERP_WRITE],
}

function formatPermissionLabel(permission: string) {
  const part = permission.split(":")[1] || permission
  return part.charAt(0).toUpperCase() + part.slice(1).replace(/_/g, " ")
}

export default function RolesManagementPage() {
  const { user } = useAuth()
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("edit")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 300)
  const { toast } = useToast()

  const [newRoleName, setNewRoleName] = useState("")
  const [newDisplayName, setNewDisplayName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [editDisplayName, setEditDisplayName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchRoles = async () => {
    setIsLoading(true)
    try {
      const response = await api.get("/admin/roles")
      const rolesData = response.data.roles || []
      const parsedRoles = rolesData.map((role: any) => ({
        ...role,
        permissions: Array.isArray(role.permissions)
          ? role.permissions
          : typeof role.permissions === "string"
            ? JSON.parse(role.permissions || "[]")
            : [],
      }))
      setRoles(parsedRoles)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to fetch roles",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === "super_admin") {
      fetchRoles()
    }
  }, [user])

  const openCreate = () => {
    setDialogMode("create")
    setSelectedRole(null)
    setNewRoleName("")
    setNewDisplayName("")
    setNewDescription("")
    setSelectedPermissions(new Set())
    setIsDialogOpen(true)
  }

  const openEdit = (role: Role) => {
    setDialogMode("edit")
    setSelectedRole(role)
    setSelectedPermissions(new Set(role.permissions || []))
    setEditDisplayName(role.displayName)
    setEditDescription(role.description || "")
    setIsDialogOpen(true)
  }

  const handleTogglePermission = (permission: string) => {
    const next = new Set(selectedPermissions)
    if (next.has(permission)) next.delete(permission)
    else next.add(permission)
    setSelectedPermissions(next)
  }

  const handleToggleGroup = (groupPermissions: string[]) => {
    const allSelected = groupPermissions.every((p) => selectedPermissions.has(p))
    const next = new Set(selectedPermissions)
    if (allSelected) groupPermissions.forEach((p) => next.delete(p))
    else groupPermissions.forEach((p) => next.add(p))
    setSelectedPermissions(next)
  }

  const handleSave = async () => {
    const perms = Array.from(selectedPermissions)

    if (dialogMode === "create") {
      if (!newRoleName.trim() || !newDisplayName.trim()) {
        toast({ title: "Role key and display name are required", variant: "destructive" })
        return
      }
      setSaving(true)
      try {
        await api.post("/admin/roles", {
          name: newRoleName.trim(),
          displayName: newDisplayName.trim(),
          description: newDescription.trim() || null,
          permissions: perms,
        })
        toast({ title: "Role created", description: `Users can be assigned role “${newDisplayName.trim()}”.` })
        setIsDialogOpen(false)
        fetchRoles()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to create role",
          variant: "destructive",
        })
      } finally {
        setSaving(false)
      }
      return
    }

    if (!selectedRole) return
    setSaving(true)
    try {
      await api.put(`/admin/roles/${selectedRole.id}`, {
        displayName: selectedRole.isSystem ? undefined : editDisplayName.trim(),
        description: selectedRole.isSystem ? undefined : editDescription.trim() || null,
        permissions: perms,
      })
      toast({ title: "Saved", description: "Role updated." })
      setIsDialogOpen(false)
      setSelectedRole(null)
      fetchRoles()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update role",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRole = async () => {
    if (!selectedRole || selectedRole.isSystem) return
    setSaving(true)
    try {
      await api.delete(`/admin/roles/${selectedRole.id}`)
      toast({ title: "Role deleted" })
      setDeleteConfirmOpen(false)
      setIsDialogOpen(false)
      setSelectedRole(null)
      fetchRoles()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      role.displayName.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  if (user?.role !== "super_admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Access Denied</p>
      </div>
    )
  }

  const showMetaFields = dialogMode === "create" || (dialogMode === "edit" && selectedRole && !selectedRole.isSystem)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Roles & permissions</h1>
          <p className="text-muted-foreground max-w-2xl">
            Add custom role names, choose permissions, and assign these roles to users per tenant. System roles are
            protected; custom roles can be edited or removed if no users use them.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All roles</CardTitle>
          <div className="mt-4">
            <div className="relative max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by key or display name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role key</TableHead>
                    <TableHead>Display name</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No roles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-mono text-sm">{role.name}</TableCell>
                        <TableCell className="font-medium">{role.displayName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{role.permissions?.length || 0} permissions</Badge>
                        </TableCell>
                        <TableCell>{role._count?.users ?? 0}</TableCell>
                        <TableCell>
                          {role.isSystem ? (
                            <Badge variant="default">System</Badge>
                          ) : (
                            <Badge variant="secondary">Custom</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => openEdit(role)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {role.isSystem ? "Permissions" : "Edit"}
                          </Button>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create"
                ? "Create custom role"
                : selectedRole
                  ? `Edit — ${selectedRole.displayName}`
                  : "Edit role"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "create"
                ? "Internal key is used in code and JWT (lowercase_underscore). Display name is shown in the UI."
                : selectedRole?.isSystem
                  ? "System role: you can only change permission checkboxes."
                  : "Update display name, description, and permissions."}
            </DialogDescription>
          </DialogHeader>

          {dialogMode === "create" && (
            <div className="grid gap-4 sm:grid-cols-2 border-b pb-4">
              <div className="space-y-2">
                <Label htmlFor="roleKey">Role key (internal)</Label>
                <Input
                  id="roleKey"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="e.g. inventory_manager"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dispName">Display name</Label>
                <Input
                  id="dispName"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Inventory manager"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="desc">Description (optional)</Label>
                <Textarea
                  id="desc"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  placeholder="What this role is for"
                />
              </div>
            </div>
          )}

          {dialogMode === "edit" && selectedRole && !selectedRole.isSystem && (
            <div className="grid gap-4 sm:grid-cols-2 border-b pb-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Role key</Label>
                <Input value={selectedRole.name} disabled className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDisp">Display name</Label>
                <Input id="editDisp" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="editDesc">Description</Label>
                <Textarea
                  id="editDesc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <div className="space-y-6 py-4">
            {Object.entries(PERMISSION_GROUPS).map(([groupName, groupPermissions]) => {
              const allSelected = groupPermissions.every((p) => selectedPermissions.has(p))

              return (
                <div key={groupName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{groupName}</h3>
                    <Button variant="ghost" size="sm" type="button" onClick={() => handleToggleGroup(groupPermissions)}>
                      {allSelected ? (
                        <>
                          <CheckSquare className="mr-2 h-4 w-4" />
                          Deselect all
                        </>
                      ) : (
                        <>
                          <Square className="mr-2 h-4 w-4" />
                          Select all
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1">
                    {groupPermissions.map((permission) => {
                      const isSelected = selectedPermissions.has(permission)
                      return (
                        <label
                          key={permission}
                          className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-accent"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleTogglePermission(permission)}
                            className="rounded"
                          />
                          <span className="text-sm font-mono text-muted-foreground">{permission}</span>
                          <span className="text-sm text-foreground">
                            — {formatPermissionLabel(permission)}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
            <div>
              {dialogMode === "edit" && selectedRole && !selectedRole.isSystem && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={saving || (selectedRole._count?.users ?? 0) > 0}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete role
                </Button>
              )}
              {(selectedRole?._count?.users ?? 0) > 0 && !selectedRole?.isSystem && (
                <p className="text-xs text-muted-foreground mt-2 max-w-xs">
                  Remove users from this role before delete is enabled.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving…" : dialogMode === "create" ? "Create role" : "Save changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete role?</DialogTitle>
            <DialogDescription>
              This cannot be undone. Role key: <span className="font-mono">{selectedRole?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRole} disabled={saving}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
