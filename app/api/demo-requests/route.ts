import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const demoRequestSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required").max(50),
  schoolName: z.string().max(200).optional().nullable(),
  schoolType: z.string().max(100).optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  preferredDate: z.string().min(1, "Preferred date is required"),
  preferredTime: z.string().min(1, "Preferred time is required"),
  timezone: z.string().default("UTC"),
  message: z.string().max(1000).optional().nullable(),
})

// POST /api/demo-requests - Create demo request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = demoRequestSchema.safeParse(body)
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

    // Check if email already has a pending demo request
    const existingRequest = await prisma.demoRequest.findFirst({
      where: {
        email: data.email,
        status: "pending",
        deletedAt: null,
        preferredDate: {
          gte: new Date(),
        },
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        {
          error: "You already have a pending demo request. Please wait for confirmation.",
        },
        { status: 409 }
      )
    }

    // Parse preferred date
    const preferredDate = new Date(data.preferredDate)

    // Create demo request
    const demoRequest = await prisma.demoRequest.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        schoolName: data.schoolName?.trim() || null,
        schoolType: data.schoolType?.trim() || null,
        position: data.position?.trim() || null,
        country: data.country?.trim() || null,
        state: data.state?.trim() || null,
        city: data.city?.trim() || null,
        preferredDate,
        preferredTime: data.preferredTime.trim(),
        timezone: data.timezone || "UTC",
        message: data.message?.trim() || null,
        status: "pending",
      },
    })

    return NextResponse.json(
      {
        demoRequest: {
          id: demoRequest.id,
          firstName: demoRequest.firstName,
          lastName: demoRequest.lastName,
          email: demoRequest.email,
          preferredDate: demoRequest.preferredDate,
          preferredTime: demoRequest.preferredTime,
          status: demoRequest.status,
        },
        message: "Demo request submitted successfully. We'll contact you soon!",
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Demo request POST error:", error)

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A demo request with this information already exists" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

// GET /api/demo-requests - Get demo requests (for admin)
export async function GET(request: NextRequest) {
  try {
    // For now, this is public but you can add authentication later
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: any = {
      deletedAt: null,
    }

    if (status) {
      where.status = status
    }

    const [demoRequests, total] = await Promise.all([
      prisma.demoRequest.findMany({
        where,
        orderBy: {
          preferredDate: "asc",
        },
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          schoolName: true,
          preferredDate: true,
          preferredTime: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.demoRequest.count({ where }),
    ])

    return NextResponse.json({
      demoRequests,
      total,
    })
  } catch (error) {
    console.error("Demo requests GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

