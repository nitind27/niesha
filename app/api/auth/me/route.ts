import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ROLE_PERMISSIONS, type Permission } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: true,
        school: {
          select: {
            id: true,
            name: true,
            organizationType: true,
            industry: true,
          },
        },
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Parse permissions from JSON, then merge with role defaults (so new modules work without DB re-seed)
    let permissions: string[] = []
    if (user.role.permissions) {
      if (Array.isArray(user.role.permissions)) {
        permissions = user.role.permissions.filter((p): p is string => typeof p === "string" && p !== null)
      } else if (typeof user.role.permissions === "string") {
        try {
          const parsed = JSON.parse(user.role.permissions)
          permissions = Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === "string" && p !== null) : []
        } catch {
          permissions = []
        }
      }
    }

    const roleDefaults = (ROLE_PERMISSIONS[user.role.name] ?? []) as Permission[]
    permissions = [...new Set([...roleDefaults.map(String), ...permissions])]

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        roleId: user.roleId,
        schoolId: user.schoolId,
        language: user.language,
        avatar: user.avatar,
        permissions,
        school: user.school
          ? {
              id: user.school.id,
              name: user.school.name,
              organizationType: user.school.organizationType,
              industry: user.school.industry,
            }
          : null,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

