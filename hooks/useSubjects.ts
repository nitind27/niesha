"use client"

import { useState, useEffect, useCallback } from "react"
import api from "@/lib/api"
import { useDebounce } from "./useDebounce"

export interface SubjectFilters {
  search?: string
  status?: string
  classId?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface UseSubjectsResult {
  subjects: any[]
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
  filters: SubjectFilters
  setFilters: (filters: Partial<SubjectFilters>) => void
  setPage: (page: number) => void
  refetch: () => void
}

export function useSubjects(initialFilters: SubjectFilters = {}) {
  const [subjects, setSubjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<SubjectFilters>(initialFilters)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })

  const debouncedSearch = useDebounce(filters.search || "", 300)

  const fetchSubjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.status && { status: filters.status }),
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      })

      const response = await api.get(`/subjects?${params.toString()}`)
      setSubjects(response.data.subjects)
      setPagination(response.data.pagination)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch subjects")
      setSubjects([])
    } finally {
      setIsLoading(false)
    }
  }, [page, debouncedSearch, filters])

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  const updateFilters = useCallback((newFilters: Partial<SubjectFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPage(1)
  }, [])

  return {
    subjects,
    isLoading,
    error,
    pagination,
    filters,
    setFilters: updateFilters,
    setPage,
    refetch: fetchSubjects,
  }
}

