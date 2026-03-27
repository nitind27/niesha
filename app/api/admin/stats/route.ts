import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SUPER_ADMIN_ALL)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    if (payload.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get date range for trends (last 6 months)
    const now = new Date()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(now.getMonth() - 6)
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(now.getMonth() - 1)

    // Overall Statistics
    const [
      totalSchools,
      activeSchools,
      totalUsers,
      activeUsers,
      totalStudents,
      totalStaff,
      totalClasses,
      totalExams,
      totalPayments,
      totalRevenue,
    ] = await Promise.all([
      prisma.school.count({ where: { deletedAt: null } }),
      prisma.school.count({ where: { deletedAt: null, status: "active" } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, isActive: true } }),
      prisma.student.count({ where: { deletedAt: null } }),
      prisma.staff.count({ where: { deletedAt: null } }),
      prisma.class.count({ where: { deletedAt: null } }),
      prisma.exam.count({ where: { deletedAt: null } }),
      prisma.payment.count({ where: { deletedAt: null, status: "completed" } }),
      prisma.payment.aggregate({
        where: { deletedAt: null, status: "completed" },
        _sum: { amount: true },
      }),
    ])

    // Schools by status
    const schoolsByStatus = await prisma.school.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { id: true },
    })

    // Users by role
    const usersByRole = await prisma.user.groupBy({
      by: ["roleId"],
      where: { deletedAt: null },
      _count: { id: true },
    })

    // Get role names
    const roleIds = usersByRole.map((u) => u.roleId)
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, name: true, displayName: true },
    })

    const usersByRoleWithNames = usersByRole.map((u) => {
      const role = roles.find((r) => r.id === u.roleId)
      return {
        role: role?.displayName || role?.name || "Unknown",
        count: u._count.id,
      }
    })

    // Schools created in last 6 months (for chart)
    const schoolsCreated = await prisma.school.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    })

    // Group by month
    const schoolsByMonth: { [key: string]: number } = {}
    schoolsCreated.forEach((school) => {
      const month = new Date(school.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })
      schoolsByMonth[month] = (schoolsByMonth[month] || 0) + 1
    })

    // Users created in last 6 months
    const usersCreated = await prisma.user.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    })

    const usersByMonth: { [key: string]: number } = {}
    usersCreated.forEach((user) => {
      const month = new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })
      usersByMonth[month] = (usersByMonth[month] || 0) + 1
    })

    // Revenue by month (last 6 months)
    const paymentsByMonth = await prisma.payment.groupBy({
      by: ["paymentDate"],
      where: {
        deletedAt: null,
        status: "completed",
        paymentDate: { gte: sixMonthsAgo },
      },
      _sum: { amount: true },
    })

    const revenueByMonth: { [key: string]: number } = {}
    paymentsByMonth.forEach((payment) => {
      const month = new Date(payment.paymentDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })
      revenueByMonth[month] =
        (revenueByMonth[month] || 0) + Number(payment._sum.amount || 0)
    })

    // Recent schools (last 5)
    const recentSchools = await prisma.school.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            users: { where: { deletedAt: null } },
            students: { where: { deletedAt: null } },
          },
        },
      },
    })

    // Recent users (last 5)
    const recentUsers = await prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        role: { select: { name: true, displayName: true } },
        school: { select: { name: true } },
      },
    })

    // Students by status
    const studentsByStatus = await prisma.student.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { id: true },
    })

    // Staff by designation
    const staffByDesignation = await prisma.staff.groupBy({
      by: ["designation"],
      where: { deletedAt: null },
      _count: { id: true },
    })

    // Growth percentage (last month vs previous month)
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(now.getMonth() - 2)

    const [schoolsThisMonth, schoolsLastMonth] = await Promise.all([
      prisma.school.count({
        where: {
          deletedAt: null,
          createdAt: { gte: oneMonthAgo },
        },
      }),
      prisma.school.count({
        where: {
          deletedAt: null,
          createdAt: { gte: twoMonthsAgo, lt: oneMonthAgo },
        },
      }),
    ])

    const [usersThisMonth, usersLastMonth] = await Promise.all([
      prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: oneMonthAgo },
        },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: twoMonthsAgo, lt: oneMonthAgo },
        },
      }),
    ])

    const schoolGrowth =
      schoolsLastMonth > 0
        ? ((schoolsThisMonth - schoolsLastMonth) / schoolsLastMonth) * 100
        : schoolsThisMonth > 0
          ? 100
          : 0

    const userGrowth =
      usersLastMonth > 0
        ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100
        : usersThisMonth > 0
          ? 100
          : 0

    return NextResponse.json({
      overview: {
        totalSchools,
        activeSchools,
        totalUsers,
        activeUsers,
        totalStudents,
        totalStaff,
        totalClasses,
        totalExams,
        totalPayments,
        totalRevenue: Number(totalRevenue._sum.amount || 0),
      },
      growth: {
        schools: {
          thisMonth: schoolsThisMonth,
          lastMonth: schoolsLastMonth,
          percentage: Math.round(schoolGrowth * 100) / 100,
        },
        users: {
          thisMonth: usersThisMonth,
          lastMonth: usersLastMonth,
          percentage: Math.round(userGrowth * 100) / 100,
        },
      },
      distribution: {
        schoolsByStatus: schoolsByStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
        usersByRole: usersByRoleWithNames,
        studentsByStatus: studentsByStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
        staffByDesignation: staffByDesignation.map((s) => ({
          designation: s.designation,
          count: s._count.id,
        })),
      },
      trends: {
        schoolsByMonth: Object.entries(schoolsByMonth).map(([month, count]) => ({
          month,
          count,
        })),
        usersByMonth: Object.entries(usersByMonth).map(([month, count]) => ({
          month,
          count,
        })),
        revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({
          month,
          revenue: Number(revenue),
        })),
      },
      recent: {
        schools: recentSchools,
        users: recentUsers.map(({ password, ...user }) => user),
      },
    })
  } catch (error) {
    console.error("Super Admin Stats GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

