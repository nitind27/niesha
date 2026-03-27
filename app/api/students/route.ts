import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest, parseQueryParams, buildWhereClause, buildOrderBy } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const studentSchema = z.object({
  admissionNumber: z.string().min(1, "Admission number is required").max(50),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  dateOfBirth: z.string().refine((date) => {
    if (!date) return false
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) && parsed < new Date()
  }, "Invalid date or date must be in the past"),
  gender: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Gender must be male, female, or other" }),
  }),
  bloodGroup: z.string().max(10).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  phone: z
    .union([z.string().max(20).regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number"), z.null(), z.literal("")])
    .optional(),
  email: z.union([z.string().email("Invalid email"), z.null(), z.literal("")]).optional(),
  parentPhone: z
    .union([z.string().max(20).regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number"), z.null(), z.literal("")])
    .optional(),
  parentEmail: z.union([z.string().email("Invalid email"), z.null(), z.literal("")]).optional(),
  classId: z
    .preprocess(
      (val) => (val === "none" || val === "" ? null : val),
      z.union([z.string().cuid("Invalid class ID"), z.null()]).optional()
    ),
  sectionId: z
    .preprocess(
      (val) => (val === "none" || val === "" ? null : val),
      z.union([z.string().cuid("Invalid section ID"), z.null()]).optional()
    ),
  status: z.enum(["active", "inactive", "graduated", "transferred"]).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.STUDENT_READ)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    
    // Student operations require schoolId
    if (!payload.schoolId) {
      return NextResponse.json(
        { error: "School ID is required for student operations" },
        { status: 403 }
      )
    }
    
    const filters = parseQueryParams(request)
    const where = buildWhereClause(payload.schoolId, filters)
    const orderBy = buildOrderBy(filters.sortBy, filters.sortOrder)

    // Optimized query with select only needed fields
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          id: true,
          admissionNumber: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          status: true,
          email: true,
          phone: true,
          createdAt: true,
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          section: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy,
      }),
      prisma.student.count({ where }),
    ])

    return NextResponse.json({
      students,
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
    console.error("Students GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.STUDENT_CREATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()
    
    // Clean up body - remove empty strings and convert to null/undefined
    const cleanedBody: any = { ...body }
    
    // Convert empty strings and "none" to null for optional fields
    const optionalFields = ["phone", "email", "parentPhone", "parentEmail", "classId", "sectionId", 
                            "bloodGroup", "address", "city", "state", "country", "zipCode"]
    optionalFields.forEach(field => {
      if (cleanedBody[field] === "" || cleanedBody[field] === "none" || cleanedBody[field] === undefined) {
        cleanedBody[field] = null
      }
    })
    
    // Remove null values for fields that should be undefined (not sent to Prisma)
    // But keep them for validation
    
    // Validate input
    const validationResult = studentSchema.safeParse(cleanedBody)
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
    
    // Convert null back to undefined for Prisma
    const prismaData: any = {}
    Object.keys(data).forEach(key => {
      if (data[key as keyof typeof data] !== null) {
        prismaData[key] = data[key as keyof typeof data]
      }
    })

    // Student operations require schoolId
    if (!payload.schoolId) {
      return NextResponse.json(
        { error: "School ID is required for student operations" },
        { status: 403 }
      )
    }

    // Check if admission number already exists
    const existing = await prisma.student.findFirst({
      where: {
        schoolId: payload.schoolId,
        admissionNumber: prismaData.admissionNumber,
        deletedAt: null,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Admission number "${prismaData.admissionNumber}" already exists. Please use a different admission number.` },
        { status: 400 }
      )
    }

    // Validate date of birth
    const dateOfBirth = new Date(prismaData.dateOfBirth)
    const today = new Date()
    if (dateOfBirth >= today) {
      return NextResponse.json(
        { error: "Date of birth must be in the past" },
        { status: 400 }
      )
    }

    // Validate class and section relationship if provided
    if (prismaData.sectionId && !prismaData.classId) {
      return NextResponse.json(
        { error: "Class must be selected when section is provided" },
        { status: 400 }
      )
    }

    if (prismaData.sectionId && prismaData.classId) {
      const section = await prisma.section.findFirst({
        where: {
          id: prismaData.sectionId,
          classId: prismaData.classId,
          deletedAt: null,
        },
      })

      if (!section) {
        return NextResponse.json(
          { error: "Selected section does not belong to the selected class" },
          { status: 400 }
        )
      }
    }

    // Prepare final data for Prisma
    const finalData = {
      ...prismaData,
      dateOfBirth: dateOfBirth,
      schoolId: payload.schoolId,
      status: prismaData.status || "active",
    }

    const student = await prisma.student.create({
      data: finalData,
      select: {
        id: true,
        admissionNumber: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        status: true,
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ student }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Students POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
