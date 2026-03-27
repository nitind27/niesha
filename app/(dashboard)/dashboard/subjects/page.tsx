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
  MoreVertical,
  ArrowUpDown,
} from "lucide-react"
import { useSubjects } from "@/hooks/useSubjects"
import { useDebounce } from "@/hooks/useDebounce"
import { TableSkeleton } from "@/components/loading/table-skeleton"
import { SubjectFormDialog } from "@/components/subjects/subject-form-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

export default function SubjectsPage() {
  const { t } = useTranslation()
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 300)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<any>(null)
  const [sortConfig, setSortConfig] = useState<{
    field: string
    direction: "asc" | "desc"
  }>({ field: "name", direction: "asc" })
  const { toast } = useToast()

  const {
    subjects,
    isLoading,
    error,
    pagination,
    filters,
    setFilters,
    setPage,
    refetch,
  } = useSubjects()

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters({ search: debouncedSearch || undefined })
    }
  }, [debouncedSearch, filters.search, setFilters])

  const handleResetFilters = () => {
    setFilters({})
    setSearchInput("")
  }

  const handleCreate = () => {
    setSelectedSubject(null)
    setIsFormOpen(true)
  }

  const handleEdit = (subject: any) => {
    setSelectedSubject(subject)
    setIsFormOpen(true)
  }

  const handleDelete = async (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId)
    const subjectName = subject ? subject.name : "this subject"
    
    if (!confirm(`Are you sure you want to delete ${subjectName}? This action cannot be undone.`)) return

    try {
      await api.delete(`/subjects/${subjectId}`)
      toast({
        variant: "success",
        title: "Subject Deleted",
        description: `${subjectName} has been deleted successfully.`,
      })
      refetch()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.response?.data?.error || "Failed to delete subject. Please try again.",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subjects</h1>
          <p className="text-muted-foreground">Manage all subjects in your school</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
            {(filters.status) && (
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
            <TableSkeleton rows={10} cols={7} />
          ) : subjects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No subjects found. Try adjusting your filters.
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader field="name">Subject Name</SortableHeader>
                      <SortableHeader field="code">Code</SortableHeader>
                      <TableHead>Class</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Credits</TableHead>
                      <SortableHeader field="status">Status</SortableHeader>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">
                          {subject.name}
                        </TableCell>
                        <TableCell>{subject.code || "-"}</TableCell>
                        <TableCell>{subject.class?.name || "-"}</TableCell>
                        <TableCell>
                          {subject.teacher
                            ? `${subject.teacher.firstName} ${subject.teacher.lastName}`
                            : "-"}
                        </TableCell>
                        <TableCell>{subject.credits || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              subject.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {subject.status}
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
                              <DropdownMenuItem onClick={() => handleEdit(subject)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(subject.id)}
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
                    {pagination.total} subjects
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

      <ErpModuleStrip module="subjects" />

      <SubjectFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        subject={selectedSubject}
        onSuccess={() => {
          refetch()
        }}
      />
    </div>
  )
}

