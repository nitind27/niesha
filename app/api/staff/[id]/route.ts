import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const updateStaffSchema = z.object({
  employeeId: z.string().min(1).max(50).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  dateOfBirth: z.string().refine((date) => {
    if (!date) return true
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) && parsed < new Date()
  }, "Invalid date or date must be in the past").optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  phone: z.string().min(1).max(20).optional(),
  email: z.string().email("Invalid email").optional(),
  address: z.string().max(500).optional(),
  designation: z.string().min(1).max(100).optional(),
  department: z.string().max(100).optional(),
  joiningDate: z.string().refine((date) => {
    if (!date) return true
    const parsed = new Date(date)
    return !isNaN(parsed.getTime())
  }, "Invalid joining date").optional(),
  salary: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const num = typeof val === "string" ? parseFloat(val) : val
    return isNaN(num) ? undefined : num
  }),
  status: z.enum(["active", "on_leave", "terminated", "inactive"]).optional(),
  experience: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const num = typeof val === "string" ? parseInt(val) : val
    return isNaN(num) ? undefined : num
  }),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.STAFF_READ)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth

    // Staff operations require schoolId
    if (!payload.schoolId) {
      return NextResponse.json(
        { error: "School ID is required for staff operations" },
        { status: 403 }
      )
    }

    const staff = await prisma.staff.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 })
    }

    return NextResponse.json({ staff })
  } catch (error) {
    console.error("Staff GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.STAFF_UPDATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth

    const body = await request.json()
    
    // Clean up body - remove empty strings and convert to null/undefined
    const cleanedBody: any = { ...body }
    
    // Convert empty strings to undefined for optional fields
    const optionalFields = ["dateOfBirth", "gender", "address", "department", "salary", "experience", "phone", "email"]
    optionalFields.forEach(field => {
      if (cleanedBody[field] === "" || cleanedBody[field] === undefined) {
        cleanedBody[field] = undefined
      }
    })
    
    // Validate input
    const validationResult = updateStaffSchema.safeParse(cleanedBody)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.errors.map(err => ({
            path: err.path,
            message: err.message,
            code: err.code
          }))
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Staff operations require schoolId
    if (!payload.schoolId) {
      return NextResponse.json(
        { error: "School ID is required for staff operations" },
        { status: 403 }
      )
    }

    // First verify the staff belongs to the school
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!existingStaff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 })
    }

    // Check if employee ID is being changed and if new one already exists
    if (data.employeeId && data.employeeId !== existingStaff.employeeId) {
      const existing = await prisma.staff.findFirst({
        where: {
          schoolId: payload.schoolId,
          employeeId: data.employeeId,
          deletedAt: null,
          id: { not: params.id },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: `Employee ID "${data.employeeId}" already exists. Please use a different employee ID.` },
          { status: 400 }
        )
      }
    }

    // Check if email is being changed and if new one already exists
    if (data.email && data.email !== existingStaff.email) {
      const existing = await prisma.staff.findFirst({
        where: {
          schoolId: payload.schoolId,
          email: data.email,
          deletedAt: null,
          id: { not: params.id },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: `Email "${data.email}" already exists. Please use a different email.` },
          { status: 400 }
        )
      }
    }

    // Clean up empty strings and prepare update data
    const updateData: any = {}
    
    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId
    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null
    if (data.gender !== undefined) updateData.gender = data.gender || null
    if (data.phone !== undefined) updateData.phone = data.phone && data.phone.trim() !== "" ? data.phone.trim() : null
    if (data.email !== undefined) updateData.email = data.email && data.email.trim() !== "" ? data.email.trim() : null
    if (data.address !== undefined) updateData.address = data.address || null
    if (data.designation !== undefined) updateData.designation = data.designation
    if (data.department !== undefined) updateData.department = data.department || null
    if (data.joiningDate !== undefined) updateData.joiningDate = data.joiningDate ? new Date(data.joiningDate) : null
    if (data.salary !== undefined) updateData.salary = data.salary || null
    if (data.status !== undefined) updateData.status = data.status
    if (data.experience !== undefined) updateData.experience = data.experience || null

    const staff = await prisma.staff.update({
      where: {
        id: params.id,
      },
      data: updateData,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        phone: true,
        email: true,
        designation: true,
        department: true,
        joiningDate: true,
        salary: true,
        status: true,
        experience: true,
      },
    })

    return NextResponse.json({ staff })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Staff PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.STAFF_DELETE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth

    // Staff operations require schoolId
    if (!payload.schoolId) {
      return NextResponse.json(
        { error: "School ID is required for staff operations" },
        { status: 403 }
      )
    }

    // First verify the staff belongs to the school
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!existingStaff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 })
    }

    await prisma.staff.update({
      where: {
        id: params.id,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Staff deleted successfully" })
  } catch (error) {
    console.error("Staff DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

