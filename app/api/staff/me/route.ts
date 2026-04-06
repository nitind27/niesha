import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

// GET /api/staff/me — returns the logged-in staff member's own full profile
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.STAFF_READ)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth

    if (!payload.schoolId) {
      return NextResponse.json({ error: "No school associated" }, { status: 403 })
    }

    const staff = await prisma.staff.findFirst({
      where: { userId: payload.userId, schoolId: payload.schoolId, deletedAt: null },
      include: {
        school: { select: { id: true, name: true } },
        classes: { select: { id: true, name: true } },
        subjects: { select: { id: true, name: true, code: true } },
        attendance: {
          orderBy: { date: "desc" },
          take: 30,
          select: { id: true, date: true, status: true, checkIn: true, checkOut: true, remarks: true },
        },
      },
    })

    if (!staff) {
      return NextResponse.json({ error: "Staff profile not found" }, { status: 404 })
    }

    return NextResponse.json({ staff })
  } catch (error) {
    console.error("[staff/me] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
