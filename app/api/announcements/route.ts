import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest, parseQueryParams, buildOrderBy } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["general", "academic", "event", "emergency"], {
    errorMap: () => ({ message: "Type must be general, academic, event, or emergency" }),
  }),
  targetAudience: z.union([z.array(z.string()), z.string()]).optional().transform((val) => {
    if (!val || val === "" || val === "all") return ["all"]
    if (Array.isArray(val)) return val
    return [val]
  }),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional().default("normal"),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  isPublished: z.boolean().optional().default(false),
})

function buildAnnouncementWhereClause(schoolId: string, filters: ReturnType<typeof parseQueryParams>) {
  const where: any = {
    schoolId,
    deletedAt: null,
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { content: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  if (filters.type) {
    where.type = filters.type
  }

  if (filters.status !== undefined) {
    if (filters.status === "published") {
      where.isPublished = true
    } else if (filters.status === "draft") {
      where.isPublished = false
    }
  }

  if (filters.priority) {
    where.priority = filters.priority
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate)
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate)
    }
  }

  return where
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.ANNOUNCEMENT_READ)
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
    const where = buildAnnouncementWhereClause(payload.schoolId, filters)
    const orderBy = buildOrderBy(filters.sortBy || "createdAt", filters.sortOrder || "desc")

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          targetAudience: true,
          priority: true,
          startDate: true,
          endDate: true,
          isPublished: true,
          createdAt: true,
          createdBy: true,
        },
        orderBy,
      }),
      prisma.announcement.count({ where }),
    ])

    return NextResponse.json({
      announcements,
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
    console.error("Announcements GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.ANNOUNCEMENT_CREATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()
    
    const cleanedBody: any = { ...body }
    if (cleanedBody.startDate === "") cleanedBody.startDate = undefined
    if (cleanedBody.endDate === "") cleanedBody.endDate = undefined
    
    const validationResult = announcementSchema.safeParse(cleanedBody)
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
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      if (start > end) {
        return NextResponse.json(
          { error: "Start date cannot be after end date" },
          { status: 400 }
        )
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        schoolId: payload.schoolId,
        title: data.title,
        content: data.content,
        type: data.type,
        targetAudience: data.targetAudience,
        priority: data.priority || "normal",
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isPublished: data.isPublished ?? false,
        createdBy: payload.userId || null,
      },
    })

    return NextResponse.json({ announcement }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Announcements POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

