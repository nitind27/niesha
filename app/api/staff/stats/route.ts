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

    const [total, active, onLeave, terminated, inactive] = await Promise.all([
      prisma.staff.count({
        where: {
          schoolId: payload.schoolId,
          deletedAt: null,
        },
      }),
      prisma.staff.count({
        where: {
          schoolId: payload.schoolId,
          status: "active",
          deletedAt: null,
        },
      }),
      prisma.staff.count({
        where: {
          schoolId: payload.schoolId,
          status: "on_leave",
          deletedAt: null,
        },
      }),
      prisma.staff.count({
        where: {
          schoolId: payload.schoolId,
          status: "terminated",
          deletedAt: null,
        },
      }),
      prisma.staff.count({
        where: {
          schoolId: payload.schoolId,
          status: "inactive",
          deletedAt: null,
        },
      }),
    ])

    return NextResponse.json({
      total,
      active,
      onLeave,
      terminated,
      inactive,
    })
  } catch (error) {
    console.error("Staff stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

