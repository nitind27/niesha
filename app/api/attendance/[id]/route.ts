import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const updateAttendanceSchema = z.object({
  studentId: z.string().min(1).optional(),
  date: z.string().optional(),
  status: z.enum(["present", "absent", "late", "excused"]).optional(),
  remarks: z.string().max(500).optional().or(z.literal("")),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const attendance = await prisma.attendance.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
      },
      include: {
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
    })

    if (!attendance) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 })
    }

    return NextResponse.json({ attendance })
  } catch (error) {
    console.error("Attendance GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.ATTENDANCE_UPDATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()
    
    const cleanedBody: any = { ...body }
    if (cleanedBody.remarks === "") cleanedBody.remarks = undefined
    
    const validationResult = updateAttendanceSchema.safeParse(cleanedBody)
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

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
      },
    })

    if (!existingAttendance) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 })
    }

    // Validate student if being changed
    if (data.studentId && data.studentId !== existingAttendance.studentId) {
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
    }

    // Check if new combination already exists
    const studentId = data.studentId || existingAttendance.studentId
    const date = data.date ? new Date(data.date) : existingAttendance.date

    if ((data.studentId && data.studentId !== existingAttendance.studentId) ||
        (data.date && new Date(data.date).toDateString() !== existingAttendance.date.toDateString())) {
      const existing = await prisma.attendance.findUnique({
        where: {
          studentId_date: {
            studentId,
            date,
          },
        },
      })

      if (existing && existing.id !== params.id) {
        return NextResponse.json(
          { error: "Attendance already marked for this student on this date." },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    
    if (data.studentId !== undefined) updateData.studentId = data.studentId
    if (data.date !== undefined) updateData.date = new Date(data.date)
    if (data.status !== undefined) updateData.status = data.status
    if (data.remarks !== undefined) updateData.remarks = data.remarks || null

    const attendance = await prisma.attendance.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({ attendance })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Attendance PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.ATTENDANCE_UPDATE)
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

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
      },
    })

    if (!existingAttendance) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 })
    }

    await prisma.attendance.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Attendance record deleted successfully" })
  } catch (error) {
    console.error("Attendance DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

