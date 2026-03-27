import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const updateFeeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().or(z.literal("")),
  amount: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const num = typeof val === "string" ? parseFloat(val) : val
    return isNaN(num) || num < 0 ? undefined : num
  }),
  frequency: z.enum(["monthly", "quarterly", "yearly", "one_time"]).optional(),
  classId: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  dueDate: z.string().optional().or(z.literal("")),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const fee = await prisma.fee.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
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
        updatedAt: true,
        _count: {
          select: {
            payments: true,
          },
        },
      },
    })

    if (!fee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 })
    }

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

    return NextResponse.json({ fee: feeWithClass })
  } catch (error) {
    console.error("Fee GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.FEE_UPDATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()
    
    const cleanedBody: any = { ...body }
    if (cleanedBody.description === "") cleanedBody.description = undefined
    if (cleanedBody.classId === "") cleanedBody.classId = undefined
    if (cleanedBody.dueDate === "") cleanedBody.dueDate = undefined
    
    const validationResult = updateFeeSchema.safeParse(cleanedBody)
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

    const existingFee = await prisma.fee.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!existingFee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 })
    }

    // Validate class if being changed
    if (data.classId !== undefined && data.classId !== existingFee.classId) {
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
    }

    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.frequency !== undefined) updateData.frequency = data.frequency
    if (data.classId !== undefined) updateData.classId = data.classId || null
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null

    const fee = await prisma.fee.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({ fee: feeWithClass })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Fee PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.FEE_DELETE)
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

    const existingFee = await prisma.fee.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            payments: true,
          },
        },
      },
    })

    if (!existingFee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 })
    }

    // Check if fee has payments
    if (existingFee._count.payments > 0) {
      return NextResponse.json(
        { error: "Cannot delete fee with existing payments. Please deactivate it instead." },
        { status: 400 }
      )
    }

    await prisma.fee.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: "Fee deleted successfully" })
  } catch (error) {
    console.error("Fee DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

