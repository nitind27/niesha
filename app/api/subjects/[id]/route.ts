import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const updateSubjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().max(50).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  classId: z.string().optional().or(z.literal("none")),
  teacherId: z.string().optional().or(z.literal("none")),
  credits: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const num = typeof val === "string" ? parseInt(val) : val
    return isNaN(num) ? undefined : num
  }),
  status: z.enum(["active", "inactive"]).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SUBJECT_READ)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth

    if (!payload.schoolId) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 403 }
      )
    }

    const subject = await prisma.subject.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
      include: {
        class: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    return NextResponse.json({ subject })
  } catch (error) {
    console.error("Subject GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SUBJECT_UPDATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()
    
    const cleanedBody: any = { ...body }
    if (cleanedBody.code === "") cleanedBody.code = undefined
    if (cleanedBody.description === "") cleanedBody.description = undefined
    if (cleanedBody.classId === "" || cleanedBody.classId === "none") cleanedBody.classId = undefined
    if (cleanedBody.teacherId === "" || cleanedBody.teacherId === "none") cleanedBody.teacherId = undefined
    
    const validationResult = updateSubjectSchema.safeParse(cleanedBody)
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

    if (!payload.schoolId) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 403 }
      )
    }

    const existingSubject = await prisma.subject.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    // Check if code is being changed and if new one already exists
    if (data.code && data.code !== existingSubject.code) {
      const existing = await prisma.subject.findFirst({
        where: {
          schoolId: payload.schoolId,
          code: data.code,
          deletedAt: null,
          id: { not: params.id },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: `Subject code "${data.code}" already exists.` },
          { status: 400 }
        )
      }
    }

    // Validate teacher if provided
    if (data.teacherId) {
      const teacher = await prisma.staff.findFirst({
        where: {
          id: data.teacherId,
          schoolId: payload.schoolId,
          deletedAt: null,
        },
      })

      if (!teacher) {
        return NextResponse.json(
          { error: "Selected teacher not found" },
          { status: 400 }
        )
      }
    }

    // Validate class if provided
    if (data.classId) {
      const classData = await prisma.class.findFirst({
        where: {
          id: data.classId,
          schoolId: payload.schoolId,
          deletedAt: null,
        },
      })

      if (!classData) {
        return NextResponse.json(
          { error: "Selected class not found" },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.code !== undefined) updateData.code = data.code || null
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.classId !== undefined) updateData.classId = data.classId || null
    if (data.teacherId !== undefined) updateData.teacherId = data.teacherId || null
    if (data.credits !== undefined) updateData.credits = data.credits || null
    if (data.status !== undefined) updateData.status = data.status

    const subject = await prisma.subject.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        credits: true,
        status: true,
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json({ subject })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Subject PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SUBJECT_DELETE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth

    if (!payload.schoolId) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 403 }
      )
    }

    const existingSubject = await prisma.subject.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    await prisma.subject.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: "Subject deleted successfully" })
  } catch (error) {
    console.error("Subject DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

