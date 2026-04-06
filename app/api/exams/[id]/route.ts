import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const updateExamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["mid_term", "final", "quiz", "assignment"]).optional(),
  classId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]).optional(),
  description: z.string().max(500).optional().or(z.literal("")),
  duration: z.number().int().positive().optional().nullable(),
  passingMarks: z.number().int().positive().optional().nullable(),
  shuffleQuestions: z.boolean().optional(),
  showResults: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.EXAM_READ)
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

    const exam = await prisma.exam.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
      include: {
        class: true,
        _count: {
          select: {
            results: true,
          },
        },
      },
    })

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 })
    }

    return NextResponse.json({ exam })
  } catch (error) {
    console.error("Exam GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.EXAM_UPDATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()
    
    const cleanedBody: any = { ...body }
    if (cleanedBody.description === "") cleanedBody.description = undefined
    
    const validationResult = updateExamSchema.safeParse(cleanedBody)
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

    const existingExam = await prisma.exam.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!existingExam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 })
    }

    // Validate dates if provided
    const startDate = data.startDate ? new Date(data.startDate) : new Date(existingExam.startDate)
    const endDate = data.endDate ? new Date(data.endDate) : new Date(existingExam.endDate)
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      )
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
    if (data.type !== undefined) updateData.type = data.type
    if (data.classId !== undefined) updateData.classId = data.classId
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate)
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate)
    if (data.status !== undefined) updateData.status = data.status
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.duration !== undefined) updateData.duration = data.duration
    if (data.passingMarks !== undefined) updateData.passingMarks = data.passingMarks
    if (data.shuffleQuestions !== undefined) updateData.shuffleQuestions = data.shuffleQuestions
    if (data.showResults !== undefined) updateData.showResults = data.showResults

    const exam = await prisma.exam.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        type: true,
        startDate: true,
        endDate: true,
        status: true,
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ exam })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Exam PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.EXAM_DELETE)
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

    const existingExam = await prisma.exam.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!existingExam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 })
    }

    await prisma.exam.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: "Exam deleted successfully" })
  } catch (error) {
    console.error("Exam DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

