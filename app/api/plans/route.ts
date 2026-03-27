import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/plans - Get all active plans (public endpoint)
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching plans from database...")
    
    // First, try to find all plans without filters to see what's in DB
    const allPlans = await prisma.subscriptionPlan.findMany({
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    })
    
    console.log("Total plans in DB:", allPlans.length)
    console.log("All plans:", allPlans.map(p => ({ id: p.id, name: p.name, isActive: p.isActive, deletedAt: p.deletedAt })))

    // Now filter for active plans
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    })

    console.log("Active plans found:", plans.length)

    if (plans.length === 0) {
      console.warn("No active plans found! Returning empty array.")
      return NextResponse.json({ plans: [] })
    }

    // Parse JSON fields
    const parsedPlans = plans.map((plan) => {
      let modules = []
      let features = null

      try {
        if (plan.modules) {
          if (Array.isArray(plan.modules)) {
            modules = plan.modules
          } else if (typeof plan.modules === 'string') {
            modules = JSON.parse(plan.modules)
          } else {
            modules = []
          }
        }
      } catch (e) {
        console.error("Error parsing modules for plan", plan.id, ":", e)
        modules = []
      }

      try {
        if (plan.features) {
          if (Array.isArray(plan.features)) {
            features = plan.features
          } else if (typeof plan.features === 'string') {
            features = JSON.parse(plan.features)
          } else {
            features = null
          }
        }
      } catch (e) {
        console.error("Error parsing features for plan", plan.id, ":", e)
        features = null
      }

      return {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        tagline: plan.tagline,
        description: plan.description,
        monthlyPrice: Number(plan.monthlyPrice),
        yearlyPrice: Number(plan.yearlyPrice),
        originalMonthlyPrice: plan.originalMonthlyPrice ? Number(plan.originalMonthlyPrice) : null,
        originalYearlyPrice: plan.originalYearlyPrice ? Number(plan.originalYearlyPrice) : null,
        discount: plan.discount,
        isPopular: plan.isPopular,
        badge: plan.badge,
        isActive: plan.isActive,
        sortOrder: plan.sortOrder,
        maxSchools: plan.maxSchools,
        maxStudents: plan.maxStudents,
        maxStaff: plan.maxStaff,
        storageGB: plan.storageGB,
        modules,
        features,
        supportLevel: plan.supportLevel,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      }
    })

    console.log("Public plans API returning:", parsedPlans.length, "plans")
    console.log("First plan:", parsedPlans[0] ? { name: parsedPlans[0].name, modules: parsedPlans[0].modules?.length } : "none")
    
    return NextResponse.json({ plans: parsedPlans })
  } catch (error: any) {
    console.error("Plans GET error:", error)
    console.error("Error stack:", error.stack)
    return NextResponse.json({ 
      error: "Internal server error",
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

