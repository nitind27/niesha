import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest, parseQueryParams, buildOrderBy } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"
import { hashPassword } from "@/lib/auth"
import { sendStaffWelcomeEmail, appBaseUrl } from "@/lib/mail"

const DEFAULT_STAFF_PASSWORD = "staff@123"

const staffSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required").max(50),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  dateOfBirth: z.string().refine((date) => {
    if (!date) return true
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) && parsed < new Date()
  }, "Invalid date or date must be in the past").optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  phone: z.string().min(1, "Phone is required").max(20),
  email: z.string().email("Invalid email"),
  address: z.string().max(500).optional(),
  designation: z.string().min(1, "Designation is required").max(100),
  department: z.string().max(100).optional(),
  joiningDate: z.string().refine((date) => {
    if (!date) return false
    const parsed = new Date(date)
    return !isNaN(parsed.getTime())
  }, "Invalid joining date").optional(),
  salary: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const num = typeof val === "string" ? parseFloat(val) : val
    return isNaN(num) ? undefined : num
  }),
  status: z.enum(["active", "on_leave", "terminated", "inactive"]).optional(),
  experience: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const num = typeof val === "string" ? parseInt(val) : val
    return isNaN(num) ? undefined : num
  }),
})

// Build where clause for staff
function buildStaffWhereClause(schoolId: string, filters: ReturnType<typeof parseQueryParams>) {
  const where: any = {
    schoolId,
    deletedAt: null,
  }

  // Search filter
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { employeeId: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  // Status filter
  if (filters.status) {
    where.status = filters.status
  }

  // Designation filter
  if (filters.designation) {
    where.designation = filters.designation
  }

  // Department filter
  if (filters.department) {
    where.department = filters.department
  }

  // Gender filter
  if (filters.gender) {
    where.gender = filters.gender
  }

  // Date range filter
  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate)
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate)
    }
  }

  return where
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.STAFF_READ)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    
    // Staff operations require schoolId
    if (!payload.schoolId) {
      return NextResponse.json(
        { error: "School ID is required for staff operations" },
        { status: 403 }
      )
    }
    
    const filters = parseQueryParams(request)
    const where = buildStaffWhereClause(payload.schoolId, filters)
    const orderBy = buildOrderBy(filters.sortBy, filters.sortOrder)

    // Optimized query with select only needed fields
    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          email: true,
          designation: true,
          department: true,
          joiningDate: true,
          salary: true,
          status: true,
          experience: true,
          createdAt: true,
        },
        orderBy,
      }),
      prisma.staff.count({ where }),
    ])

    return NextResponse.json({
      staff,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
        hasNextPage: filters.page < Math.ceil(total / filters.limit),
        hasPrevPage: filters.page > 1,
      },
    })
  } catch (error) {
    console.error("Staff GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.STAFF_CREATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()
    
    // Clean up body - remove empty strings and convert to null/undefined
    const cleanedBody: any = { ...body }
    
    // Convert empty strings to undefined for optional fields
    const optionalFields = ["dateOfBirth", "gender", "address", "department", "salary", "experience"]
    optionalFields.forEach(field => {
      if (cleanedBody[field] === "" || cleanedBody[field] === undefined) {
        cleanedBody[field] = undefined
      }
    })
    
    // Validate input
    const validationResult = staffSchema.safeParse(cleanedBody)
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
    
    // Staff operations require schoolId
    if (!payload.schoolId) {
      return NextResponse.json(
        { error: "School ID is required for staff operations" },
        { status: 403 }
      )
    }

    // Check if employee ID already exists
    const existing = await prisma.staff.findFirst({
      where: {
        schoolId: payload.schoolId,
        employeeId: data.employeeId,
        deletedAt: null,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Employee ID "${data.employeeId}" already exists. Please use a different employee ID.` },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingEmail = await prisma.staff.findFirst({
      where: {
        schoolId: payload.schoolId,
        email: data.email,
        deletedAt: null,
      },
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: `Email "${data.email}" already exists. Please use a different email.` },
        { status: 400 }
      )
    }

    // Prepare final data for Prisma
    const finalData: any = {
      employeeId: data.employeeId,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      designation: data.designation,
      schoolId: payload.schoolId,
      status: data.status || "active",
    }

    if (data.dateOfBirth) {
      finalData.dateOfBirth = new Date(data.dateOfBirth)
    }
    if (data.gender) {
      finalData.gender = data.gender
    }
    if (data.address) {
      finalData.address = data.address
    }
    if (data.department) {
      finalData.department = data.department
    }
    if (data.joiningDate) {
      finalData.joiningDate = new Date(data.joiningDate)
    } else {
      finalData.joiningDate = new Date()
    }
    if (data.salary !== undefined) {
      finalData.salary = data.salary
    }
    if (data.experience !== undefined) {
      finalData.experience = data.experience
    }

    // Create User account for staff member
    let userId: string | undefined
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email, schoolId: payload.schoolId, deletedAt: null },
    })
    if (!existingUser) {
      // Map designation to role name
      const designationRoleMap: Record<string, string> = {
        "Teacher": "teacher",
        "Principal": "principal",
        "Accountant": "accountant",
        "HR Manager": "hr_manager",
        "Librarian": "librarian",
        "Transport Manager": "transport_manager",
      }
      const roleName = designationRoleMap[data.designation] ?? "teacher"
      const role = await prisma.role.findFirst({ where: { name: roleName, deletedAt: null } })
        ?? await prisma.role.findFirst({ where: { name: "teacher", deletedAt: null } })

      if (role) {
        const hashed = await hashPassword(DEFAULT_STAFF_PASSWORD)
        const newUser = await prisma.user.create({
          data: {
            email: data.email.trim().toLowerCase(),
            password: hashed,
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            phone: data.phone || null,
            roleId: role.id,
            schoolId: payload.schoolId,
            isActive: true,
            language: "en",
          },
        })
        userId = newUser.id
      }
    } else {
      userId = existingUser.id
    }

    const staff = await prisma.staff.create({
      data: { ...finalData, ...(userId ? { userId } : {}) },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        phone: true,
        email: true,
        designation: true,
        department: true,
        joiningDate: true,
        salary: true,
        status: true,
        experience: true,
      },
    })

    // Send welcome email (non-blocking)
    if (userId) {
      const school = await prisma.school.findUnique({
        where: { id: payload.schoolId },
        select: { name: true },
      })
      sendStaffWelcomeEmail({
        to: data.email.trim().toLowerCase(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        employeeId: data.employeeId,
        designation: data.designation,
        schoolName: school?.name ?? "School",
        loginUrl: `${appBaseUrl()}/login`,
        defaultPassword: DEFAULT_STAFF_PASSWORD,
      }).catch((e) => console.error("[staff] welcome email error:", e))
    }

    return NextResponse.json({ staff }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Staff POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

