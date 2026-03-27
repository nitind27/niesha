import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest } from "@/lib/api-utils"
import { isAssignablePermission, PERMISSIONS } from "@/lib/permissions"

const updateRoleSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  permissions: z.array(z.string()).optional(),
})

// GET /api/admin/roles/[id] - Get role by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SUPER_ADMIN_ALL)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    if (payload.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const role = await prisma.role.findUnique({
      where: { id: params.id },
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
    })

    if (!role || role.deletedAt) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    return NextResponse.json({ role })
  } catch (error) {
    console.error("Admin role GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/roles/[id] - Update role permissions
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Validate input
    const validationResult = updateRoleSchema.safeParse(body)
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

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: params.id },
    })

    if (!existingRole || existingRole.deletedAt) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    if (data.permissions !== undefined) {
      if (existingRole.name === "super_admin") {
        if (!data.permissions.includes(PERMISSIONS.SUPER_ADMIN_ALL)) {
          return NextResponse.json(
            { error: "Super admin role must include super_admin:all" },
            { status: 400 }
          )
        }
      } else {
        for (const p of data.permissions) {
          if (!isAssignablePermission(p)) {
            return NextResponse.json(
              { error: `Invalid or non-assignable permission: ${p}` },
              { status: 400 }
            )
          }
        }
      }
    }

    // Prevent modifying system roles (except permissions)
    if (existingRole.isSystem && data.displayName && data.displayName !== existingRole.displayName) {
      return NextResponse.json(
        { error: "Cannot modify system role display name" },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    if (data.displayName !== undefined) updateData.displayName = data.displayName
    if (data.description !== undefined) updateData.description = data.description
    if (data.permissions !== undefined) updateData.permissions = data.permissions

    // Update role
    const role = await prisma.role.update({
      where: { id: params.id },
      data: updateData,
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
    })

    return NextResponse.json({ role })
  } catch (error) {
    console.error("Admin role PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/roles/[id] - Soft-delete custom role only
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SUPER_ADMIN_ALL)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    if (payload.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const existingRole = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: { where: { deletedAt: null } },
          },
        },
      },
    })

    if (!existingRole || existingRole.deletedAt) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    if (existingRole.isSystem) {
      return NextResponse.json({ error: "Cannot delete system roles" }, { status: 400 })
    }

    if (existingRole._count.users > 0) {
      return NextResponse.json(
        { error: "Reassign or remove users with this role before deleting" },
        { status: 400 }
      )
    }

    await prisma.role.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Admin role DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
