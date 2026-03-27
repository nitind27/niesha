import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest, parseQueryParams, buildOrderBy } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").max(100),
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

function buildSubjectWhereClause(schoolId: string, filters: ReturnType<typeof parseQueryParams>) {
  const where: any = {
    schoolId,
    deletedAt: null,
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { code: { contains: filters.search, mode: "insensitive" } },
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
    
    const filters = parseQueryParams(request)
    const where = buildSubjectWhereClause(payload.schoolId, filters)
    const orderBy = buildOrderBy(filters.sortBy || "name", filters.sortOrder || "asc")

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          credits: true,
          status: true,
          classId: true,
          teacherId: true,
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
        orderBy,
      }),
      prisma.subject.count({ where }),
    ])

    return NextResponse.json({
      subjects,
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
    console.error("Subjects GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SUBJECT_CREATE)
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
    
    const validationResult = subjectSchema.safeParse(cleanedBody)
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

    // Check if subject code already exists (if provided)
    if (data.code) {
      const existing = await prisma.subject.findFirst({
        where: {
          schoolId: payload.schoolId,
          code: data.code,
          deletedAt: null,
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

    const finalData: any = {
      name: data.name,
      schoolId: payload.schoolId,
      status: data.status || "active",
    }

    if (data.code) finalData.code = data.code
    if (data.description) finalData.description = data.description
    if (data.classId) finalData.classId = data.classId
    if (data.teacherId) finalData.teacherId = data.teacherId
    if (data.credits !== undefined) finalData.credits = data.credits

    const subject = await prisma.subject.create({
      data: finalData,
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

    return NextResponse.json({ subject }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Subjects POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

