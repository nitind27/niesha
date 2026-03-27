import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authenticateRequest } from "@/lib/api-utils"
import { PERMISSIONS } from "@/lib/permissions"

const updateBookSchema = z.object({
  isbn: z.string().max(50).optional().or(z.literal("")),
  title: z.string().min(1).max(200).optional(),
  author: z.string().min(1).max(100).optional(),
  publisher: z.string().max(100).optional().or(z.literal("")),
  category: z.string().max(50).optional().or(z.literal("")),
  edition: z.string().max(50).optional().or(z.literal("")),
  totalCopies: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === "" || val === null || val === undefined) return undefined
    const num = typeof val === "string" ? parseInt(val) : val
    return isNaN(num) || num < 1 ? undefined : num
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
  status: z.enum(["available", "issued", "lost", "damaged"]).optional(),
  coverImage: z.string().max(500).optional().or(z.literal("")),
  description: z.string().max(1000).optional().or(z.literal("")),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const book = await prisma.libraryBook.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            issues: true,
          },
        },
      },
    })

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    return NextResponse.json({ book })
  } catch (error) {
    console.error("Library Book GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.LIBRARY_UPDATE)
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
    
    const validationResult = updateBookSchema.safeParse(cleanedBody)
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

    const existingBook = await prisma.libraryBook.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
    })

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    // Validate availableCopies doesn't exceed totalCopies
    const totalCopies = data.totalCopies !== undefined ? data.totalCopies : existingBook.totalCopies
    const availableCopies = data.availableCopies !== undefined ? data.availableCopies : existingBook.availableCopies

    if (availableCopies > totalCopies) {
      return NextResponse.json(
        { error: "Available copies cannot exceed total copies" },
        { status: 400 }
      )
    }

    const updateData: any = {}
    
    if (data.isbn !== undefined) updateData.isbn = data.isbn || null
    if (data.title !== undefined) updateData.title = data.title
    if (data.author !== undefined) updateData.author = data.author
    if (data.publisher !== undefined) updateData.publisher = data.publisher || null
    if (data.category !== undefined) updateData.category = data.category || null
    if (data.edition !== undefined) updateData.edition = data.edition || null
    if (data.totalCopies !== undefined) updateData.totalCopies = data.totalCopies
    if (data.availableCopies !== undefined) updateData.availableCopies = data.availableCopies
    if (data.price !== undefined) updateData.price = data.price || null
    if (data.shelfNumber !== undefined) updateData.shelfNumber = data.shelfNumber || null
    if (data.status !== undefined) updateData.status = data.status
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage || null
    if (data.description !== undefined) updateData.description = data.description || null

    const book = await prisma.libraryBook.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ book })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Library Book PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request, PERMISSIONS.LIBRARY_DELETE)
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

    const existingBook = await prisma.libraryBook.findFirst({
      where: {
        id: params.id,
        schoolId: payload.schoolId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            issues: true,
          },
        },
      },
    })

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    // Check if book has active issues
    const activeIssues = await prisma.bookIssue.count({
      where: {
        bookId: params.id,
        status: { in: ["issued", "overdue"] },
      },
    })

    if (activeIssues > 0) {
      return NextResponse.json(
        { error: "Cannot delete book with active issues. Please return all issued books first." },
        { status: 400 }
      )
    }

    await prisma.libraryBook.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: "Book deleted successfully" })
  } catch (error) {
    console.error("Library Book DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

