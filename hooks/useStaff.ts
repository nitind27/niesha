"use client"

import { useState, useEffect, useCallback } from "react"
import api from "@/lib/api"
import { useDebounce } from "./useDebounce"

export interface StaffFilters {
  search?: string
  status?: string
  designation?: string
  department?: string
  gender?: string
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface UseStaffResult {
  staff: any[]
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
  filters: StaffFilters
  setFilters: (filters: Partial<StaffFilters>) => void
  setPage: (page: number) => void
  refetch: () => void
}

export function useStaff(initialFilters: StaffFilters = {}) {
  const [staff, setStaff] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<StaffFilters>(initialFilters)
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

  const fetchStaff = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.status && { status: filters.status }),
        ...(filters.designation && { designation: filters.designation }),
        ...(filters.department && { department: filters.department }),
        ...(filters.gender && { gender: filters.gender }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      })

      const response = await api.get(`/staff?${params.toString()}`)
      setStaff(response.data.staff)
      setPagination(response.data.pagination)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch staff")
      setStaff([])
    } finally {
      setIsLoading(false)
    }
  }, [page, debouncedSearch, filters])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  const updateFilters = useCallback((newFilters: Partial<StaffFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPage(1) // Reset to first page when filters change
  }, [])

  return {
    staff,
    isLoading,
    error,
    pagination,
    filters,
    setFilters: updateFilters,
    setPage,
    refetch: fetchStaff,
  }
}

