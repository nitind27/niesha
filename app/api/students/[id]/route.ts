import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const updateStudentSchema = z.object({
  admissionNumber: z.string().min(1).max(50).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  dateOfBirth: z.string().refine((date) => {
    if (!date) return true
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) && parsed < new Date()
  }, "Invalid date or date must be in the past").optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
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
  status: z.enum(["active", "graduated", "transferred", "inactive"]).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const student = await prisma.student.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
      include: {
        class: true,
        section: true,
        attendance: {
          take: 10,
          orderBy: { date: "desc" },
        },
        examResults: {
          take: 10,
          include: {
            exam: true,
            subject: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error("Student GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.STUDENT_UPDATE)
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
    
    // Validate input
    const validationResult = updateStudentSchema.safeParse(cleanedBody)
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

    // Student operations require schoolId
    if (!payload.schoolId) {
      return NextResponse.json(
        { error: "School ID is required for student operations" },
        { status: 403 }
      )
    }

    // First verify the student belongs to the school
    const existingStudent = await prisma.student.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Check if admission number is being changed and if new one already exists
    if (data.admissionNumber && data.admissionNumber !== existingStudent.admissionNumber) {
      const existing = await prisma.student.findFirst({
        where: {
          schoolId: payload.schoolId,
          admissionNumber: data.admissionNumber,
          deletedAt: null,
          id: { not: params.id },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: `Admission number "${data.admissionNumber}" already exists. Please use a different admission number.` },
          { status: 400 }
        )
      }
    }

    // Validate date of birth if provided
    if (data.dateOfBirth) {
      const dateOfBirth = new Date(data.dateOfBirth)
      const today = new Date()
      if (dateOfBirth >= today) {
        return NextResponse.json(
          { error: "Date of birth must be in the past" },
          { status: 400 }
        )
      }
    }

    // Validate class and section relationship if provided
    if (data.sectionId && !data.classId) {
      // If section is provided but class is not, use existing class
      if (!existingStudent.classId) {
        return NextResponse.json(
          { error: "Class must be selected when section is provided" },
          { status: 400 }
        )
      }
    }

    if (data.sectionId) {
      const sectionClassId = data.classId || existingStudent.classId
      if (sectionClassId) {
        const section = await prisma.section.findFirst({
          where: {
            id: data.sectionId,
            classId: sectionClassId,
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
    }

    // Clean up empty strings and prepare update data
    const updateData: any = {}
    
    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = new Date(data.dateOfBirth)
    if (data.gender !== undefined) updateData.gender = data.gender
    if (data.bloodGroup !== undefined) updateData.bloodGroup = data.bloodGroup || null
    if (data.address !== undefined) updateData.address = data.address || null
    if (data.city !== undefined) updateData.city = data.city || null
    if (data.state !== undefined) updateData.state = data.state || null
    if (data.country !== undefined) updateData.country = data.country || null
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode || null
    if (data.phone !== undefined) updateData.phone = data.phone && data.phone.trim() !== "" ? data.phone.trim() : null
    if (data.email !== undefined) updateData.email = data.email && data.email.trim() !== "" ? data.email.trim() : null
    if (data.parentPhone !== undefined) updateData.parentPhone = data.parentPhone && data.parentPhone.trim() !== "" ? data.parentPhone.trim() : null
    if (data.parentEmail !== undefined) updateData.parentEmail = data.parentEmail && data.parentEmail.trim() !== "" ? data.parentEmail.trim() : null
    if (data.classId !== undefined) updateData.classId = data.classId && data.classId !== "" ? data.classId : null
    if (data.sectionId !== undefined) updateData.sectionId = data.sectionId && data.sectionId !== "" ? data.sectionId : null
    if (data.status !== undefined) updateData.status = data.status
    if (data.admissionNumber !== undefined) updateData.admissionNumber = data.admissionNumber

    const student = await prisma.student.update({
      where: {
        id: params.id,
      },
      data: updateData,
      include: {
        class: true,
        section: true,
      },
    })

    return NextResponse.json({ student })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Student PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.STUDENT_DELETE)
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

    // First verify the student belongs to the school
    const existingStudent = await prisma.student.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    await prisma.student.update({
      where: {
        id: params.id,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Student deleted successfully" })
  } catch (error) {
    console.error("Student DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

