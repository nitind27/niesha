import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const updateClassSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  level: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const num = typeof val === "string" ? parseInt(val) : val
    return isNaN(num) ? undefined : num
  }),
  capacity: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const num = typeof val === "string" ? parseInt(val) : val
    return isNaN(num) ? undefined : num
  }),
  classTeacherId: z.string().optional().or(z.literal("none")),
  status: z.enum(["active", "inactive"]).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.CLASS_READ)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth

    // Class operations require schoolId
    if (!payload.schoolId) {
      return NextResponse.json(
        { error: "School ID is required for class operations" },
        { status: 403 }
      )
    }

    const classData = await prisma.class.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
      include: {
        classTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        sections: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            capacity: true,
            status: true,
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
            sections: true,
            subjects: true,
            exams: true,
          },
        },
      },
    })

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    return NextResponse.json({ class: classData })
  } catch (error) {
    console.error("Class GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.CLASS_UPDATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth

    const body = await request.json()
    
    // Clean up body
    const cleanedBody: any = { ...body }
    
    // Convert empty strings to undefined for optional fields
    if (cleanedBody.classTeacherId === "" || cleanedBody.classTeacherId === "none") {
      cleanedBody.classTeacherId = undefined
    }
    
    // Validate input
    const validationResult = updateClassSchema.safeParse(cleanedBody)
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

    // Class operations require schoolId
    if (!payload.schoolId) {
      return NextResponse.json(
        { error: "School ID is required for class operations" },
        { status: 403 }
      )
    }

    // First verify the class belongs to the school
    const existingClass = await prisma.class.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Check if class name is being changed and if new one already exists
    if (data.name && data.name !== existingClass.name) {
      const existing = await prisma.class.findFirst({
        where: {
          schoolId: payload.schoolId,
          name: data.name,
          deletedAt: null,
          id: { not: params.id },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: `Class "${data.name}" already exists. Please use a different class name.` },
          { status: 400 }
        )
      }
    }

    // Validate class teacher if provided
    if (data.classTeacherId) {
      const teacher = await prisma.staff.findFirst({
        where: {
          id: data.classTeacherId,
          schoolId: payload.schoolId,
          deletedAt: null,
        },
      })

      if (!teacher) {
        return NextResponse.json(
          { error: "Selected class teacher not found" },
          { status: 400 }
        )
      }
    }

    // Clean up empty strings and prepare update data
    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.level !== undefined) updateData.level = data.level || null
    if (data.capacity !== undefined) updateData.capacity = data.capacity
    if (data.classTeacherId !== undefined) updateData.classTeacherId = data.classTeacherId || null
    if (data.status !== undefined) updateData.status = data.status

    const classData = await prisma.class.update({
      where: {
        id: params.id,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        level: true,
        capacity: true,
        status: true,
        classTeacherId: true,
        classTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            students: true,
            sections: true,
          },
        },
      },
    })

    return NextResponse.json({ class: classData })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Class PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.CLASS_DELETE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth

    // Class operations require schoolId
    if (!payload.schoolId) {
      return NextResponse.json(
        { error: "School ID is required for class operations" },
        { status: 403 }
      )
    }

    // First verify the class belongs to the school
    const existingClass = await prisma.class.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    await prisma.class.update({
      where: {
        id: params.id,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Class deleted successfully" })
  } catch (error) {
    console.error("Class DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

