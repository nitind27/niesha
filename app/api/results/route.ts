import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest, parseQueryParams, buildOrderBy } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const resultSchema = z.object({
  examId: z.string().min(1, "Exam is required"),
  studentId: z.string().min(1, "Student is required"),
  subjectId: z.string().min(1, "Subject is required"),
  marksObtained: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === "string" ? parseFloat(val) : val
    return isNaN(num) ? 0 : num
  }),
  maxMarks: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === "string" ? parseFloat(val) : val
    return isNaN(num) ? 100 : num
  }),
  grade: z.string().max(10).optional().or(z.literal("")),
  remarks: z.string().max(500).optional().or(z.literal("")),
})

function buildResultWhereClause(schoolId: string, filters: ReturnType<typeof parseQueryParams>) {
  const where: any = {
    deletedAt: null,
    exam: {
      schoolId,
      deletedAt: null,
    },
  }

  if (filters.search) {
    where.OR = [
      { student: { firstName: { contains: filters.search, mode: "insensitive" } } },
      { student: { lastName: { contains: filters.search, mode: "insensitive" } } },
    ]
  }

  if (filters.examId) {
    where.examId = filters.examId
  }

  if (filters.studentId) {
    where.studentId = filters.studentId
  }

  if (filters.subjectId) {
    where.subjectId = filters.subjectId
  }

  return where
}

export async function GET(request: NextRequest) {
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
    
    const filters = parseQueryParams(request)
    const where = buildResultWhereClause(payload.schoolId, filters)
    const orderBy = buildOrderBy(filters.sortBy || "createdAt", filters.sortOrder || "desc")

    const [results, total] = await Promise.all([
      prisma.examResult.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          id: true,
          marksObtained: true,
          maxMarks: true,
          grade: true,
          remarks: true,
          exam: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNumber: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy,
      }),
      prisma.examResult.count({ where }),
    ])

    return NextResponse.json({
      results,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
        hasNextPage: filters.page < Math.ceil(total / filters.limit),
        hasPrevPage: filters.page > 1,
      },
    })
  } catch (error) {
    console.error("Results GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.RESULT_CREATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()
    
    const cleanedBody: any = { ...body }
    if (cleanedBody.grade === "") cleanedBody.grade = undefined
    if (cleanedBody.remarks === "") cleanedBody.remarks = undefined
    
    const validationResult = resultSchema.safeParse(cleanedBody)
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

    // Validate exam belongs to school
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

    // Validate student belongs to school
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

    // Validate subject belongs to school
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

    // Check if result already exists
    const existing = await prisma.examResult.findFirst({
      where: {
        examId: data.examId,
        studentId: data.studentId,
        subjectId: data.subjectId,
        deletedAt: null,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Result already exists for this exam, student, and subject combination." },
        { status: 400 }
      )
    }

    // Validate marks
    if (data.marksObtained > data.maxMarks) {
      return NextResponse.json(
        { error: "Marks obtained cannot be greater than maximum marks" },
        { status: 400 }
      )
    }

    const finalData: any = {
      examId: data.examId,
      studentId: data.studentId,
      subjectId: data.subjectId,
      marksObtained: data.marksObtained,
      maxMarks: data.maxMarks,
    }

    if (data.grade) finalData.grade = data.grade
    if (data.remarks) finalData.remarks = data.remarks

    const result = await prisma.examResult.create({
      data: finalData,
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

    return NextResponse.json({ result }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Results POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

