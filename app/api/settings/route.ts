import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"
import { z } from "zod"

const updateSchoolSchema = z.object({
  name: z.string().min(1, "School name is required").max(200).optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  website: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
  logoUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  faviconUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  defaultLanguage: z.string().min(2).max(10).optional(),
  supportedLanguages: z.array(z.string()).optional(),
  organizationType: z
    .enum(["school", "company", "trust", "ngo", "other"])
    .optional(),
  industry: z.string().max(120).optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SETTINGS_READ)
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

    const school = await prisma.school.findUnique({
      where: {
        id: payload.schoolId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        country: true,
        zipCode: true,
        logo: true,
        website: true,
        status: true,
        subscriptionPlan: true,
        subscriptionEnds: true,
        maxUsers: true,
        maxStudents: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        logoUrl: true,
        faviconUrl: true,
        defaultLanguage: true,
        supportedLanguages: true,
        createdAt: true,
        updatedAt: true,
        organizationType: true,
        industry: true,
      },
    })

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    // Parse JSON fields
    const parsedSchool = {
      ...school,
      supportedLanguages: school.supportedLanguages
        ? (Array.isArray(school.supportedLanguages)
            ? school.supportedLanguages
            : JSON.parse(school.supportedLanguages as string))
        : ["en"],
    }

    return NextResponse.json({ school: parsedSchool })
  } catch (error) {
    console.error("Settings GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.SETTINGS_UPDATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()

    if (!payload.schoolId) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 403 }
      )
    }

    const validationResult = updateSchoolSchema.safeParse(body)
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

    // Check if school exists
    const existingSchool = await prisma.school.findUnique({
      where: {
        id: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!existingSchool) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.email !== undefined) updateData.email = data.email.trim()
    if (data.phone !== undefined) updateData.phone = data.phone && data.phone.trim() !== "" ? data.phone.trim() : null
    if (data.address !== undefined) updateData.address = data.address && data.address.trim() !== "" ? data.address.trim() : null
    if (data.city !== undefined) updateData.city = data.city && data.city.trim() !== "" ? data.city.trim() : null
    if (data.state !== undefined) updateData.state = data.state && data.state.trim() !== "" ? data.state.trim() : null
    if (data.country !== undefined) updateData.country = data.country && data.country.trim() !== "" ? data.country.trim() : null
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode && data.zipCode.trim() !== "" ? data.zipCode.trim() : null
    if (data.website !== undefined) updateData.website = data.website && data.website.trim() !== "" ? data.website.trim() : null
    if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor
    if (data.secondaryColor !== undefined) updateData.secondaryColor = data.secondaryColor
    if (data.accentColor !== undefined) updateData.accentColor = data.accentColor
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl && data.logoUrl.trim() !== "" ? data.logoUrl.trim() : null
    if (data.faviconUrl !== undefined) updateData.faviconUrl = data.faviconUrl && data.faviconUrl.trim() !== "" ? data.faviconUrl.trim() : null
    if (data.defaultLanguage !== undefined) updateData.defaultLanguage = data.defaultLanguage
    if (data.supportedLanguages !== undefined) updateData.supportedLanguages = data.supportedLanguages
    if (data.organizationType !== undefined) updateData.organizationType = data.organizationType
    if (data.industry !== undefined) {
      updateData.industry =
        data.industry && String(data.industry).trim() !== "" ? String(data.industry).trim() : null
    }

    const school = await prisma.school.update({
      where: { id: payload.schoolId },
      data: updateData,
    })

    // Parse JSON fields for response
    const parsedSchool = {
      ...school,
      supportedLanguages: school.supportedLanguages
        ? (Array.isArray(school.supportedLanguages)
            ? school.supportedLanguages
            : JSON.parse(school.supportedLanguages as string))
        : ["en"],
    }

    return NextResponse.json({ school: parsedSchool })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Settings PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

