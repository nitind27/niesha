"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Phone, Mail, MapPin, GraduationCap, Calendar } from "lucide-react"
import api from "@/lib/api"
import { formatDate } from "@/lib/utils"

export default function StudentProfilePage() {
  const [student, setStudent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get("/student/me")
      .then((r) => setStudent(r.data.student))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <div className="h-64 rounded-2xl bg-muted animate-pulse" />

  if (!student) return (
    <div className="text-center py-20 text-muted-foreground">Profile not found. Contact your administrator.</div>
  )

  const rows = [
    { label: "Admission No.", value: student.admissionNumber, icon: GraduationCap },
    { label: "Date of Birth", value: formatDate(student.dateOfBirth), icon: Calendar },
    { label: "Gender", value: student.gender, icon: User },
    { label: "Blood Group", value: student.bloodGroup || "—", icon: User },
    { label: "Phone", value: student.phone || "—", icon: Phone },
    { label: "Email", value: student.email || "—", icon: Mail },
    { label: "Address", value: [student.address, student.city, student.state, student.country].filter(Boolean).join(", ") || "—", icon: MapPin },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground text-sm">Your personal and academic details</p>
      </div>

      {/* Identity card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{student.firstName} {student.lastName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={student.status === "active" ? "default" : "secondary"}>{student.status}</Badge>
                {student.class && (
                  <span className="text-sm text-muted-foreground">
                    {student.class.name}{student.section ? ` · Section ${student.section.name}` : ""}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{student.school?.name}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-start gap-3 rounded-xl bg-muted/40 px-4 py-3">
                <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium capitalize">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Parent info */}
      {(student.parentPhone || student.parentEmail) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Parent / Guardian</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {student.parentPhone && (
              <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Parent Phone</p>
                  <p className="text-sm font-medium">{student.parentPhone}</p>
                </div>
              </div>
            )}
            {student.parentEmail && (
              <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Parent Email</p>
                  <p className="text-sm font-medium">{student.parentEmail}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
