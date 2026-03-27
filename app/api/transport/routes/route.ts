import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest, parseQueryParams, buildOrderBy } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const routeSchema = z.object({
  name: z.string().min(1, "Route name is required").max(100),
  routeNumber: z.string().min(1, "Route number is required").max(50),
  startPoint: z.string().min(1, "Start point is required").max(200),
  endPoint: z.string().min(1, "End point is required").max(200),
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
  status: z.enum(["active", "inactive"]).optional().default("active"),
})

function buildRouteWhereClause(schoolId: string, filters: ReturnType<typeof parseQueryParams>) {
  const where: any = {
    schoolId,
    deletedAt: null,
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { routeNumber: { contains: filters.search, mode: "insensitive" } },
      { startPoint: { contains: filters.search, mode: "insensitive" } },
      { endPoint: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  if (filters.status) {
    where.status = filters.status
  }

  return where
}

export async function GET(request: NextRequest) {
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
    
    const filters = parseQueryParams(request)
    const where = buildRouteWhereClause(payload.schoolId, filters)
    const orderBy = buildOrderBy(filters.sortBy || "createdAt", filters.sortOrder || "desc")

    const [routes, total] = await Promise.all([
      prisma.transportRoute.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          id: true,
          name: true,
          routeNumber: true,
          startPoint: true,
          endPoint: true,
          stops: true,
          distance: true,
          fare: true,
          vehicleId: true,
          driverId: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              students: true,
            },
          },
        },
        orderBy,
      }),
      prisma.transportRoute.count({ where }),
    ])

    return NextResponse.json({
      routes,
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
    console.error("Transport Routes GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.TRANSPORT_CREATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()
    
    const cleanedBody: any = { ...body }
    if (cleanedBody.vehicleId === "") cleanedBody.vehicleId = undefined
    if (cleanedBody.driverId === "") cleanedBody.driverId = undefined
    if (cleanedBody.stops === "") cleanedBody.stops = undefined
    
    const validationResult = routeSchema.safeParse(cleanedBody)
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

    // Check for duplicate route number
    const existingRoute = await prisma.transportRoute.findFirst({
      where: {
        schoolId: payload.schoolId,
        routeNumber: data.routeNumber,
        deletedAt: null,
      },
    })

    if (existingRoute) {
      return NextResponse.json(
        { error: "Route number already exists for this school" },
        { status: 400 }
      )
    }

    // Validate driver if provided
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

    const route = await prisma.transportRoute.create({
      data: {
        schoolId: payload.schoolId,
        name: data.name,
        routeNumber: data.routeNumber,
        startPoint: data.startPoint,
        endPoint: data.endPoint,
        stops: data.stops && Array.isArray(data.stops) && data.stops.length > 0 ? data.stops : undefined,
        distance: data.distance,
        fare: data.fare,
        vehicleId: data.vehicleId || null,
        driverId: data.driverId || null,
        status: data.status || "active",
      },
    })

    return NextResponse.json({ route }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Transport Routes POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

