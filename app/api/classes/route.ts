import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest, parseQueryParams, buildOrderBy } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const classSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100),
  level: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const num = typeof val === "string" ? parseInt(val) : val
    return isNaN(num) ? undefined : num
  }),
  capacity: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === "string" ? parseInt(val) : val
    return isNaN(num) ? 40 : num
  }).default(40),
  classTeacherId: z.string().optional().or(z.literal("none")),
  status: z.enum(["active", "inactive"]).optional(),
})

// Build where clause for classes
function buildClassWhereClause(schoolId: string, filters: ReturnType<typeof parseQueryParams>) {
  const where: any = {
    schoolId,
    deletedAt: null,
  }

  // Search filter
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  // Status filter
  if (filters.status) {
    where.status = filters.status
  }

  return where
}

export async function GET(request: NextRequest) {
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
    
    const filters = parseQueryParams(request)
    const where = buildClassWhereClause(payload.schoolId, filters)
    const orderBy = buildOrderBy(filters.sortBy || "level", filters.sortOrder || "asc")

    // Optimized query with select only needed fields
    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
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
        orderBy,
      }),
      prisma.class.count({ where }),
    ])

    return NextResponse.json({
      classes,
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
    console.error("Classes GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.CLASS_CREATE)
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
    const validationResult = classSchema.safeParse(cleanedBody)
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

    // Check if class name already exists
    const existing = await prisma.class.findFirst({
      where: {
        schoolId: payload.schoolId,
        name: data.name,
        deletedAt: null,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Class "${data.name}" already exists. Please use a different class name.` },
        { status: 400 }
      )
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

    // Prepare final data for Prisma
    const finalData: any = {
      name: data.name,
      capacity: data.capacity,
      schoolId: payload.schoolId,
      status: data.status || "active",
    }

    if (data.level !== undefined) {
      finalData.level = data.level
    }
    if (data.classTeacherId) {
      finalData.classTeacherId = data.classTeacherId
    }

    const classData = await prisma.class.create({
      data: finalData,
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

    return NextResponse.json({ class: classData }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Classes POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

