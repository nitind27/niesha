"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { Loader2, GraduationCap, Users, BookOpen, Layers, User } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ClassDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string | null
}

export function ClassDetailDialog({
  open,
  onOpenChange,
  classId,
}: ClassDetailDialogProps) {
  const [classData, setClassData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && classId) {
      setLoading(true)
      api
        .get(`/classes/${classId}`)
        .then((res) => {
          setClassData(res.data.class)
        })
        .catch((error) => {
          console.error("Error fetching class:", error)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setClassData(null)
    }
  }, [open, classId])

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Class Details</DialogTitle>
          <DialogDescription>Complete information about the class</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : classData ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Class Name</p>
                  <p className="text-lg font-semibold">{classData.name}</p>
                </div>
                {classData.level !== null && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Level</p>
                    <p className="text-lg">{classData.level}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                  <p className="text-lg">{classData.capacity} students</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      classData.status === "active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {classData.status}
                  </Badge>
                </div>
                {classData.classTeacher && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Class Teacher</p>
                    <p className="text-lg">
                      {classData.classTeacher.firstName} {classData.classTeacher.lastName}
                    </p>
                    {classData.classTeacher.email && (
                      <p className="text-sm text-muted-foreground">{classData.classTeacher.email}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{classData._count?.students || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sections</p>
                  <p className="text-2xl font-bold">{classData._count?.sections || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Subjects</p>
                  <p className="text-2xl font-bold">{classData._count?.subjects || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Exams</p>
                  <p className="text-2xl font-bold">{classData._count?.exams || 0}</p>
                </div>
              </CardContent>
            </Card>

            {/* Sections */}
            {classData.sections && classData.sections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Sections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Section Name</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Students</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classData.sections.map((section: any) => (
                          <TableRow key={section.id}>
                            <TableCell className="font-medium">{section.name}</TableCell>
                            <TableCell>{section.capacity}</TableCell>
                            <TableCell>{section._count?.students || 0}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  section.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {section.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Class not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

