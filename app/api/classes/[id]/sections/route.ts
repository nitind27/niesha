import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.CLASS_READ)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const sections = await prisma.section.findMany({
      where: {
        classId: params.id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        capacity: true,
        status: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error("Sections GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

