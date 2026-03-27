import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const updatePlanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
  tagline: z.string().max(500).optional().nullable(),
  description: z.string().optional().nullable(),
  monthlyPrice: z.number().min(0).optional(),
  yearlyPrice: z.number().min(0).optional(),
  originalMonthlyPrice: z.number().min(0).optional().nullable(),
  originalYearlyPrice: z.number().min(0).optional().nullable(),
  discount: z.number().min(0).max(100).optional(),
  isPopular: z.boolean().optional(),
  badge: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
  maxSchools: z.number().int().positive().optional().nullable(),
  maxStudents: z.number().int().positive().optional().nullable(),
  maxStaff: z.number().int().positive().optional().nullable(),
  storageGB: z.number().int().positive().optional().nullable(),
  modules: z.array(z.string()).optional(),
  features: z.array(z.string()).optional().nullable(),
  supportLevel: z.string().optional(),
})

// GET /api/admin/plans/[id] - Get plan by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SUPER_ADMIN_ALL)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    if (payload.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
    })

    if (!plan || plan.deletedAt) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    const schoolCount = await prisma.school.count({
      where: {
        subscriptionPlan: plan.slug,
        deletedAt: null,
      },
    })

    const planWithCount = {
      ...plan,
      _count: {
        schools: schoolCount,
      },
    }

    // Parse JSON fields
    const parsedPlan = {
      ...planWithCount,
      modules: Array.isArray(planWithCount.modules) ? planWithCount.modules : JSON.parse(planWithCount.modules as string || '[]'),
      features: planWithCount.features
        ? (Array.isArray(planWithCount.features) ? planWithCount.features : JSON.parse(planWithCount.features as string || '[]'))
        : null,
      monthlyPrice: Number(planWithCount.monthlyPrice),
      yearlyPrice: Number(planWithCount.yearlyPrice),
      originalMonthlyPrice: planWithCount.originalMonthlyPrice ? Number(planWithCount.originalMonthlyPrice) : null,
      originalYearlyPrice: planWithCount.originalYearlyPrice ? Number(planWithCount.originalYearlyPrice) : null,
    }

    return NextResponse.json({ plan: parsedPlan })
  } catch (error) {
    console.error("Admin plan GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/plans/[id] - Update plan
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SUPER_ADMIN_ALL)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    if (payload.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = updatePlanSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors.map((err) => ({
            path: err.path,
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if plan exists
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
    })

    if (!existingPlan || existingPlan.deletedAt) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Check if slug is being changed and if it already exists
    if (data.slug && data.slug !== existingPlan.slug) {
      const slugExists = await prisma.subscriptionPlan.findUnique({
        where: { slug: data.slug },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: "Plan with this slug already exists" },
          { status: 409 }
        )
      }
    }

    // If marking as popular, unmark others
    if (data.isPopular === true) {
      await prisma.subscriptionPlan.updateMany({
        where: {
          isPopular: true,
          deletedAt: null,
          NOT: { id: params.id },
        },
        data: {
          isPopular: false,
        },
      })
    }

    // Prepare update data
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.tagline !== undefined) updateData.tagline = data.tagline
    if (data.description !== undefined) updateData.description = data.description
    if (data.monthlyPrice !== undefined) updateData.monthlyPrice = data.monthlyPrice
    if (data.yearlyPrice !== undefined) updateData.yearlyPrice = data.yearlyPrice
    if (data.originalMonthlyPrice !== undefined) updateData.originalMonthlyPrice = data.originalMonthlyPrice
    if (data.originalYearlyPrice !== undefined) updateData.originalYearlyPrice = data.originalYearlyPrice
    if (data.discount !== undefined) updateData.discount = data.discount
    if (data.isPopular !== undefined) updateData.isPopular = data.isPopular
    if (data.badge !== undefined) updateData.badge = data.badge
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
    if (data.maxSchools !== undefined) updateData.maxSchools = data.maxSchools
    if (data.maxStudents !== undefined) updateData.maxStudents = data.maxStudents
    if (data.maxStaff !== undefined) updateData.maxStaff = data.maxStaff
    if (data.storageGB !== undefined) updateData.storageGB = data.storageGB
    if (data.modules !== undefined) updateData.modules = data.modules
    if (data.features !== undefined) updateData.features = data.features
    if (data.supportLevel !== undefined) updateData.supportLevel = data.supportLevel

    // Update plan
    const plan = await prisma.subscriptionPlan.update({
      where: { id: params.id },
      data: updateData,
    })

    // Parse JSON for response
    const parsedPlan = {
      ...plan,
      modules: Array.isArray(plan.modules) ? plan.modules : JSON.parse(plan.modules as string || '[]'),
      features: plan.features
        ? (Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as string || '[]'))
        : null,
      monthlyPrice: Number(plan.monthlyPrice),
      yearlyPrice: Number(plan.yearlyPrice),
      originalMonthlyPrice: plan.originalMonthlyPrice ? Number(plan.originalMonthlyPrice) : null,
      originalYearlyPrice: plan.originalYearlyPrice ? Number(plan.originalYearlyPrice) : null,
    }

    return NextResponse.json({ plan: parsedPlan })
  } catch (error) {
    console.error("Admin plan PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/plans/[id] - Delete plan (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SUPER_ADMIN_ALL)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    if (payload.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if plan exists
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: params.id },
    })

    if (!plan || plan.deletedAt) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Check if plan is in use
    const schoolCount = await prisma.school.count({
      where: {
        subscriptionPlan: plan.slug,
        deletedAt: null,
      },
    })

    if (schoolCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete plan that is assigned to schools. Deactivate it instead." },
        { status: 400 }
      )
    }

    // Soft delete
    await prisma.subscriptionPlan.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: "Plan deleted successfully" })
  } catch (error) {
    console.error("Admin plan DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

