import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload || !payload.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)

    const [totalStudents, totalStaff, totalClasses, totalRevenue, attendanceToday, pendingPayments] =
      await Promise.all([
        prisma.student.count({
          where: {
            schoolId: payload.schoolId,
            deletedAt: null,
          },
        }),
        prisma.staff.count({
          where: {
            schoolId: payload.schoolId,
            deletedAt: null,
          },
        }),
        prisma.class.count({
          where: {
            schoolId: payload.schoolId,
            deletedAt: null,
          },
        }),
        prisma.payment.aggregate({
          where: {
            schoolId: payload.schoolId,
            status: "completed",
            deletedAt: null,
          },
          _sum: {
            amount: true,
          },
        }),
        prisma.attendance.count({
          where: {
            schoolId: payload.schoolId,
            date: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
        }),
        prisma.payment.count({
          where: {
            schoolId: payload.schoolId,
            status: "pending",
            deletedAt: null,
          },
        }),
      ])

    return NextResponse.json({
      totalStudents,
      totalStaff,
      totalClasses,
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      attendanceToday,
      pendingPayments,
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

