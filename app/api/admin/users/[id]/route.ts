import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"
import { hashPassword } from "@/lib/auth"

const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(50).optional().nullable(),
  roleId: z.string().cuid("Invalid role ID").optional(),
  schoolId: z.string().cuid("Invalid school ID").optional().nullable(),
  isActive: z.boolean().optional(),
  language: z.string().optional(),
})

// GET /api/admin/users/[id] - Get user by ID
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

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
            permissions: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!user || user.deletedAt) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user

    return NextResponse.json({ user: userWithoutPassword })
  } catch (error) {
    console.error("Admin user GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/users/[id] - Update user
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
    const validationResult = updateUserSchema.safeParse(body)
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

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser || existingUser.deletedAt) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if email already exists (if email is being changed)
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: data.email,
          schoolId: data.schoolId !== undefined ? data.schoolId : existingUser.schoolId,
          deletedAt: null,
          NOT: { id: params.id },
        },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        )
      }
    }

    // Verify role exists if roleId is being updated
    if (data.roleId) {
      const role = await prisma.role.findUnique({
        where: { id: data.roleId },
      })

      if (!role) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 })
      }
    }

    // Verify school exists if schoolId is being updated
    if (data.schoolId !== undefined) {
      if (data.schoolId) {
        const school = await prisma.school.findUnique({
          where: { id: data.schoolId },
        })

        if (!school) {
          return NextResponse.json({ error: "Invalid school" }, { status: 400 })
        }
      }
    }

    // Prepare update data - trim strings and validate
    const updateData: any = {}
    if (data.email !== undefined) updateData.email = data.email.trim()
    if (data.firstName !== undefined) updateData.firstName = data.firstName.trim()
    if (data.lastName !== undefined) updateData.lastName = data.lastName.trim()
    if (data.phone !== undefined) {
      updateData.phone = data.phone && data.phone.trim() !== "" ? data.phone.trim() : null
    }
    if (data.roleId !== undefined) updateData.roleId = data.roleId.trim()
    if (data.schoolId !== undefined) {
      updateData.schoolId = data.schoolId || null
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.language !== undefined) updateData.language = data.language || "en"

    // Hash password if provided
    if (data.password) {
      updateData.password = await hashPassword(data.password)
    }
    
    // Don't set updatedAt manually - Prisma's @updatedAt handles it

    // Update user
    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    // Remove password from response
    const { password, ...userWithoutPassword } = user

    return NextResponse.json({ user: userWithoutPassword })
  } catch (error: any) {
    console.error("Admin user PUT error:", error)
    
    // Handle specific Prisma/MySQL errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }
    
    if (error.message?.includes("datetime") || error.message?.includes("updatedAt")) {
      return NextResponse.json(
        { 
          error: "Database error: Invalid date format. Please try again.",
          details: error.message 
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Delete user (soft delete)
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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user || user.deletedAt) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent deleting yourself
    if (user.id === payload.userId) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      )
    }

    // Soft delete
    await prisma.user.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Admin user DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

