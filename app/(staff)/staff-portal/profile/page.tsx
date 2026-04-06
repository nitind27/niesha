"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Phone, Mail, MapPin, Briefcase, Calendar, DollarSign } from "lucide-react"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"

export default function StaffProfilePage() {
  const [staff, setStaff] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get("/staff/me").then((r) => setStaff(r.data.staff)).catch(() => {}).finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <div className="h-64 rounded-2xl bg-muted animate-pulse" />
  if (!staff) return <div className="text-center py-20 text-muted-foreground">Profile not found. Contact your administrator.</div>

  const rows = [
    { label: "Employee ID", value: staff.employeeId, icon: Briefcase },
    { label: "Designation", value: staff.designation, icon: Briefcase },
    { label: "Department", value: staff.department || "—", icon: Briefcase },
    { label: "Date of Birth", value: staff.dateOfBirth ? formatDate(staff.dateOfBirth) : "—", icon: Calendar },
    { label: "Joining Date", value: staff.joiningDate ? formatDate(staff.joiningDate) : "—", icon: Calendar },
    { label: "Experience", value: staff.experience ? `${staff.experience} years` : "—", icon: User },
    { label: "Phone", value: staff.phone || "—", icon: Phone },
    { label: "Email", value: staff.email || "—", icon: Mail },
    { label: "Address", value: staff.address || "—", icon: MapPin },
    { label: "Salary", value: staff.salary ? `₹${Number(staff.salary).toLocaleString()}` : "—", icon: DollarSign },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground text-sm">Your personal and professional details</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{staff.firstName} {staff.lastName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={staff.status === "active" ? "default" : "secondary"}>{staff.status}</Badge>
                <span className="text-sm text-muted-foreground">{staff.designation}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{staff.school?.name}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-start gap-3 rounded-xl bg-muted/40 px-4 py-3">
                <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
