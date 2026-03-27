import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const updatePaymentSchema = z.object({
  studentId: z.string().min(1).optional(),
  feeId: z.string().min(1).optional(),
  amount: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const num = typeof val === "string" ? parseFloat(val) : val
    return isNaN(num) || num < 0 ? undefined : num
  }),
  paymentDate: z.string().optional(),
  paymentMethod: z.enum(["cash", "card", "bank_transfer", "online"]).optional(),
  transactionId: z.string().max(100).optional().or(z.literal("")),
  status: z.enum(["pending", "completed", "failed", "refunded"]).optional(),
  remarks: z.string().max(500).optional().or(z.literal("")),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const payment = await prisma.payment.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
      include: {
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
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error("Payment GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.PAYMENT_UPDATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()
    
    const cleanedBody: any = { ...body }
    if (cleanedBody.transactionId === "") cleanedBody.transactionId = undefined
    if (cleanedBody.remarks === "") cleanedBody.remarks = undefined
    
    const validationResult = updatePaymentSchema.safeParse(cleanedBody)
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

    const existingPayment = await prisma.payment.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
      include: {
        fee: true,
      },
    })

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Validate student if being changed
    if (data.studentId && data.studentId !== existingPayment.studentId) {
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

    // Validate fee if being changed
    const feeId = data.feeId || existingPayment.feeId
    if (data.feeId && data.feeId !== existingPayment.feeId) {
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
    }

    // Validate amount doesn't exceed fee amount
    const fee = await prisma.fee.findFirst({
      where: {
        id: feeId,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (fee) {
      const amount = data.amount !== undefined ? data.amount : Number(existingPayment.amount)
      if (amount > Number(fee.amount)) {
        return NextResponse.json(
          { error: "Payment amount cannot exceed the fee amount" },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    
    if (data.studentId !== undefined) updateData.studentId = data.studentId
    if (data.feeId !== undefined) updateData.feeId = data.feeId
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.paymentDate !== undefined) updateData.paymentDate = new Date(data.paymentDate)
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod
    if (data.transactionId !== undefined) updateData.transactionId = data.transactionId || null
    if (data.status !== undefined) updateData.status = data.status
    if (data.remarks !== undefined) updateData.remarks = data.remarks || null

    const payment = await prisma.payment.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({ payment })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Payment PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.PAYMENT_UPDATE)
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

    const existingPayment = await prisma.payment.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    await prisma.payment.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: "Payment deleted successfully" })
  } catch (error) {
    console.error("Payment DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

