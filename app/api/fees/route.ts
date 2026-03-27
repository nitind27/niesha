import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest, parseQueryParams, buildOrderBy } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const feeSchema = z.object({
  name: z.string().min(1, "Fee name is required").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  amount: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === "string" ? parseFloat(val) : val
    return isNaN(num) || num < 0 ? 0 : num
  }),
  frequency: z.enum(["monthly", "quarterly", "yearly", "one_time"], {
    errorMap: () => ({ message: "Frequency must be monthly, quarterly, yearly, or one_time" }),
  }),
  classId: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional().default(true),
  dueDate: z.string().optional().or(z.literal("")),
})

function buildFeeWhereClause(schoolId: string, filters: ReturnType<typeof parseQueryParams>) {
  const where: any = {
    schoolId,
    deletedAt: null,
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  if (filters.classId) {
    where.classId = filters.classId
  }

  if (filters.status !== undefined) {
    if (filters.status === "active") {
      where.isActive = true
    } else if (filters.status === "inactive") {
      where.isActive = false
    }
  }

  if (filters.frequency) {
    where.frequency = filters.frequency
  }

  return where
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.FEE_READ)
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
    const where = buildFeeWhereClause(payload.schoolId, filters)
    const orderBy = buildOrderBy(filters.sortBy || "createdAt", filters.sortOrder || "desc")

    const [fees, total] = await Promise.all([
      prisma.fee.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          id: true,
          name: true,
          description: true,
          amount: true,
          frequency: true,
          classId: true,
          isActive: true,
          dueDate: true,
          createdAt: true,
          _count: {
            select: {
              payments: true,
            },
          },
        },
        orderBy,
      }),
      prisma.fee.count({ where }),
    ])

    // Fetch class data separately for fees that have classId
    const classIds = fees.filter(f => f.classId).map(f => f.classId)
    const classes = classIds.length > 0 
      ? await prisma.class.findMany({
          where: {
            id: { in: classIds as string[] },
            schoolId: payload.schoolId,
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
          },
        })
      : []

    // Map classes to fees
    const feesWithClasses = fees.map(fee => ({
      ...fee,
      class: fee.classId ? classes.find(c => c.id === fee.classId) || null : null,
    }))

    return NextResponse.json({
      fees: feesWithClasses,
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
    console.error("Fees GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.FEE_CREATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()
    
    const cleanedBody: any = { ...body }
    if (cleanedBody.description === "") cleanedBody.description = undefined
    if (cleanedBody.classId === "") cleanedBody.classId = undefined
    if (cleanedBody.dueDate === "") cleanedBody.dueDate = undefined
    
    const validationResult = feeSchema.safeParse(cleanedBody)
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

    // Validate class if provided
    if (data.classId) {
      const classExists = await prisma.class.findFirst({
        where: {
          id: data.classId,
          schoolId: payload.schoolId,
          deletedAt: null,
        },
      })

      if (!classExists) {
        return NextResponse.json(
          { error: "Class not found" },
          { status: 400 }
        )
      }
    }

    const fee = await prisma.fee.create({
      data: {
        schoolId: payload.schoolId,
        name: data.name,
        description: data.description,
        amount: data.amount,
        frequency: data.frequency,
        classId: data.classId || null,
        isActive: data.isActive ?? true,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    })

    // Fetch class data if classId exists
    let classData = null
    if (fee.classId) {
      classData = await prisma.class.findFirst({
        where: {
          id: fee.classId,
          schoolId: payload.schoolId,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
        },
      })
    }

    const feeWithClass = {
      ...fee,
      class: classData,
    }

    return NextResponse.json({ fee: feeWithClass }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Fees POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

