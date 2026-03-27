"use client"

import { useState, useEffect, useCallback } from "react"
import api from "@/lib/api"
import { useDebounce } from "./useDebounce"

export interface TransportRouteFilters {
  search?: string
  status?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface UseTransportRoutesResult {
  routes: any[]
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
  filters: TransportRouteFilters
  setFilters: (filters: Partial<TransportRouteFilters>) => void
  setPage: (page: number) => void
  refetch: () => void
}

export function useTransportRoutes(initialFilters: TransportRouteFilters = {}) {
  const [routes, setRoutes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<TransportRouteFilters>(initialFilters)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })

  const debouncedSearch = useDebounce(filters.search || "", 300)

  const fetchRoutes = useCallback(async () => {
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

      const response = await api.get(`/transport/routes?${params.toString()}`)
      setRoutes(response.data.routes)
      setPagination(response.data.pagination)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch routes")
      setRoutes([])
    } finally {
      setIsLoading(false)
    }
  }, [page, debouncedSearch, filters])

  useEffect(() => {
    fetchRoutes()
  }, [fetchRoutes])

  const updateFilters = useCallback((newFilters: Partial<TransportRouteFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPage(1)
  }, [])

  return {
    routes,
    isLoading,
    error,
    pagination,
    filters,
    setFilters: updateFilters,
    setPage,
    refetch: fetchRoutes,
  }
}

