"use client"

import { useState, useEffect, useCallback } from "react"
import api from "@/lib/api"
import { useDebounce } from "./useDebounce"

export interface FeeFilters {
  search?: string
  classId?: string
  status?: string
  frequency?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface UseFeesResult {
  fees: any[]
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
  filters: FeeFilters
  setFilters: (filters: Partial<FeeFilters>) => void
  setPage: (page: number) => void
  refetch: () => void
}

export function useFees(initialFilters: FeeFilters = {}) {
  const [fees, setFees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<FeeFilters>(initialFilters)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })

  const debouncedSearch = useDebounce(filters.search || "", 300)

  const fetchFees = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.frequency && { frequency: filters.frequency }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      })

      const response = await api.get(`/fees?${params.toString()}`)
      setFees(response.data.fees)
      setPagination(response.data.pagination)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch fees")
      setFees([])
    } finally {
      setIsLoading(false)
    }
  }, [page, debouncedSearch, filters])

  useEffect(() => {
    fetchFees()
  }, [fetchFees])

  const updateFilters = useCallback((newFilters: Partial<FeeFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPage(1)
  }, [])

  return {
    fees,
    isLoading,
    error,
    pagination,
    filters,
    setFilters: updateFilters,
    setPage,
    refetch: fetchFees,
  }
}

