import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.STUDENT_READ)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth

    // Student operations require schoolId
    if (!payload.schoolId) {
      return NextResponse.json(
        { error: "School ID is required for student operations" },
        { status: 403 }
      )
    }

    const [total, active, inactive, graduated, transferred] = await Promise.all([
      prisma.student.count({
        where: {
          schoolId: payload.schoolId,
          deletedAt: null,
        },
      }),
      prisma.student.count({
        where: {
          schoolId: payload.schoolId,
          status: "active",
          deletedAt: null,
        },
      }),
      prisma.student.count({
        where: {
          schoolId: payload.schoolId,
          status: "inactive",
          deletedAt: null,
        },
      }),
      prisma.student.count({
        where: {
          schoolId: payload.schoolId,
          status: "graduated",
          deletedAt: null,
        },
      }),
      prisma.student.count({
        where: {
          schoolId: payload.schoolId,
          status: "transferred",
          deletedAt: null,
        },
      }),
    ])

    return NextResponse.json({
      total,
      active,
      inactive,
      graduated,
      transferred,
    })
  } catch (error) {
    console.error("Student stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

