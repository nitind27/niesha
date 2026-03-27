import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.REPORT_READ)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    
    if (!payload.schoolId) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 403 }
      )
    }

    const schoolId = payload.schoolId

    // Get date range (last 6 months for trends)
    const now = new Date()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(now.getMonth() - 6)

    // Overall Statistics
    const [
      totalStudents,
      totalStaff,
      totalClasses,
      totalSubjects,
      totalExams,
      totalFees,
      totalBooks,
      totalRoutes,
    ] = await Promise.all([
      prisma.student.count({
        where: { schoolId, deletedAt: null },
      }),
      prisma.staff.count({
        where: { schoolId, deletedAt: null },
      }),
      prisma.class.count({
        where: { schoolId, deletedAt: null },
      }),
      prisma.subject.count({
        where: { schoolId, deletedAt: null },
      }),
      prisma.exam.count({
        where: { schoolId, deletedAt: null },
      }),
      prisma.fee.count({
        where: { schoolId, deletedAt: null },
      }),
      prisma.libraryBook.count({
        where: { schoolId, deletedAt: null },
      }),
      prisma.transportRoute.count({
        where: { schoolId, deletedAt: null },
      }),
    ])

    // Student Statistics
    const [activeStudents, graduatedStudents, transferredStudents] = await Promise.all([
      prisma.student.count({
        where: { schoolId, status: "active", deletedAt: null },
      }),
      prisma.student.count({
        where: { schoolId, status: "graduated", deletedAt: null },
      }),
      prisma.student.count({
        where: { schoolId, status: "transferred", deletedAt: null },
      }),
    ])

    // Attendance Statistics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const [todayAttendance, totalAttendance] = await Promise.all([
      prisma.attendance.count({
        where: {
          schoolId,
          date: today,
        },
      }),
      prisma.attendance.count({
        where: {
          schoolId,
          date: { gte: sixMonthsAgo },
        },
      }),
    ])

    const attendanceByStatus = await prisma.attendance.groupBy({
      by: ["status"],
      where: {
        schoolId,
        date: { gte: sixMonthsAgo },
      },
      _count: true,
    })

    // Payment Statistics
    const [totalRevenue, pendingPayments, completedPayments] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          schoolId,
          status: "completed",
          deletedAt: null,
        },
        _sum: { amount: true },
      }),
      prisma.payment.count({
        where: {
          schoolId,
          status: "pending",
          deletedAt: null,
        },
      }),
      prisma.payment.count({
        where: {
          schoolId,
          status: "completed",
          deletedAt: null,
        },
      }),
    ])

    // Monthly Revenue (last 6 months)
    const monthlyRevenue = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const revenue = await prisma.payment.aggregate({
        where: {
          schoolId,
          status: "completed",
          paymentDate: {
            gte: monthStart,
            lte: monthEnd,
          },
          deletedAt: null,
        },
        _sum: { amount: true },
      })

      monthlyRevenue.push({
        month: monthStart.toLocaleString("default", { month: "short" }),
        revenue: Number(revenue._sum.amount || 0),
      })
    }

    // Student Distribution by Class
    const studentsByClass = await prisma.student.groupBy({
      by: ["classId"],
      where: {
        schoolId,
        deletedAt: null,
        classId: { not: null },
      },
      _count: true,
    })

    const classNames = await prisma.class.findMany({
      where: {
        id: { in: studentsByClass.map((s) => s.classId!).filter(Boolean) },
        schoolId,
        deletedAt: null,
      },
      select: { id: true, name: true },
    })

    const studentDistribution = studentsByClass.map((s) => ({
      name: classNames.find((c) => c.id === s.classId)?.name || "Unknown",
      students: s._count,
    }))

    // Attendance Trend (last 6 months)
    const attendanceTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const count = await prisma.attendance.count({
        where: {
          schoolId,
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      })

      attendanceTrend.push({
        month: monthStart.toLocaleString("default", { month: "short" }),
        attendance: count,
      })
    }

    // Exam Results Statistics
    const [totalResults, avgMarks] = await Promise.all([
      prisma.examResult.count({
        where: {
          exam: {
            schoolId,
            deletedAt: null,
          },
          deletedAt: null,
        },
      }),
      prisma.examResult.aggregate({
        where: {
          exam: {
            schoolId,
            deletedAt: null,
          },
          deletedAt: null,
        },
        _avg: {
          marksObtained: true,
        },
      }),
    ])

    // Fee Collection Statistics
    const feeStats = await prisma.fee.findMany({
      where: {
        schoolId,
        deletedAt: null,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            payments: true,
          },
        },
      },
    })

    const totalFeeAmount = feeStats.reduce((sum, fee) => sum + Number(fee.amount), 0)
    const totalFeePayments = feeStats.reduce((sum, fee) => sum + fee._count.payments, 0)

    // Library Statistics
    const [totalIssuedBooks, availableBooks] = await Promise.all([
      prisma.bookIssue.count({
        where: {
          book: {
            schoolId,
            deletedAt: null,
          },
          status: { in: ["issued", "overdue"] },
        },
      }),
      prisma.libraryBook.aggregate({
        where: {
          schoolId,
          deletedAt: null,
        },
        _sum: {
          availableCopies: true,
        },
      }),
    ])

    return NextResponse.json({
      overview: {
        totalStudents,
        totalStaff,
        totalClasses,
        totalSubjects,
        totalExams,
        totalFees,
        totalBooks,
        totalRoutes,
      },
      students: {
        total: totalStudents,
        active: activeStudents,
        graduated: graduatedStudents,
        transferred: transferredStudents,
        distribution: studentDistribution,
      },
      attendance: {
        today: todayAttendance,
        total: totalAttendance,
        byStatus: attendanceByStatus.map((a) => ({
          status: a.status,
          count: a._count,
        })),
        trend: attendanceTrend,
      },
      payments: {
        totalRevenue: Number(totalRevenue._sum.amount || 0),
        pending: pendingPayments,
        completed: completedPayments,
        monthlyRevenue,
      },
      exams: {
        totalResults,
        averageMarks: Number(avgMarks._avg.marksObtained || 0),
      },
      fees: {
        totalAmount: totalFeeAmount,
        totalPayments: totalFeePayments,
        collectionRate: totalFeePayments > 0 ? (totalFeePayments / totalStudents) * 100 : 0,
      },
      library: {
        totalBooks,
        availableBooks: Number(availableBooks._sum.availableCopies || 0),
        issuedBooks: totalIssuedBooks,
      },
    })
  } catch (error) {
    console.error("Reports Stats GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

