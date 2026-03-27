import { NextRequest } from "next/server"
import { verifyToken } from "./auth"
import { hasPermission, PERMISSIONS } from "./permissions"

export interface AuthResult {
  payload: {
    userId: string
    email: string
    roleId: string
    schoolId?: string
    role: string
  }
  error?: never
}

export interface AuthError {
  payload?: never
  error: {
    status: number
    message: string
  }
}

export async function authenticateRequest(
  request: NextRequest,
  requiredPermission?: string
): Promise<AuthResult | AuthError> {
  const token = request.cookies.get("token")?.value

  if (!token) {
    return {
      error: {
        status: 401,
        message: "Unauthorized",
      },
    }
  }

  const payload = verifyToken(token)

  if (!payload) {
    return {
      error: {
        status: 401,
        message: "Invalid token",
      },
    }
  }

  // For operations that require schoolId (like students), check if schoolId exists
  // But don't fail for super_admin who might not have schoolId
  // The permission check will handle access control

  if (requiredPermission && !hasPermission(payload.role, requiredPermission as any)) {
    return {
      error: {
        status: 403,
        message: "Forbidden",
      },
    }
  }

  return { payload }
}

export function parseQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  return {
    page: Math.max(1, parseInt(searchParams.get("page") || "1")),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10"))),
    search: searchParams.get("search") || "",
    sortBy: searchParams.get("sortBy") || "createdAt",
    sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
    // Common filters
    status: searchParams.get("status") || undefined,
    classId: searchParams.get("classId") || undefined,
    sectionId: searchParams.get("sectionId") || undefined,
    gender: searchParams.get("gender") || undefined,
    studentId: searchParams.get("studentId") || undefined,
    // Staff filters
    designation: searchParams.get("designation") || undefined,
    department: searchParams.get("department") || undefined,
    // Fee filters
    frequency: searchParams.get("frequency") || undefined,
    feeId: searchParams.get("feeId") || undefined,
    examId: searchParams.get("examId") || undefined,
    subjectId: searchParams.get("subjectId") || undefined,
    // Library filters
    category: searchParams.get("category") || undefined,
    // Announcement filters
    type: searchParams.get("type") || undefined,
    priority: searchParams.get("priority") || undefined,
    // Date filters
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
  }
}

export function buildWhereClause(
  schoolId: string,
  filters: ReturnType<typeof parseQueryParams>
) {
  const where: any = {
    schoolId,
    deletedAt: null,
  }

  // Search filter
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { admissionNumber: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  // Status filter
  if (filters.status) {
    where.status = filters.status
  }

  // Class filter
  if (filters.classId) {
    where.classId = filters.classId
  }

  // Section filter
  if (filters.sectionId) {
    where.sectionId = filters.sectionId
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

export function buildOrderBy(sortBy: string, sortOrder: "asc" | "desc") {
  return {
    [sortBy]: sortOrder,
  }
}

