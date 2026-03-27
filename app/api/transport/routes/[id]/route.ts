import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const updateRouteSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  routeNumber: z.string().min(1).max(50).optional(),
  startPoint: z.string().min(1).max(200).optional(),
  endPoint: z.string().min(1).max(200).optional(),
  stops: z.union([z.array(z.string()), z.string()]).optional().transform((val) => {
    if (!val || val === "") return undefined
    if (Array.isArray(val)) return val
    return undefined
  }),
  distance: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const num = typeof val === "string" ? parseFloat(val) : val
    return isNaN(num) || num < 0 ? undefined : num
  }),
  fare: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const num = typeof val === "string" ? parseFloat(val) : val
    return isNaN(num) || num < 0 ? undefined : num
  }),
  vehicleId: z.string().optional().or(z.literal("")),
  driverId: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.TRANSPORT_READ)
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

    const route = await prisma.transportRoute.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    })

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 })
    }

    return NextResponse.json({ route })
  } catch (error) {
    console.error("Transport Route GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.TRANSPORT_UPDATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()
    
    const cleanedBody: any = { ...body }
    if (cleanedBody.vehicleId === "") cleanedBody.vehicleId = undefined
    if (cleanedBody.driverId === "") cleanedBody.driverId = undefined
    if (cleanedBody.stops === "") cleanedBody.stops = undefined
    
    const validationResult = updateRouteSchema.safeParse(cleanedBody)
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

    const existingRoute = await prisma.transportRoute.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!existingRoute) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 })
    }

    // Check for duplicate route number if being changed
    if (data.routeNumber && data.routeNumber !== existingRoute.routeNumber) {
      const duplicateRoute = await prisma.transportRoute.findFirst({
        where: {
          schoolId: payload.schoolId,
          routeNumber: data.routeNumber,
          deletedAt: null,
          id: { not: params.id },
        },
      })

      if (duplicateRoute) {
        return NextResponse.json(
          { error: "Route number already exists for this school" },
          { status: 400 }
        )
      }
    }

    // Validate driver if being changed
    if (data.driverId !== undefined && data.driverId !== existingRoute.driverId) {
      if (data.driverId) {
        const driver = await prisma.staff.findFirst({
          where: {
            id: data.driverId,
            schoolId: payload.schoolId,
            deletedAt: null,
          },
        })

        if (!driver) {
          return NextResponse.json(
            { error: "Driver not found" },
            { status: 400 }
          )
        }
      }
    }

    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.routeNumber !== undefined) updateData.routeNumber = data.routeNumber
    if (data.startPoint !== undefined) updateData.startPoint = data.startPoint
    if (data.endPoint !== undefined) updateData.endPoint = data.endPoint
    if (data.stops !== undefined) updateData.stops = data.stops && Array.isArray(data.stops) ? data.stops : null
    if (data.distance !== undefined) updateData.distance = data.distance || null
    if (data.fare !== undefined) updateData.fare = data.fare || null
    if (data.vehicleId !== undefined) updateData.vehicleId = data.vehicleId || null
    if (data.driverId !== undefined) updateData.driverId = data.driverId || null
    if (data.status !== undefined) updateData.status = data.status

    const route = await prisma.transportRoute.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ route })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Transport Route PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.TRANSPORT_DELETE)
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

    const existingRoute = await prisma.transportRoute.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    })

    if (!existingRoute) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 })
    }

    // Check if route has active students
    const activeStudents = await prisma.studentTransport.count({
      where: {
        routeId: params.id,
        status: "active",
      },
    })

    if (activeStudents > 0) {
      return NextResponse.json(
        { error: "Cannot delete route with active students. Please remove all students from this route first." },
        { status: 400 }
      )
    }

    await prisma.transportRoute.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: "Route deleted successfully" })
  } catch (error) {
    console.error("Transport Route DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

