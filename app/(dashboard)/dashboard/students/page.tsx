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
import { useStudents } from "@/hooks/useStudents"
import { StudentFiltersComponent } from "@/components/filters/student-filters"
import { formatDate } from "@/lib/utils"
import { useDebounce } from "@/hooks/useDebounce"
import { TableSkeleton } from "@/components/loading/table-skeleton"
import { StudentFormDialog } from "@/components/students/student-form-dialog"
import { StudentDetailDialog } from "@/components/students/student-detail-dialog"
import { StudentStatsCards } from "@/components/students/student-stats-cards"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import api from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ErpModuleStrip } from "@/components/erp/erp-module-strip"

export default function StudentsPage() {
  const { t } = useTranslation()
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 300)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    graduated: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [sortConfig, setSortConfig] = useState<{
    field: string
    direction: "asc" | "desc"
  }>({ field: "createdAt", direction: "desc" })
  const { toast } = useToast()

  const {
    students,
    isLoading,
    error,
    pagination,
    filters,
    setFilters,
    setPage,
    refetch,
  } = useStudents()

  // Fetch stats
  useEffect(() => {
    setLoadingStats(true)
    api
      .get("/students/stats")
      .then((res) => {
        setStats(res.data)
      })
      .catch(() => {})
      .finally(() => {
        setLoadingStats(false)
      })
  }, [students.length])

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
    setSelectedStudent(null)
    setIsFormOpen(true)
  }

  const handleEdit = (student: any) => {
    setSelectedStudent(student)
    setIsFormOpen(true)
  }

  const handleDelete = async (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    const studentName = student ? `${student.firstName} ${student.lastName}` : "this student"
    
    if (!confirm(`Are you sure you want to delete ${studentName}? This action cannot be undone.`)) return

    try {
      await api.delete(`/students/${studentId}`)
      toast({
        variant: "success",
        title: "Student Deleted",
        description: `${studentName} has been deleted successfully.`,
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
        description: error.response?.data?.error || "Failed to delete student. Please try again.",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedRows.size} student(s)? This action cannot be undone.`)) return

    try {
      await Promise.all(
        Array.from(selectedRows).map((id) => api.delete(`/students/${id}`))
      )
      toast({
        variant: "success",
        title: "Students Deleted",
        description: `${selectedRows.size} student(s) have been deleted successfully.`,
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
        description: "Failed to delete some students. Please try again.",
      })
    }
  }

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedRows.size === 0) return

    try {
      await Promise.all(
        Array.from(selectedRows).map((id) =>
          api.patch(`/students/${id}`, { status })
        )
      )
      toast({
        variant: "success",
        title: "Status Updated",
        description: `${selectedRows.size} student(s) have been marked as ${status}.`,
      })
      setSelectedRows(new Set())
      refetch()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update some students. Please try again.",
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

  const toggleRowSelection = (studentId: string) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(studentId)) {
        newSet.delete(studentId)
      } else {
        newSet.add(studentId)
      }
      return newSet
    })
  }

  const toggleAllRows = () => {
    if (selectedRows.size === students.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(students.map((s) => s.id)))
    }
  }

  const handleExport = () => {
    // Simple CSV export
    const headers = [
      "Admission No.",
      "Name",
      "Class",
      "Section",
      "Date of Birth",
      "Gender",
      "Status",
      "Email",
      "Phone",
    ]
    const rows = students.map((s) => [
      s.admissionNumber,
      `${s.firstName} ${s.lastName}`,
      s.class?.name || "-",
      s.section?.name || "-",
      formatDate(s.dateOfBirth),
      s.gender,
      s.status,
      s.email || "-",
      s.phone || "-",
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `students-${new Date().toISOString().split("T")[0]}.csv`
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
          <h1 className="text-3xl font-bold">{t("nav.students")}</h1>
          <p className="text-muted-foreground">Manage all students in your school</p>
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
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate("graduated")}>
                    Mark as Graduated
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
            {t("common.create")} {t("nav.students")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StudentStatsCards stats={stats} isLoading={loadingStats} />

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
          <StudentFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            onReset={handleResetFilters}
          />

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {isLoading ? (
            <TableSkeleton rows={10} cols={9} />
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No students found. Try adjusting your filters.
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
                          {selectedRows.size === students.length ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <SortableHeader field="admissionNumber">Admission No.</SortableHeader>
                      <SortableHeader field="firstName">Name</SortableHeader>
                      <SortableHeader field="classId">Class</SortableHeader>
                      <SortableHeader field="sectionId">Section</SortableHeader>
                      <SortableHeader field="dateOfBirth">Date of Birth</SortableHeader>
                      <SortableHeader field="gender">Gender</SortableHeader>
                      <SortableHeader field="status">Status</SortableHeader>
                      <TableHead className="text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow
                        key={student.id}
                        className={selectedRows.has(student.id) ? "bg-accent" : ""}
                      >
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleRowSelection(student.id)}
                          >
                            {selectedRows.has(student.id) ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.admissionNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {student.firstName} {student.lastName}
                            </div>
                            {student.email && (
                              <div className="text-sm text-muted-foreground">
                                {student.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{student.class?.name || "-"}</TableCell>
                        <TableCell>{student.section?.name || "-"}</TableCell>
                        <TableCell>{formatDate(student.dateOfBirth)}</TableCell>
                        <TableCell className="capitalize">{student.gender}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              student.status === "active"
                                ? "default"
                                : student.status === "inactive"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {student.status}
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
                                onClick={() => setDetailStudentId(student.id)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(student)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(student.id)}
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
                    {pagination.total} students
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

      <ErpModuleStrip module="students" />

      {/* Dialogs */}
      <StudentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        student={selectedStudent}
        onSuccess={() => {
          refetch()
          setStats((prev) => ({
            ...prev,
            total: selectedStudent ? prev.total : prev.total + 1,
          }))
        }}
      />

      <StudentDetailDialog
        open={detailStudentId !== null}
        onOpenChange={(open) => !open && setDetailStudentId(null)}
        studentId={detailStudentId}
      />
    </div>
  )
}
