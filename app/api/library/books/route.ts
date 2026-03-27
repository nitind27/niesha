import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest, parseQueryParams, buildOrderBy } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const bookSchema = z.object({
  isbn: z.string().max(50).optional().or(z.literal("")),
  title: z.string().min(1, "Title is required").max(200),
  author: z.string().min(1, "Author is required").max(100),
  publisher: z.string().max(100).optional().or(z.literal("")),
  category: z.string().max(50).optional().or(z.literal("")),
  edition: z.string().max(50).optional().or(z.literal("")),
  totalCopies: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === "string" ? parseInt(val) : val
    return isNaN(num) || num < 1 ? 1 : num
  }),
  availableCopies: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const num = typeof val === "string" ? parseInt(val) : val
    return isNaN(num) || num < 0 ? undefined : num
  }),
  price: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const num = typeof val === "string" ? parseFloat(val) : val
    return isNaN(num) || num < 0 ? undefined : num
  }),
  shelfNumber: z.string().max(50).optional().or(z.literal("")),
  status: z.enum(["available", "issued", "lost", "damaged"]).optional().default("available"),
  coverImage: z.string().max(500).optional().or(z.literal("")),
  description: z.string().max(1000).optional().or(z.literal("")),
})

function buildBookWhereClause(schoolId: string, filters: ReturnType<typeof parseQueryParams>) {
  const where: any = {
    schoolId,
    deletedAt: null,
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { author: { contains: filters.search, mode: "insensitive" } },
      { isbn: { contains: filters.search, mode: "insensitive" } },
      { publisher: { contains: filters.search, mode: "insensitive" } },
      { category: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.category) {
    where.category = filters.category
  }

  return where
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.LIBRARY_READ)
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
    const where = buildBookWhereClause(payload.schoolId, filters)
    const orderBy = buildOrderBy(filters.sortBy || "createdAt", filters.sortOrder || "desc")

    const [books, total] = await Promise.all([
      prisma.libraryBook.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          id: true,
          isbn: true,
          title: true,
          author: true,
          publisher: true,
          category: true,
          edition: true,
          totalCopies: true,
          availableCopies: true,
          price: true,
          shelfNumber: true,
          status: true,
          coverImage: true,
          description: true,
          createdAt: true,
          _count: {
            select: {
              issues: true,
            },
          },
        },
        orderBy,
      }),
      prisma.libraryBook.count({ where }),
    ])

    return NextResponse.json({
      books,
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
    console.error("Library Books GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.LIBRARY_CREATE)
    if (auth.error) {
      return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
    }

    const { payload } = auth
    const body = await request.json()
    
    const cleanedBody: any = { ...body }
    if (cleanedBody.isbn === "") cleanedBody.isbn = undefined
    if (cleanedBody.publisher === "") cleanedBody.publisher = undefined
    if (cleanedBody.category === "") cleanedBody.category = undefined
    if (cleanedBody.edition === "") cleanedBody.edition = undefined
    if (cleanedBody.shelfNumber === "") cleanedBody.shelfNumber = undefined
    if (cleanedBody.coverImage === "") cleanedBody.coverImage = undefined
    if (cleanedBody.description === "") cleanedBody.description = undefined
    
    const validationResult = bookSchema.safeParse(cleanedBody)
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

    // Set availableCopies to totalCopies if not provided
    const availableCopies = data.availableCopies !== undefined 
      ? data.availableCopies 
      : data.totalCopies

    // Validate availableCopies doesn't exceed totalCopies
    if (availableCopies > data.totalCopies) {
      return NextResponse.json(
        { error: "Available copies cannot exceed total copies" },
        { status: 400 }
      )
    }

    const book = await prisma.libraryBook.create({
      data: {
        schoolId: payload.schoolId,
        isbn: data.isbn,
        title: data.title,
        author: data.author,
        publisher: data.publisher,
        category: data.category,
        edition: data.edition,
        totalCopies: data.totalCopies,
        availableCopies: availableCopies,
        price: data.price,
        shelfNumber: data.shelfNumber,
        status: data.status || "available",
        coverImage: data.coverImage,
        description: data.description,
      },
    })

    return NextResponse.json({ book }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Library Books POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

