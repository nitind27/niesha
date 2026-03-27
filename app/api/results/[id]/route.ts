import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const updateResultSchema = z.object({
  examId: z.string().min(1).optional(),
  studentId: z.string().min(1).optional(),
  subjectId: z.string().min(1).optional(),
  marksObtained: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const num = typeof val === "string" ? parseFloat(val) : val
    return isNaN(num) ? undefined : num
  }),
  maxMarks: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const num = typeof val === "string" ? parseFloat(val) : val
    return isNaN(num) ? undefined : num
  }),
  grade: z.string().max(10).optional().or(z.literal("")),
  remarks: z.string().max(500).optional().or(z.literal("")),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.RESULT_READ)
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

    const result = await prisma.examResult.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
        exam: {
          schoolId: payload.schoolId,
          deletedAt: null,
        },
      },
      include: {
        exam: {
          select: {
            id: true,
            name: true,
            type: true,
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 })
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error("Result GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.RESULT_UPDATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()
    
    const cleanedBody: any = { ...body }
    if (cleanedBody.grade === "") cleanedBody.grade = undefined
    if (cleanedBody.remarks === "") cleanedBody.remarks = undefined
    
    const validationResult = updateResultSchema.safeParse(cleanedBody)
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

    const existingResult = await prisma.examResult.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
        exam: {
          schoolId: payload.schoolId,
          deletedAt: null,
        },
      },
    })

    if (!existingResult) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 })
    }

    // Validate exam if being changed
    if (data.examId && data.examId !== existingResult.examId) {
      const exam = await prisma.exam.findFirst({
        where: {
          id: data.examId,
          schoolId: payload.schoolId,
          deletedAt: null,
        },
      })

      if (!exam) {
        return NextResponse.json(
          { error: "Exam not found" },
          { status: 400 }
        )
      }
    }

    // Validate student if being changed
    if (data.studentId && data.studentId !== existingResult.studentId) {
      const student = await prisma.student.findFirst({
        where: {
          id: data.studentId,
          schoolId: payload.schoolId,
          deletedAt: null,
        },
      })

      if (!student) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 400 }
        )
      }
    }

    // Validate subject if being changed
    if (data.subjectId && data.subjectId !== existingResult.subjectId) {
      const subject = await prisma.subject.findFirst({
        where: {
          id: data.subjectId,
          schoolId: payload.schoolId,
          deletedAt: null,
        },
      })

      if (!subject) {
        return NextResponse.json(
          { error: "Subject not found" },
          { status: 400 }
        )
      }
    }

    // Check if new combination already exists
    const examId = data.examId || existingResult.examId
    const studentId = data.studentId || existingResult.studentId
    const subjectId = data.subjectId || existingResult.subjectId

    if (examId !== existingResult.examId || 
        studentId !== existingResult.studentId || 
        subjectId !== existingResult.subjectId) {
      const existing = await prisma.examResult.findFirst({
        where: {
          examId,
          studentId,
          subjectId,
          deletedAt: null,
          id: { not: params.id },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: "Result already exists for this exam, student, and subject combination." },
          { status: 400 }
        )
      }
    }

    // Validate marks
    const marksObtained = data.marksObtained !== undefined ? data.marksObtained : Number(existingResult.marksObtained)
    const maxMarks = data.maxMarks !== undefined ? data.maxMarks : Number(existingResult.maxMarks)

    if (marksObtained > maxMarks) {
      return NextResponse.json(
        { error: "Marks obtained cannot be greater than maximum marks" },
        { status: 400 }
      )
    }

    const updateData: any = {}
    
    if (data.examId !== undefined) updateData.examId = data.examId
    if (data.studentId !== undefined) updateData.studentId = data.studentId
    if (data.subjectId !== undefined) updateData.subjectId = data.subjectId
    if (data.marksObtained !== undefined) updateData.marksObtained = data.marksObtained
    if (data.maxMarks !== undefined) updateData.maxMarks = data.maxMarks
    if (data.grade !== undefined) updateData.grade = data.grade || null
    if (data.remarks !== undefined) updateData.remarks = data.remarks || null

    const result = await prisma.examResult.update({
      where: { id: params.id },
      data: updateData,
      include: {
        exam: {
          select: {
            id: true,
            name: true,
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Result PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.RESULT_DELETE)
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

    const existingResult = await prisma.examResult.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
        exam: {
          schoolId: payload.schoolId,
          deletedAt: null,
        },
      },
    })

    if (!existingResult) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 })
    }

    await prisma.examResult.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: "Result deleted successfully" })
  } catch (error) {
    console.error("Result DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

