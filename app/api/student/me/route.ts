import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

// GET /api/student/me — returns the logged-in student's own full profile
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SETTINGS_READ)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth

    if (!payload.schoolId) {
      return NextResponse.json({ error: "No school associated" }, { status: 403 })
    }

    const include = {
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      school: { select: { id: true, name: true } },
      attendance: {
        orderBy: { date: "desc" as const },
        take: 30,
        select: { id: true, date: true, status: true, remarks: true },
      },
      examResults: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" as const },
        include: {
          exam: { select: { id: true, name: true, type: true, startDate: true, endDate: true } },
          subject: { select: { id: true, name: true, code: true } },
        },
      },
      feePayments: {
        orderBy: { createdAt: "desc" as const },
        take: 20,
        select: {
          id: true,
          amount: true,
          status: true,
          paymentDate: true,
          paymentMethod: true,
          transactionId: true,
        },
      },
    }

    // 1. Try by userId first
    let student = await prisma.student.findFirst({
      where: { userId: payload.userId, schoolId: payload.schoolId, deletedAt: null },
      include,
    })

    // 2. Fall back to email match (for students created before userId linking)
    if (!student) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { email: true },
      })

      if (user?.email) {
        student = await prisma.student.findFirst({
          where: {
            email: { equals: user.email, mode: "insensitive" },
            schoolId: payload.schoolId,
            deletedAt: null,
          },
          include,
        })

        // Auto-link userId
        if (student && !student.userId) {
          await prisma.student.update({
            where: { id: student.id },
            data: { userId: payload.userId },
          }).catch(() => {})
        }
      }
    }

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error("[student/me] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
