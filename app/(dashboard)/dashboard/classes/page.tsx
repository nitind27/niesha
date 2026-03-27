"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "@/hooks/useLanguage"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  MoreVertical,
  ArrowUpDown,
  CheckSquare,
  Square,
} from "lucide-react"
import { useClasses } from "@/hooks/useClasses"
import { useDebounce } from "@/hooks/useDebounce"
import { TableSkeleton } from "@/components/loading/table-skeleton"
import { ClassFormDialog } from "@/components/classes/class-form-dialog"
import { ClassDetailDialog } from "@/components/classes/class-detail-dialog"
import { ClassStatsCards } from "@/components/classes/class-stats-cards"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import api from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ErpModuleStrip } from "@/components/erp/erp-module-strip"

export default function ClassesPage() {
  const { t } = useTranslation()
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 300)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [detailClassId, setDetailClassId] = useState<string | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalStudents: 0,
    totalSections: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [sortConfig, setSortConfig] = useState<{
    field: string
    direction: "asc" | "desc"
  }>({ field: "level", direction: "asc" })
  const { toast } = useToast()

  const {
    classes,
    isLoading,
    error,
    pagination,
    filters,
    setFilters,
    setPage,
    refetch,
  } = useClasses()

  // Fetch stats
  useEffect(() => {
    setLoadingStats(true)
    api
      .get("/classes/stats")
      .then((res) => {
        setStats(res.data)
      })
      .catch(() => {})
      .finally(() => {
        setLoadingStats(false)
      })
  }, [classes.length])

  // Update search filter when debounced value changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters({ search: debouncedSearch || undefined })
    }
  }, [debouncedSearch])

  const handleResetFilters = () => {
    setFilters({})
    setSearchInput("")
  }

  const handleCreate = () => {
    setSelectedClass(null)
    setIsFormOpen(true)
  }

  const handleEdit = (classItem: any) => {
    setSelectedClass(classItem)
    setIsFormOpen(true)
  }

  const handleDelete = async (classId: string) => {
    const classItem = classes.find((c) => c.id === classId)
    const className = classItem ? classItem.name : "this class"
    
    if (!confirm(`Are you sure you want to delete ${className}? This action cannot be undone.`)) return

    try {
      await api.delete(`/classes/${classId}`)
      toast({
        variant: "success",
        title: "Class Deleted",
        description: `${className} has been deleted successfully.`,
      })
      refetch()
      setStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }))
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.response?.data?.error || "Failed to delete class. Please try again.",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedRows.size} class(es)? This action cannot be undone.`)) return

    try {
      await Promise.all(
        Array.from(selectedRows).map((id) => api.delete(`/classes/${id}`))
      )
      toast({
        variant: "success",
        title: "Classes Deleted",
        description: `${selectedRows.size} class(es) have been deleted successfully.`,
      })
      setSelectedRows(new Set())
      refetch()
      setStats((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - selectedRows.size),
      }))
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete some classes. Please try again.",
      })
    }
  }

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedRows.size === 0) return

    try {
      await Promise.all(
        Array.from(selectedRows).map((id) =>
          api.patch(`/classes/${id}`, { status })
        )
      )
      toast({
        variant: "success",
        title: "Status Updated",
        description: `${selectedRows.size} class(es) have been marked as ${status}.`,
      })
      setSelectedRows(new Set())
      refetch()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update some classes. Please try again.",
      })
    }
  }

  const handleSort = (field: string) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }))
    setFilters({
      sortBy: field,
      sortOrder: sortConfig.field === field && sortConfig.direction === "asc" ? "desc" : "asc",
    })
  }

  const toggleRowSelection = (classId: string) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(classId)) {
        newSet.delete(classId)
      } else {
        newSet.add(classId)
      }
      return newSet
    })
  }

  const toggleAllRows = () => {
    if (selectedRows.size === classes.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(classes.map((c) => c.id)))
    }
  }

  const handleExport = () => {
    // Simple CSV export
    const headers = [
      "Class Name",
      "Level",
      "Capacity",
      "Students",
      "Sections",
      "Class Teacher",
      "Status",
    ]
    const rows = classes.map((c) => [
      c.name,
      c.level || "-",
      c.capacity,
      c._count?.students || 0,
      c._count?.sections || 0,
      c.classTeacher ? `${c.classTeacher.firstName} ${c.classTeacher.lastName}` : "-",
      c.status,
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `classes-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer hover:bg-accent" onClick={() => handleSort(field)}>
      <div className="flex items-center gap-2">
        {children}
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      </div>
    </TableHead>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("nav.classes")}</h1>
          <p className="text-muted-foreground">Manage all classes in your school</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedRows.size > 0 && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Bulk Actions ({selectedRows.size})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate("active")}>
                    Mark as Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate("inactive")}>
                    Mark as Inactive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleBulkDelete}
                    className="text-destructive"
                  >
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" onClick={() => setSelectedRows(new Set())}>
                Clear Selection
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("common.create")} {t("nav.classes")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <ClassStatsCards stats={stats} isLoading={loadingStats} />

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({ status: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filters.status && (
              <Button variant="outline" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {isLoading ? (
            <TableSkeleton rows={10} cols={8} />
          ) : classes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No classes found. Try adjusting your filters.
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={toggleAllRows}
                        >
                          {selectedRows.size === classes.length ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <SortableHeader field="name">Class Name</SortableHeader>
                      <SortableHeader field="level">Level</SortableHeader>
                      <SortableHeader field="capacity">Capacity</SortableHeader>
                      <TableHead>Students</TableHead>
                      <TableHead>Sections</TableHead>
                      <TableHead>Class Teacher</TableHead>
                      <SortableHeader field="status">Status</SortableHeader>
                      <TableHead className="text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((classItem) => (
                      <TableRow
                        key={classItem.id}
                        className={selectedRows.has(classItem.id) ? "bg-accent" : ""}
                      >
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleRowSelection(classItem.id)}
                          >
                            {selectedRows.has(classItem.id) ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          {classItem.name}
                        </TableCell>
                        <TableCell>{classItem.level || "-"}</TableCell>
                        <TableCell>{classItem.capacity}</TableCell>
                        <TableCell>{classItem._count?.students || 0}</TableCell>
                        <TableCell>{classItem._count?.sections || 0}</TableCell>
                        <TableCell>
                          {classItem.classTeacher
                            ? `${classItem.classTeacher.firstName} ${classItem.classTeacher.lastName}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              classItem.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {classItem.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setDetailClassId(classItem.id)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(classItem)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(classItem.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} classes
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrevPage}
                      onClick={() => setPage(pagination.page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i
                        } else {
                          pageNum = pagination.page - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNextPage}
                      onClick={() => setPage(pagination.page + 1)}
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

      <ErpModuleStrip module="classes" />

      {/* Dialogs */}
      <ClassFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        classData={selectedClass}
        onSuccess={() => {
          refetch()
          setStats((prev) => {
            if (selectedClass) {
              return prev // No change in total for updates
            }
            return {
              ...prev,
              total: prev.total + 1,
            }
          })
        }}
      />

      <ClassDetailDialog
        open={detailClassId !== null}
        onOpenChange={(open) => !open && setDetailClassId(null)}
        classId={detailClassId}
      />
    </div>
  )
}
