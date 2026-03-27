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
import { Loader2, Mail, Phone, MapPin, Calendar, Briefcase, User } from "lucide-react"

interface StaffDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staffId: string | null
}

export function StaffDetailDialog({
  open,
  onOpenChange,
  staffId,
}: StaffDetailDialogProps) {
  const [staff, setStaff] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && staffId) {
      setLoading(true)
      api
        .get(`/staff/${staffId}`)
        .then((res) => {
          setStaff(res.data.staff)
        })
        .catch((error) => {
          console.error("Error fetching staff:", error)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setStaff(null)
    }
  }, [open, staffId])

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Staff Details</DialogTitle>
          <DialogDescription>Complete information about the staff member</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : staff ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                  <p className="text-lg font-semibold">{staff.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-lg font-semibold">
                    {staff.firstName} {staff.lastName}
                  </p>
                </div>
                {staff.dateOfBirth && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                    <p className="text-lg">{formatDate(staff.dateOfBirth)}</p>
                  </div>
                )}
                {staff.gender && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gender</p>
                    <p className="text-lg capitalize">{staff.gender}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      staff.status === "active"
                        ? "default"
                        : staff.status === "on_leave"
                        ? "secondary"
                        : staff.status === "terminated"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {staff.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Designation</p>
                  <p className="text-lg font-semibold">{staff.designation}</p>
                </div>
                {staff.department && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Department</p>
                    <p className="text-lg">{staff.department}</p>
                  </div>
                )}
                {staff.joiningDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Joining Date</p>
                    <p className="text-lg">{formatDate(staff.joiningDate)}</p>
                  </div>
                )}
                {staff.experience !== null && staff.experience !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Experience</p>
                    <p className="text-lg">{staff.experience} years</p>
                  </div>
                )}
                {staff.salary !== null && staff.salary !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Salary</p>
                    <p className="text-lg">${Number(staff.salary).toLocaleString()}</p>
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
                {staff.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="text-lg">{staff.phone}</p>
                    </div>
                  </div>
                )}
                {staff.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-lg">{staff.email}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address */}
            {staff.address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg">{staff.address}</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Staff member not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

