import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, generateToken } from "@/lib/auth"
import { authCookieOptions } from "@/lib/auth-cookies"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.string().max(50).optional().nullable(),
  confirmPassword: z.string().min(6, "Password confirmation is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = registerSchema.safeParse(body)
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

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        deletedAt: null,
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Get default role (student role for new registrations)
    const defaultRole = await prisma.role.findFirst({
      where: { name: "student" },
    })

    if (!defaultRole) {
      return NextResponse.json(
        { error: "Default role not found. Please contact administrator." },
        { status: 500 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.trim().toLowerCase(),
        password: hashedPassword,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone && data.phone.trim() !== "" ? data.phone.trim() : null,
        roleId: defaultRole.id,
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

    // Remove password from response
    const { password, ...userWithoutPassword } = user

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      schoolId: user.schoolId || undefined,
      role: user.role.name,
    })

    const response = NextResponse.json({
      user: userWithoutPassword,
      token: "authenticated",
    })

    response.cookies.set("token", token, authCookieOptions(60 * 60 * 24 * 7))

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Register error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

