import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest } from "@/lib/api-utils"
import { isAssignablePermission, PERMISSIONS } from "@/lib/permissions"
import { z } from "zod"

const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role key at least 2 characters")
    .max(64)
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Use lowercase letters, numbers, underscores only; start with a letter"
    ),
  displayName: z.string().min(1).max(255),
  description: z.string().max(500).optional().nullable(),
  permissions: z.array(z.string()),
})

// GET /api/admin/roles - Get all roles
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SUPER_ADMIN_ALL)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    if (payload.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const roles = await prisma.role.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            users: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ roles })
  } catch (error) {
    console.error("Admin roles GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/roles - Create a custom role
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SUPER_ADMIN_ALL)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    if (payload.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = createRoleSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors.map((err) => ({
            path: err.path,
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    if (data.name === "super_admin") {
      return NextResponse.json({ error: "Reserved role key" }, { status: 400 })
    }

    for (const p of data.permissions) {
      if (!isAssignablePermission(p)) {
        return NextResponse.json(
          { error: `Invalid or non-assignable permission: ${p}` },
          { status: 400 }
        )
      }
    }

    const duplicate = await prisma.role.findFirst({
      where: { name: data.name, deletedAt: null },
    })
    if (duplicate) {
      return NextResponse.json({ error: "A role with this key already exists" }, { status: 409 })
    }

    const role = await prisma.role.create({
      data: {
        name: data.name.trim(),
        displayName: data.displayName.trim(),
        description: data.description && data.description.trim() !== "" ? data.description.trim() : null,
        permissions: data.permissions,
        isSystem: false,
      },
      include: {
        _count: {
          select: {
            users: { where: { deletedAt: null } },
          },
        },
      },
    })

    return NextResponse.json({ role }, { status: 201 })
  } catch (error) {
    console.error("Admin roles POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
