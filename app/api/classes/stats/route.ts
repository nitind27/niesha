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

    const [total, active, inactive, totalStudents, totalSections] = await Promise.all([
      prisma.class.count({
        where: {
          schoolId: payload.schoolId,
          deletedAt: null,
        },
      }),
      prisma.class.count({
        where: {
          schoolId: payload.schoolId,
          status: "active",
          deletedAt: null,
        },
      }),
      prisma.class.count({
        where: {
          schoolId: payload.schoolId,
          status: "inactive",
          deletedAt: null,
        },
      }),
      prisma.student.count({
        where: {
          schoolId: payload.schoolId,
          deletedAt: null,
          classId: { not: null },
        },
      }),
      prisma.section.count({
        where: {
          class: {
            schoolId: payload.schoolId,
            deletedAt: null,
          },
          deletedAt: null,
        },
      }),
    ])

    return NextResponse.json({
      total,
      active,
      inactive,
      totalStudents,
      totalSections,
    })
  } catch (error) {
    console.error("Class stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

