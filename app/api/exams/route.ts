import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest, parseQueryParams, buildOrderBy } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const examSchema = z.object({
  name: z.string().min(1, "Exam name is required").max(100),
  type: z.enum(["mid_term", "final", "quiz", "assignment"]),
  classId: z.string().min(1, "Class is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]).optional(),
  description: z.string().max(500).optional().or(z.literal("")),
})

function buildExamWhereClause(schoolId: string, filters: ReturnType<typeof parseQueryParams>) {
  const where: any = {
    schoolId,
    deletedAt: null,
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.classId) {
    where.classId = filters.classId
  }

  return where
}

export async function GET(request: NextRequest) {
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
    
    const filters = parseQueryParams(request)
    const where = buildExamWhereClause(payload.schoolId, filters)
    const orderBy = buildOrderBy(filters.sortBy || "startDate", filters.sortOrder || "desc")

    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          id: true,
          name: true,
          type: true,
          startDate: true,
          endDate: true,
          status: true,
          description: true,
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              results: true,
            },
          },
        },
        orderBy,
      }),
      prisma.exam.count({ where }),
    ])

    return NextResponse.json({
      exams,
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
    console.error("Exams GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.EXAM_CREATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()
    
    const cleanedBody: any = { ...body }
    if (cleanedBody.description === "") cleanedBody.description = undefined
    
    const validationResult = examSchema.safeParse(cleanedBody)
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

    // Validate dates
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      )
    }

    // Validate class
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

    const finalData: any = {
      name: data.name,
      type: data.type,
      classId: data.classId,
      startDate: startDate,
      endDate: endDate,
      schoolId: payload.schoolId,
      status: data.status || "scheduled",
    }

    if (data.description) finalData.description = data.description

    const exam = await prisma.exam.create({
      data: finalData,
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

    return NextResponse.json({ exam }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Exams POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

