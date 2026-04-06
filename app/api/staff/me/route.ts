import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

// GET /api/staff/me — returns the logged-in staff member's own full profile
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
      school: { select: { id: true, name: true } },
      classes: { select: { id: true, name: true } },
      subjects: { select: { id: true, name: true, code: true } },
      attendance: {
        orderBy: { date: "desc" as const },
        take: 30,
        select: { id: true, date: true, status: true, checkIn: true, checkOut: true, remarks: true },
      },
    }

    // 1. Try by userId first (fast path for newly created staff)
    let staff = await prisma.staff.findFirst({
      where: { userId: payload.userId, schoolId: payload.schoolId, deletedAt: null },
      include,
    })

    // 2. Fall back to email match (for staff created before userId linking was added)
    if (!staff) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { email: true },
      })

      if (user?.email) {
        staff = await prisma.staff.findFirst({
          where: {
            email: { equals: user.email, mode: "insensitive" },
            schoolId: payload.schoolId,
            deletedAt: null,
          },
          include,
        })

        // Auto-link userId so future lookups are fast
        if (staff && !staff.userId) {
          await prisma.staff.update({
            where: { id: staff.id },
            data: { userId: payload.userId },
          }).catch(() => {}) // non-blocking, ignore unique constraint errors
        }
      }
    }

    if (!staff) {
      return NextResponse.json({ error: "Staff profile not found" }, { status: 404 })
    }

    return NextResponse.json({ staff })
  } catch (error) {
    console.error("[staff/me] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
