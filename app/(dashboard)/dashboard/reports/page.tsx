"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Download,
  FileText,
  Users,
  GraduationCap,
  DollarSign,
  BookOpen,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import api from "@/lib/api"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ErpModuleStrip } from "@/components/erp/erp-module-strip"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get("/reports/stats")
      setStats(response.data)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = (type: string) => {
    // Export logic
    console.log("Exporting", type)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Failed to load reports</p>
        </div>
      </div>
    )
  }

  // Calculate percentages for progress bars
  const studentActivePercent = stats.students.total > 0
    ? (stats.students.active / stats.students.total) * 100
    : 0

  const attendancePercent = stats.attendance.total > 0
    ? ((stats.attendance.byStatus.find((s: any) => s.status === "present")?.count || 0) / stats.attendance.total) * 100
    : 0

  const paymentCompletionPercent = (stats.payments.pending + stats.payments.completed) > 0
    ? (stats.payments.completed / (stats.payments.pending + stats.payments.completed)) * 100
    : 0

  const libraryUtilizationPercent = stats.library.totalBooks > 0
    ? ((stats.library.totalBooks - stats.library.availableBooks) / stats.library.totalBooks) * 100
    : 0

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights and statistics</p>
        </div>
        <Button onClick={() => handleExport("all")}>
          <Download className="mr-2 h-4 w-4" />
          Export All Reports
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-in slide-in-from-left duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.students.active} active students
            </p>
            <Progress value={studentActivePercent} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="animate-in slide-in-from-left duration-500 delay-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.payments.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.payments.completed} completed payments
            </p>
            <Progress value={paymentCompletionPercent} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="animate-in slide-in-from-left duration-500 delay-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendance.today}</div>
            <p className="text-xs text-muted-foreground">
              {stats.attendance.total} total records
            </p>
            <Progress value={attendancePercent} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="animate-in slide-in-from-left duration-500 delay-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Library Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.library.totalBooks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.library.availableBooks} available
            </p>
            <Progress value={libraryUtilizationPercent} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Monthly Revenue Chart */}
        <Card className="animate-in slide-in-from-bottom duration-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Monthly Revenue</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.payments.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Trend */}
        <Card className="animate-in slide-in-from-bottom duration-500 delay-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Attendance Trend</CardTitle>
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.attendance.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Student Distribution by Class */}
        <Card className="animate-in slide-in-from-bottom duration-500 delay-200">
          <CardHeader>
            <CardTitle>Student Distribution by Class</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.students.distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="students"
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {stats.students.distribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance by Status */}
        <Card className="animate-in slide-in-from-bottom duration-500 delay-300">
          <CardHeader>
            <CardTitle>Attendance by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.attendance.byStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="animate-in slide-in-from-right duration-500">
          <CardHeader>
            <CardTitle className="text-lg">Student Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active</span>
              <Badge variant="default">{stats.students.active}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Graduated</span>
              <Badge variant="secondary">{stats.students.graduated}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transferred</span>
              <Badge variant="outline">{stats.students.transferred}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-in slide-in-from-right duration-500 delay-100">
          <CardHeader>
            <CardTitle className="text-lg">Payment Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed</span>
              <Badge variant="default">{stats.payments.completed}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending</span>
              <Badge variant="destructive">{stats.payments.pending}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="font-semibold">
                ${stats.payments.totalRevenue.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-in slide-in-from-right duration-500 delay-200">
          <CardHeader>
            <CardTitle className="text-lg">Library Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Books</span>
              <Badge variant="default">{stats.library.totalBooks}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available</span>
              <Badge variant="secondary">{stats.library.availableBooks}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Issued</span>
              <Badge variant="outline">{stats.library.issuedBooks}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="animate-in fade-in duration-500 delay-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalStaff}</div>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in duration-500 delay-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalClasses}</div>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in duration-500 delay-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalSubjects}</div>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in duration-500 delay-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalExams}</div>
          </CardContent>
        </Card>
      </div>

      <ErpModuleStrip module="reports" />
    </div>
  )
}
