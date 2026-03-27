import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest, parseQueryParams, buildOrderBy } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const paymentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  feeId: z.string().min(1, "Fee is required"),
  amount: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === "string" ? parseFloat(val) : val
    return isNaN(num) || num < 0 ? 0 : num
  }),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.enum(["cash", "card", "bank_transfer", "online"], {
    errorMap: () => ({ message: "Payment method must be cash, card, bank_transfer, or online" }),
  }),
  transactionId: z.string().max(100).optional().or(z.literal("")),
  status: z.enum(["pending", "completed", "failed", "refunded"]).optional().default("pending"),
  remarks: z.string().max(500).optional().or(z.literal("")),
})

function buildPaymentWhereClause(schoolId: string, filters: ReturnType<typeof parseQueryParams>) {
  const where: any = {
    schoolId,
    deletedAt: null,
    student: {
      deletedAt: null,
    },
    fee: {
      deletedAt: null,
    },
  }

  if (filters.search) {
    where.OR = [
      { student: { firstName: { contains: filters.search, mode: "insensitive" } } },
      { student: { lastName: { contains: filters.search, mode: "insensitive" } } },
      { student: { admissionNumber: { contains: filters.search, mode: "insensitive" } } },
      { fee: { name: { contains: filters.search, mode: "insensitive" } } },
      { transactionId: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  if (filters.studentId) {
    where.studentId = filters.studentId
  }

  if (filters.feeId) {
    where.feeId = filters.feeId
  }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.startDate || filters.endDate) {
    where.paymentDate = {}
    if (filters.startDate) {
      where.paymentDate.gte = new Date(filters.startDate)
    }
    if (filters.endDate) {
      where.paymentDate.lte = new Date(filters.endDate)
    }
  }

  return where
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.PAYMENT_READ)
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
    const where = buildPaymentWhereClause(payload.schoolId, filters)
    const orderBy = buildOrderBy(filters.sortBy || "paymentDate", filters.sortOrder || "desc")

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          id: true,
          amount: true,
          paymentDate: true,
          paymentMethod: true,
          transactionId: true,
          status: true,
          remarks: true,
          createdAt: true,
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
          fee: {
            select: {
              id: true,
              name: true,
              amount: true,
            },
          },
        },
        orderBy,
      }),
      prisma.payment.count({ where }),
    ])

    return NextResponse.json({
      payments,
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
    console.error("Payments GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.PAYMENT_CREATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()
    
    const cleanedBody: any = { ...body }
    if (cleanedBody.transactionId === "") cleanedBody.transactionId = undefined
    if (cleanedBody.remarks === "") cleanedBody.remarks = undefined
    
    const validationResult = paymentSchema.safeParse(cleanedBody)
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

    // Validate fee belongs to school
    const fee = await prisma.fee.findFirst({
      where: {
        id: data.feeId,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!fee) {
      return NextResponse.json(
        { error: "Fee not found" },
        { status: 400 }
      )
    }

    // Validate amount doesn't exceed fee amount (optional check)
    if (data.amount > Number(fee.amount)) {
      return NextResponse.json(
        { error: "Payment amount cannot exceed the fee amount" },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.create({
      data: {
        schoolId: payload.schoolId,
        studentId: data.studentId,
        feeId: data.feeId,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        status: data.status || "pending",
        remarks: data.remarks,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
        fee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Payments POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

