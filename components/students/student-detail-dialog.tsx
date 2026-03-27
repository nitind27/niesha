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
import { Loader2, Mail, Phone, MapPin, Calendar, GraduationCap, Users } from "lucide-react"

interface StudentDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId: string | null
}

export function StudentDetailDialog({
  open,
  onOpenChange,
  studentId,
}: StudentDetailDialogProps) {
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && studentId) {
      setLoading(true)
      api
        .get(`/students/${studentId}`)
        .then((res) => {
          setStudent(res.data.student)
        })
        .catch((error) => {
          console.error("Error fetching student:", error)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setStudent(null)
    }
  }, [open, studentId])

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
          <DialogDescription>Complete information about the student</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : student ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admission Number</p>
                  <p className="text-lg font-semibold">{student.admissionNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-lg font-semibold">
                    {student.firstName} {student.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                  <p className="text-lg">{formatDate(student.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gender</p>
                  <p className="text-lg capitalize">{student.gender}</p>
                </div>
                {student.bloodGroup && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Blood Group</p>
                    <p className="text-lg">{student.bloodGroup}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
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
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Class</p>
                  <p className="text-lg">{student.class?.name || "Not Assigned"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Section</p>
                  <p className="text-lg">{student.section?.name || "Not Assigned"}</p>
                </div>
                {student.enrollmentDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Enrollment Date</p>
                    <p className="text-lg">{formatDate(student.enrollmentDate)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {student.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="text-lg">{student.phone}</p>
                    </div>
                  </div>
                )}
                {student.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-lg">{student.email}</p>
                    </div>
                  </div>
                )}
                {student.parentPhone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Parent Phone</p>
                    <p className="text-lg">{student.parentPhone}</p>
                  </div>
                )}
                {student.parentEmail && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Parent Email</p>
                    <p className="text-lg">{student.parentEmail}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address */}
            {(student.address ||
              student.city ||
              student.state ||
              student.country ||
              student.zipCode) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {student.address && <p className="text-lg">{student.address}</p>}
                    <div className="flex flex-wrap gap-2 text-muted-foreground">
                      {student.city && <span>{student.city}</span>}
                      {student.state && <span>{student.state}</span>}
                      {student.country && <span>{student.country}</span>}
                      {student.zipCode && <span>{student.zipCode}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Attendance */}
            {student.attendance && student.attendance.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {student.attendance.slice(0, 5).map((att: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span>{formatDate(att.date)}</span>
                        <Badge
                          variant={
                            att.status === "present"
                              ? "default"
                              : att.status === "absent"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {att.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Student not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

