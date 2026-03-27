"use client"

import { useState, useEffect, useCallback } from "react"
import api from "@/lib/api"
import { useDebounce } from "./useDebounce"

export interface AnnouncementFilters {
  search?: string
  type?: string
  status?: string
  priority?: string
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface UseAnnouncementsResult {
  announcements: any[]
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
  filters: AnnouncementFilters
  setFilters: (filters: Partial<AnnouncementFilters>) => void
  setPage: (page: number) => void
  refetch: () => void
}

export function useAnnouncements(initialFilters: AnnouncementFilters = {}) {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<AnnouncementFilters>(initialFilters)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })

  const debouncedSearch = useDebounce(filters.search || "", 300)

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      })

      const response = await api.get(`/announcements?${params.toString()}`)
      setAnnouncements(response.data.announcements)
      setPagination(response.data.pagination)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch announcements")
      setAnnouncements([])
    } finally {
      setIsLoading(false)
    }
  }, [page, debouncedSearch, filters])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const updateFilters = useCallback((newFilters: Partial<AnnouncementFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPage(1)
  }, [])

  return {
    announcements,
    isLoading,
    error,
    pagination,
    filters,
    setFilters: updateFilters,
    setPage,
    refetch: fetchAnnouncements,
  }
}

