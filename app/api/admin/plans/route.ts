import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest, parseQueryParams } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const planSchema = z.object({
  name: z.string().min(1, "Plan name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255).regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  tagline: z.string().max(500).optional().nullable(),
  description: z.string().optional().nullable(),
  monthlyPrice: z.number().min(0, "Monthly price must be positive"),
  yearlyPrice: z.number().min(0, "Yearly price must be positive"),
  originalMonthlyPrice: z.number().min(0).optional().nullable(),
  originalYearlyPrice: z.number().min(0).optional().nullable(),
  discount: z.number().min(0).max(100).default(0),
  isPopular: z.boolean().default(false),
  badge: z.string().max(100).optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  maxSchools: z.number().int().positive().optional().nullable(),
  maxStudents: z.number().int().positive().optional().nullable(),
  maxStaff: z.number().int().positive().optional().nullable(),
  storageGB: z.number().int().positive().optional().nullable(),
  modules: z.array(z.string()),
  features: z.array(z.string()).optional().nullable(),
  supportLevel: z.string().default("email"),
})

// GET /api/admin/plans - List all plans
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SUPER_ADMIN_ALL)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    if (payload.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const params = parseQueryParams(request)
    const { searchParams } = new URL(request.url)

    const where: any = {
      deletedAt: null,
    }

    // Search filter
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { slug: { contains: params.search, mode: "insensitive" } },
        { tagline: { contains: params.search, mode: "insensitive" } },
      ]
    }

    // Active filter
    if (searchParams.get("activeOnly") === "true") {
      where.isActive = true
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where,
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    })

    // Get school counts for each plan
    const plansWithCounts = await Promise.all(
      plans.map(async (plan) => {
        const schoolCount = await prisma.school.count({
          where: {
            subscriptionPlan: plan.slug,
            deletedAt: null,
          },
        })

        return {
          ...plan,
          _count: {
            schools: schoolCount,
          },
        }
      })
    )

    // Parse JSON fields
    const parsedPlans = plansWithCounts.map((plan) => {
      let modules = []
      let features = null

      try {
        if (plan.modules) {
          modules = Array.isArray(plan.modules) 
            ? plan.modules 
            : typeof plan.modules === 'string' 
              ? JSON.parse(plan.modules) 
              : []
        }
      } catch (e) {
        console.error("Error parsing modules:", e)
        modules = []
      }

      try {
        if (plan.features) {
          features = Array.isArray(plan.features)
            ? plan.features
            : typeof plan.features === 'string'
              ? JSON.parse(plan.features)
              : null
        }
      } catch (e) {
        console.error("Error parsing features:", e)
        features = null
      }

      return {
        ...plan,
        modules,
        features,
        monthlyPrice: Number(plan.monthlyPrice),
        yearlyPrice: Number(plan.yearlyPrice),
        originalMonthlyPrice: plan.originalMonthlyPrice ? Number(plan.originalMonthlyPrice) : null,
        originalYearlyPrice: plan.originalYearlyPrice ? Number(plan.originalYearlyPrice) : null,
      }
    })

    console.log("Returning plans:", parsedPlans.length)
    return NextResponse.json({ plans: parsedPlans })
  } catch (error) {
    console.error("Admin plans GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/plans - Create new plan
export async function POST(request: NextRequest) {
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
    const validationResult = planSchema.safeParse(body)
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

    // Check if slug already exists
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { slug: data.slug },
    })

    if (existingPlan) {
      return NextResponse.json(
        { error: "Plan with this slug already exists" },
        { status: 409 }
      )
    }

    // If this is marked as popular, unmark others
    if (data.isPopular) {
      await prisma.subscriptionPlan.updateMany({
        where: {
          isPopular: true,
          deletedAt: null,
        },
        data: {
          isPopular: false,
        },
      })
    }

    // Create plan
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        slug: data.slug,
        tagline: data.tagline || null,
        description: data.description || null,
        monthlyPrice: data.monthlyPrice,
        yearlyPrice: data.yearlyPrice,
        originalMonthlyPrice: data.originalMonthlyPrice || null,
        originalYearlyPrice: data.originalYearlyPrice || null,
        discount: data.discount,
        isPopular: data.isPopular,
        badge: data.badge || null,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        maxSchools: data.maxSchools || null,
        maxStudents: data.maxStudents || null,
        maxStaff: data.maxStaff || null,
        storageGB: data.storageGB || null,
        modules: data.modules,
        features: data.features && data.features.length > 0 ? data.features : undefined,
        supportLevel: data.supportLevel,
      },
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

    return NextResponse.json({ plan: parsedPlan }, { status: 201 })
  } catch (error) {
    console.error("Admin plans POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

