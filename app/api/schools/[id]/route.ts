import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"
import { z } from "zod"

const updateSchoolSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  status: z.enum(["active", "suspended", "inactive"]).optional(),
  subscriptionPlan: z.string().optional().nullable(),
  maxUsers: z.number().int().positive().optional(),
  maxStudents: z.number().int().positive().optional(),
  organizationType: z.enum(["school", "company", "trust", "ngo", "other"]).optional(),
  industry: z.string().max(120).optional().nullable(),
})

function superAdminOnly(role: string) {
  return role !== "super_admin"
    ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
    : null
}

// GET /api/schools/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SUPER_ADMIN_ALL)
    if (auth.error) return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    const forbidden = superAdminOnly(auth.payload.role)
    if (forbidden) return forbidden

    const school = await prisma.school.findFirst({
      where: { id: params.id, deletedAt: null },
      select: {
        id: true, name: true, slug: true, email: true, phone: true,
        address: true, city: true, state: true, country: true, zipCode: true,
        website: true, status: true, subscriptionPlan: true, maxUsers: true,
        maxStudents: true, organizationType: true, industry: true, createdAt: true,
      },
    })

    if (!school) return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    return NextResponse.json({ school })
  } catch (error) {
    console.error("School GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/schools/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SUPER_ADMIN_ALL)
    if (auth.error) return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    const forbidden = superAdminOnly(auth.payload.role)
    if (forbidden) return forbidden

    const body = await request.json()
    const result = updateSchoolSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.errors.map((e) => ({ path: e.path, message: e.message })) },
        { status: 400 }
      )
    }

    const existing = await prisma.school.findFirst({ where: { id: params.id, deletedAt: null } })
    if (!existing) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

    const data = result.data
    const school = await prisma.school.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.email !== undefined && { email: data.email.trim() }),
        ...(data.phone !== undefined && { phone: data.phone?.trim() || null }),
        ...(data.address !== undefined && { address: data.address?.trim() || null }),
        ...(data.city !== undefined && { city: data.city?.trim() || null }),
        ...(data.state !== undefined && { state: data.state?.trim() || null }),
        ...(data.country !== undefined && { country: data.country?.trim() || null }),
        ...(data.zipCode !== undefined && { zipCode: data.zipCode?.trim() || null }),
        ...(data.website !== undefined && { website: data.website && data.website.trim() !== "" ? data.website.trim() : null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.subscriptionPlan !== undefined && { subscriptionPlan: data.subscriptionPlan || null }),
        ...(data.maxUsers !== undefined && { maxUsers: data.maxUsers }),
        ...(data.maxStudents !== undefined && { maxStudents: data.maxStudents }),
        ...(data.organizationType !== undefined && { organizationType: data.organizationType }),
        ...(data.industry !== undefined && { industry: data.industry?.trim() || null }),
      },
    })

    return NextResponse.json({ school, message: "Organization updated successfully" })
  } catch (error: any) {
    console.error("School PUT error:", error)
    if (error.code === "P2002") return NextResponse.json({ error: "Duplicate value conflict" }, { status: 409 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
