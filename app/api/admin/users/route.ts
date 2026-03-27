import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest, parseQueryParams } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"
import { hashPassword } from "@/lib/auth"
import { appBaseUrl, sendNewAdminWelcomeEmail } from "@/lib/mail"

const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.string().max(50).optional().nullable(),
  roleId: z.string().min(1, "Role is required"),
  schoolId: z
    .union([z.string().cuid("Invalid school ID"), z.null(), z.literal("none")])
    .optional()
    .nullable()
    .transform((val) => (val === "none" || val === "" ? null : val)),
  isActive: z.boolean().default(true),
  language: z.string().default("en"),
})

// GET /api/admin/users - List all users
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
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ]
    }

    // Role filter
    const roleId = searchParams.get("roleId")
    if (roleId) {
      where.roleId = roleId
    }

    // School filter
    const schoolId = searchParams.get("schoolId")
    if (schoolId) {
      where.schoolId = schoolId
    } else if (searchParams.get("superAdminOnly") === "true") {
      where.schoolId = null
    }

    // Status filter
    if (params.status) {
      where.isActive = params.status === "active"
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
          school: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          [params.sortBy]: params.sortOrder,
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.user.count({ where }),
    ])

    // Remove password from response
    const usersWithoutPassword = users.map(({ password, ...user }) => user)

    return NextResponse.json({
      users: usersWithoutPassword,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    })
  } catch (error) {
    console.error("Admin users GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/users - Create new user/admin
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
    
    // Clean up the body - handle "none" for schoolId
    const cleanedBody = {
      ...body,
      schoolId: body.schoolId === "none" || body.schoolId === "" ? null : body.schoolId,
      phone: body.phone === "" ? null : body.phone,
    }
    
    // Validate input
    const validationResult = userSchema.safeParse(cleanedBody)
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
    
    // Ensure roleId is provided
    if (!data.roleId || data.roleId.trim() === "") {
      return NextResponse.json(
        { error: "Role is required" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        schoolId: data.schoolId || null,
        deletedAt: null,
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: data.roleId },
    })

    if (!role) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Verify school exists if schoolId is provided
    if (data.schoolId) {
      const school = await prisma.school.findUnique({
        where: { id: data.schoolId },
      })

      if (!school) {
        return NextResponse.json({ error: "Invalid school" }, { status: 400 })
      }
    }

    // Hash password if provided
    const hashedPassword = data.password
      ? await hashPassword(data.password)
      : await hashPassword("password123") // Default password

    // Create user - Prisma will automatically set createdAt and updatedAt
    // Make sure all string fields are trimmed and valid
    // DO NOT manually set any DateTime fields - let Prisma handle them
    const userData = {
      email: data.email.trim(),
      password: hashedPassword,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone && data.phone.trim() !== "" ? data.phone.trim() : null,
      roleId: data.roleId.trim(),
      schoolId: data.schoolId || null,
      isActive: data.isActive ?? true,
      language: data.language || "en",
      // createdAt: NOT SET - Prisma @default(now()) handles this
      // updatedAt: NOT SET - Prisma @updatedAt handles this
      // deletedAt: NOT SET - defaults to null
    }

    // Create user - Prisma will handle all DateTime fields automatically
    const user = await prisma.user.create({
      data: userData,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    // Remove password from response
    const { password, ...userWithoutPassword } = user

    const loginUrl = `${appBaseUrl()}/login`
    const emailResult = await sendNewAdminWelcomeEmail({
      to: user.email,
      firstName: user.firstName,
      loginUrl,
      roleDisplayName: user.role.displayName || user.role.name,
      tenantName: user.school?.name ?? null,
      plainPassword: data.password,
    })

    return NextResponse.json(
      {
        user: userWithoutPassword,
        welcomeEmailSent: emailResult.sent,
        ...(emailResult.sent
          ? {}
          : { welcomeEmailSkipped: emailResult.reason }),
        ...(emailResult.sent === false &&
        emailResult.reason === "send_failed" &&
        emailResult.message
          ? { welcomeEmailError: emailResult.message }
          : {}),
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Admin users POST error:", error)
    
    // Handle specific Prisma/MySQL errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }
    
    if (error.message?.includes("datetime") || error.message?.includes("updatedAt")) {
      return NextResponse.json(
        { 
          error: "Database error: Invalid date format. Please try again.",
          details: error.message 
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

