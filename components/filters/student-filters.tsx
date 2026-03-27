"use client"

import { useState, useEffect } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Filter, X } from "lucide-react"
import api from "@/lib/api"
import { StudentFilters } from "@/hooks/useStudents"

interface StudentFiltersProps {
  filters: StudentFilters
  onFiltersChange: (filters: Partial<StudentFilters>) => void
  onReset: () => void
}

export function StudentFiltersComponent({
  filters,
  onFiltersChange,
  onReset,
}: StudentFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [classes, setClasses] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])

  useEffect(() => {
    // Fetch classes and sections for filters
    Promise.all([
      api.get("/classes").catch(() => ({ data: { classes: [] } })),
      filters.classId
        ? api.get(`/classes/${filters.classId}/sections`).catch(() => ({ data: { sections: [] } }))
        : Promise.resolve({ data: { sections: [] } }),
    ]).then(([classesRes, sectionsRes]) => {
      setClasses(classesRes.data.classes || [])
      setSections(sectionsRes.data.sections || [])
    })
  }, [filters.classId])

  const hasActiveFilters = Object.values(filters).some((value) => value && value !== "")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {Object.values(filters).filter((v) => v && v !== "").length}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Filter Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status || ""}
                  onValueChange={(value) =>
                    onFiltersChange({ status: value === "all" ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                    <SelectItem value="transferred">Transferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Class</Label>
                <Select
                  value={filters.classId || ""}
                  onValueChange={(value) => {
                    onFiltersChange({
                      classId: value === "all" ? undefined : value,
                      sectionId: undefined, // Reset section when class changes
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Section</Label>
                <Select
                  value={filters.sectionId || ""}
                  onValueChange={(value) =>
                    onFiltersChange({ sectionId: value === "all" ? undefined : value })
                  }
                  disabled={!filters.classId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Sections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={filters.gender || ""}
                  onValueChange={(value) =>
                    onFiltersChange({ gender: value === "all" ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Genders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) => onFiltersChange({ startDate: e.target.value || undefined })}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) => onFiltersChange({ endDate: e.target.value || undefined })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

