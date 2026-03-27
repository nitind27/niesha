import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"
import { z } from "zod"
import { hashPassword } from "@/lib/auth"

const schoolSchema = z.object({
  name: z.string().min(1, "School name is required").max(200),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  website: z.string().url("Invalid website URL").optional().nullable().or(z.literal("")),
  // Admin user details
  adminEmail: z.string().email("Invalid admin email address"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
  adminFirstName: z.string().min(1, "First name is required").max(100),
  adminLastName: z.string().min(1, "Last name is required").max(100),
  adminPhone: z.string().optional().nullable(),
  // Subscription
  subscriptionPlan: z.string().optional().nullable(),
  maxUsers: z.number().int().positive().optional(),
  maxStudents: z.number().int().positive().optional(),
  organizationType: z.enum(["school", "company", "trust", "ngo", "other"]).optional(),
  industry: z.string().max(120).optional().nullable(),
})

// GET /api/schools - Get all schools (for super admin)
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

    const schools = await prisma.school.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        status: true,
        subscriptionPlan: true,
        createdAt: true,
        _count: {
          select: {
            users: {
              where: {
                deletedAt: null,
              },
            },
            students: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ schools })
  } catch (error) {
    console.error("Schools GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/schools - Create new school with admin user
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
    const validationResult = schoolSchema.safeParse(body)
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

    // Generate slug from school name
    const slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")

    // Check if slug already exists
    const existingSchool = await prisma.school.findUnique({
      where: { slug },
    })

    if (existingSchool) {
      return NextResponse.json(
        { error: "A school with this name already exists" },
        { status: 409 }
      )
    }

    // Check if admin email already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: data.adminEmail,
        deletedAt: null,
      },
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin email already exists" },
        { status: 409 }
      )
    }

    // Get school_admin role
    const schoolAdminRole = await prisma.role.findUnique({
      where: { name: "school_admin" },
    })

    if (!schoolAdminRole) {
      return NextResponse.json(
        { error: "School admin role not found" },
        { status: 500 }
      )
    }

    // Create school and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create school
      const school = await tx.school.create({
        data: {
          name: data.name.trim(),
          slug,
          email: data.email.trim(),
          phone: data.phone?.trim() || null,
          address: data.address?.trim() || null,
          city: data.city?.trim() || null,
          state: data.state?.trim() || null,
          country: data.country?.trim() || null,
          zipCode: data.zipCode?.trim() || null,
          website: data.website && data.website.trim() !== "" ? data.website.trim() : null,
          status: "active",
          subscriptionPlan: data.subscriptionPlan || null,
          maxUsers: data.maxUsers || 50,
          maxStudents: data.maxStudents || 500,
          organizationType: data.organizationType || "school",
          industry:
            data.industry && String(data.industry).trim() !== ""
              ? String(data.industry).trim()
              : null,
        },
      })

      // Hash admin password
      const hashedPassword = await hashPassword(data.adminPassword)

      // Create admin user for the school
      const adminUser = await tx.user.create({
        data: {
          email: data.adminEmail.trim(),
          password: hashedPassword,
          firstName: data.adminFirstName.trim(),
          lastName: data.adminLastName.trim(),
          phone: data.adminPhone?.trim() || null,
          roleId: schoolAdminRole.id,
          schoolId: school.id,
          isActive: true,
          language: "en",
        },
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

      return { school, adminUser }
    })

    // Remove password from response
    const { password, ...adminWithoutPassword } = result.adminUser

    return NextResponse.json(
      {
        school: result.school,
        admin: adminWithoutPassword,
        message: "School and admin user created successfully",
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Schools POST error:", error)
    
    // Handle specific Prisma/MySQL errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "School or user with this information already exists" },
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

