import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  type: z.enum(["general", "academic", "event", "emergency"]).optional(),
  targetAudience: z.union([z.array(z.string()), z.string()]).optional().transform((val) => {
    if (val === undefined) return undefined
    if (val === "" || val === "all") return ["all"]
    if (Array.isArray(val)) return val
    return [val]
  }),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  isPublished: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.ANNOUNCEMENT_READ)
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

    const announcement = await prisma.announcement.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 })
    }

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error("Announcement GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.ANNOUNCEMENT_UPDATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()
    
    const cleanedBody: any = { ...body }
    if (cleanedBody.startDate === "") cleanedBody.startDate = undefined
    if (cleanedBody.endDate === "") cleanedBody.endDate = undefined
    
    const validationResult = updateAnnouncementSchema.safeParse(cleanedBody)
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

    const existingAnnouncement = await prisma.announcement.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!existingAnnouncement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 })
    }

    // Validate dates
    const startDate = data.startDate !== undefined ? data.startDate : existingAnnouncement.startDate
    const endDate = data.endDate !== undefined ? data.endDate : existingAnnouncement.endDate

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (start > end) {
        return NextResponse.json(
          { error: "Start date cannot be after end date" },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    
    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) updateData.content = data.content
    if (data.type !== undefined) updateData.type = data.type
    if (data.targetAudience !== undefined) updateData.targetAudience = data.targetAudience
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished

    const announcement = await prisma.announcement.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ announcement })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Announcement PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.ANNOUNCEMENT_DELETE)
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

    const existingAnnouncement = await prisma.announcement.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!existingAnnouncement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 })
    }

    await prisma.announcement.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: "Announcement deleted successfully" })
  } catch (error) {
    console.error("Announcement DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

