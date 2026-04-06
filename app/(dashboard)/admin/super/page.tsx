"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  BarChart3,
  ChevronRight,
} from "lucide-react"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
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

interface DashboardStats {
  overview: {
    totalSchools: number
    activeSchools: number
    totalUsers: number
    activeUsers: number
    totalStudents: number
    totalStaff: number
    totalClasses: number
    totalExams: number
    totalPayments: number
    totalRevenue: number
  }
  growth: {
    schools: { thisMonth: number; lastMonth: number; percentage: number }
    users: { thisMonth: number; lastMonth: number; percentage: number }
  }
  distribution: {
    schoolsByStatus: Array<{ status: string; count: number }>
    usersByRole: Array<{ role: string; count: number }>
    studentsByStatus: Array<{ status: string; count: number }>
    staffByDesignation: Array<{ designation: string; count: number }>
  }
  trends: {
    schoolsByMonth: Array<{ month: string; count: number }>
    usersByMonth: Array<{ month: string; count: number }>
    revenueByMonth: Array<{ month: string; revenue: number }>
  }
  recent: {
    schools: Array<any>
    users: Array<any>
  }
}

const COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
}

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
}

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
  },
}

export default function SuperAdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get("/admin/stats")
      setStats(response.data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to fetch statistics",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (user?.role !== "super_admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Access Denied</p>
      </div>
    )
  }

  if (isLoading || !stats) {
    return (
      <div className="flex h-screen items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </motion.div>
      </div>
    )
  }

  const statCards = [
    {
      title: "Tenants",
      value: stats.overview.totalSchools,
      subtitle: `${stats.overview.activeSchools} active`,
      icon: Building2,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
      trend: stats.growth.schools.percentage,
      trendLabel: "vs last month",
      href: "/admin/super/schools",
    },
    {
      title: "Total Users",
      value: stats.overview.totalUsers,
      subtitle: `${stats.overview.activeUsers} active`,
      icon: Users,
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100 dark:from-green-950 dark:to-green-900",
      trend: stats.growth.users.percentage,
      trendLabel: "vs last month",
      href: "/admin/super/admins",
    },
    {
      title: "Total Students",
      value: stats.overview.totalStudents.toLocaleString(),
      subtitle: "Across all tenants",
      icon: GraduationCap,
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900",
      href: "/admin/super/schools",
    },
    {
      title: "Total Staff",
      value: stats.overview.totalStaff.toLocaleString(),
      subtitle: "Across all tenants",
      icon: UserCheck,
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900",
      href: "/admin/super/admins",
    },
    {
      title: "Total Classes",
      value: stats.overview.totalClasses.toLocaleString(),
      subtitle: "Active classes",
      icon: BookOpen,
      gradient: "from-indigo-500 to-indigo-600",
      bgGradient: "from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900",
      href: "/admin/super/schools",
    },
    {
      title: "Total Revenue",
      value: `$${stats.overview.totalRevenue.toLocaleString()}`,
      subtitle: `${stats.overview.totalPayments} payments`,
      icon: DollarSign,
      gradient: "from-yellow-500 to-yellow-600",
      bgGradient: "from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900",
      href: "/admin/super/schools",
    },
  ]

  // Prepare chart data
  const schoolsChartData = stats.trends.schoolsByMonth.map((item) => ({
    name: item.month.split(" ")[0],
    value: item.count,
  }))

  const usersChartData = stats.trends.usersByMonth.map((item) => ({
    name: item.month.split(" ")[0],
    value: item.count,
  }))

  const revenueChartData = stats.trends.revenueByMonth.map((item) => ({
    name: item.month.split(" ")[0],
    revenue: item.revenue / 1000, // Convert to thousands
  }))

  const schoolsStatusData = stats.distribution.schoolsByStatus.map((item, index) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }))

  const usersRoleData = stats.distribution.usersByRole.slice(0, 5).map((item, index) => ({
    name: item.role,
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }))

  const studentsStatusData = stats.distribution.studentsByStatus.map((item, index) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }))

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <motion.h1
            className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            Super Admin Dashboard
          </motion.h1>
          <p className="text-muted-foreground mt-2">
            Overview of tenants, users, and platform statistics
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Badge variant="outline" className="px-4 py-2 text-base">
            <Shield className="mr-2 h-4 w-4" />
            Super Administrator
          </Badge>
        </motion.div>
      </motion.div>

      {/* Main Stats Cards */}
      <motion.div
        variants={containerVariants}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {statCards.map((card, index) => {
          const Icon = card.icon
          const isPositive = card.trend !== undefined && card.trend >= 0
          return (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover="hover"
              initial="rest"
              animate="rest"
            >
              <motion.div variants={cardHoverVariants}>
                <Link href={(card as any).href ?? "#"}>
                <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-50`} />
                  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    <motion.div
                      className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </motion.div>
                  </CardHeader>
                  <CardContent className="relative">
                    <motion.div
                      className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                    >
                      {card.value}
                    </motion.div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                      {card.trend !== undefined ? (
                        <motion.div
                          className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
                            isPositive
                              ? "text-green-600 bg-green-100 dark:bg-green-900/30"
                              : "text-red-600 bg-red-100 dark:bg-red-900/30"
                          }`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 + 0.3 }}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(card.trend).toFixed(1)}%
                        </motion.div>
                      ) : (
                        <span className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors">
                          View <ChevronRight className="h-3 w-3 ml-0.5" />
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </Link>
              </motion.div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Charts Row 1 - Line Charts */}
      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Tenant growth
                </CardTitle>
                <CardDescription>New organizations created over time</CardDescription>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.growth.schools.percentage > 0 ? "+" : ""}
                {stats.growth.schools.percentage.toFixed(1)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={schoolsChartData}>
                <defs>
                  <linearGradient id="schoolsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#schoolsGradient)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  Users Growth
                </CardTitle>
                <CardDescription>New users created over time</CardDescription>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.growth.users.percentage > 0 ? "+" : ""}
                {stats.growth.users.percentage.toFixed(1)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={usersChartData}>
                <defs>
                  <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#usersGradient)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row 2 - Revenue & Pie Charts */}
      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
        {revenueChartData.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-yellow-500" />
                    Revenue Trend
                  </CardTitle>
                  <CardDescription>Monthly revenue (in thousands)</CardDescription>
                </div>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                  <Target className="h-3 w-3 mr-1" />
                  ₹{(stats.overview.totalRevenue / 1000).toFixed(0)}k
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => `₹${value.toFixed(1)}k`}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="url(#revenueGradient)"
                    radius={[8, 8, 0, 0]}
                    animationDuration={1000}
                  >
                    {revenueChartData.map((entry, index) => (
                      <defs key={index}>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Schools Status
            </CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={schoolsStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={1000}
                >
                  {schoolsStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row 3 - More Pie Charts */}
      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              Users by Role
            </CardTitle>
            <CardDescription>Distribution of users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={usersRoleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={1000}
                >
                  {usersRoleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-pink-500" />
              Students Status
            </CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={studentsStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={1000}
                >
                  {studentsStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              Recent organizations
            </CardTitle>
            <CardDescription>Latest tenants created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent.schools.map((school, index) => (
                <motion.div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-all duration-300 hover:shadow-md cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  onClick={() => window.location.href = `/admin/super/schools`}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-base">{school.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {school._count.users} users
                      </span>
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {school._count.students} students
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={school.status === "active" ? "default" : "secondary"}
                    className="ml-4"
                  >
                    {school.status}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              Recent Users
            </CardTitle>
            <CardDescription>Latest users created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent.users.map((user, index) => (
                <motion.div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-all duration-300 hover:shadow-md cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  onClick={() => window.location.href = `/admin/super/admins`}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-base">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {user.role.displayName} {user.school ? `â€¢ ${user.school.name}` : ""}
                    </div>
                  </div>
                  <Badge
                    variant={user.isActive ? "default" : "secondary"}
                    className="ml-4"
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
