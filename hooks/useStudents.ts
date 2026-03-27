"use client"

import { useState, useEffect, useCallback } from "react"
import api from "@/lib/api"
import { useDebounce } from "./useDebounce"

export interface StudentFilters {
  search?: string
  status?: string
  classId?: string
  sectionId?: string
  gender?: string
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface UseStudentsResult {
  students: any[]
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  filters: StudentFilters
  setFilters: (filters: Partial<StudentFilters>) => void
  setPage: (page: number) => void
  refetch: () => void
}

export function useStudents(initialFilters: StudentFilters = {}) {
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<StudentFilters>(initialFilters)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(filters.search || "", 300)

  const fetchStudents = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.status && { status: filters.status }),
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.sectionId && { sectionId: filters.sectionId }),
        ...(filters.gender && { gender: filters.gender }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      })

      const response = await api.get(`/students?${params.toString()}`)
      setStudents(response.data.students)
      setPagination(response.data.pagination)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch students")
      setStudents([])
    } finally {
      setIsLoading(false)
    }
  }, [page, debouncedSearch, filters])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const updateFilters = useCallback((newFilters: Partial<StudentFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPage(1) // Reset to first page when filters change
  }, [])

  return {
    students,
    isLoading,
    error,
    pagination,
    filters,
    setFilters: updateFilters,
    setPage,
    refetch: fetchStudents,
  }
}

