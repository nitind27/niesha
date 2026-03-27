import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest, parseQueryParams, buildOrderBy } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const attendanceSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["present", "absent", "late", "excused"], {
    errorMap: () => ({ message: "Status must be present, absent, late, or excused" }),
  }),
  remarks: z.string().max(500).optional().or(z.literal("")),
})

function buildAttendanceWhereClause(schoolId: string, filters: ReturnType<typeof parseQueryParams>) {
  const where: any = {
    schoolId,
    student: {
      deletedAt: null,
    },
  }

  if (filters.search) {
    where.OR = [
      { student: { firstName: { contains: filters.search, mode: "insensitive" } } },
      { student: { lastName: { contains: filters.search, mode: "insensitive" } } },
      { student: { admissionNumber: { contains: filters.search, mode: "insensitive" } } },
    ]
  }

  if (filters.studentId) {
    where.studentId = filters.studentId
  }

  if (filters.classId) {
    where.student = {
      ...where.student,
      classId: filters.classId,
    }
  }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.startDate || filters.endDate) {
    where.date = {}
    if (filters.startDate) {
      where.date.gte = new Date(filters.startDate)
    }
    if (filters.endDate) {
      where.date.lte = new Date(filters.endDate)
    }
  }

  return where
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.ATTENDANCE_READ)
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
    
    const filters = parseQueryParams(request)
    const where = buildAttendanceWhereClause(payload.schoolId, filters)
    const orderBy = buildOrderBy(filters.sortBy || "date", filters.sortOrder || "desc")

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          id: true,
          date: true,
          status: true,
          remarks: true,
          markedBy: true,
          createdAt: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNumber: true,
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
          },
        },
        orderBy,
      }),
      prisma.attendance.count({ where }),
    ])

    return NextResponse.json({
      attendance,
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
    console.error("Attendance GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.ATTENDANCE_CREATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()
    
    const cleanedBody: any = { ...body }
    if (cleanedBody.remarks === "") cleanedBody.remarks = undefined
    
    const validationResult = attendanceSchema.safeParse(cleanedBody)
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
    
    if (!payload.schoolId) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 403 }
      )
    }

    // Validate student belongs to school
    const student = await prisma.student.findFirst({
      where: {
        id: data.studentId,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 400 }
      )
    }

    // Check if attendance already exists for this student and date
    const existing = await prisma.attendance.findUnique({
      where: {
        studentId_date: {
          studentId: data.studentId,
          date: new Date(data.date),
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Attendance already marked for this student on this date." },
        { status: 400 }
      )
    }

    const attendance = await prisma.attendance.create({
      data: {
        schoolId: payload.schoolId,
        studentId: data.studentId,
        date: new Date(data.date),
        status: data.status,
        remarks: data.remarks,
        markedBy: payload.userId || null,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
      },
    })

    return NextResponse.json({ attendance }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Attendance POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

