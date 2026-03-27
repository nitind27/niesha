"use client"

import { useState, useEffect, useCallback } from "react"
import api from "@/lib/api"
import { useDebounce } from "./useDebounce"

export interface ClassFilters {
  search?: string
  status?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface UseClassesResult {
  classes: any[]
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
  filters: ClassFilters
  setFilters: (filters: Partial<ClassFilters>) => void
  setPage: (page: number) => void
  refetch: () => void
}

export function useClasses(initialFilters: ClassFilters = {}) {
  const [classes, setClasses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<ClassFilters>(initialFilters)
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

  const fetchClasses = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.status && { status: filters.status }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      })

      const response = await api.get(`/classes?${params.toString()}`)
      setClasses(response.data.classes)
      setPagination(response.data.pagination)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch classes")
      setClasses([])
    } finally {
      setIsLoading(false)
    }
  }, [page, debouncedSearch, filters])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  const updateFilters = useCallback((newFilters: Partial<ClassFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPage(1) // Reset to first page when filters change
  }, [])

  return {
    classes,
    isLoading,
    error,
    pagination,
    filters,
    setFilters: updateFilters,
    setPage,
    refetch: fetchClasses,
  }
}

