"use client"

import { create } from "zustand"
import { useEffect } from "react"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  roleId: string
  schoolId?: string
  language: string
  avatar?: string
  permissions?: string[]
  school?: {
    id: string
    name: string
    organizationType: string
    industry: string | null
  } | null
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    set({ token })
    // Note: Token is stored in httpOnly cookie by server
    // We only use this state to track if user is authenticated
    // If token is null, clear any client-side auth state
    if (!token && typeof document !== "undefined") {
      // Token cleared, but httpOnly cookie is managed by server
      // This is just for client state management
    }
  },
  logout: async () => {
    // Clear client state first
    set({ user: null, token: null, isLoading: false })
    
    // Call logout API to clear server-side cookie
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
    }
    
    // Force redirect to login and clear any cached data
    if (typeof window !== "undefined") {
      // Clear all cookies (fallback)
      document.cookie = "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      // Force hard redirect to login
      window.location.href = "/login"
    }
  },
}))

export function useAuthInit() {
  const { setUser, setToken } = useAuth()

  useEffect(() => {
    // Skip if already initialized (token is set or user is loaded)
    // This prevents double-fetch when multiple layouts call useAuthInit
    const state = useAuth.getState()
    if (!state.isLoading) return

    // Always call /api/auth/me which reads httpOnly cookie server-side
    const fetchMe = () =>
      fetch("/api/auth/me", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })

    fetchMe()
      .then(async (res) => {
        if (res.status === 401 || res.status === 404) {
          await new Promise((r) => setTimeout(r, 200))
          const retry = await fetchMe()
          if (retry.ok) return retry.json()
          setToken(null)
          setUser(null)
          return null
        }
        if (!res.ok) {
          throw new Error("Failed to fetch user")
        }
        return res.json()
      })
      .then((data) => {
        if (data && data.user) {
          setUser(data.user)
          setToken("authenticated")
        } else if (data !== null) {
          setToken(null)
          setUser(null)
        }
      })
      .catch((error) => {
        console.error("Auth init error:", error)
        setToken(null)
        setUser(null)
      })
      .finally(() => {
        useAuth.setState({ isLoading: false })
      })
  }, [setUser, setToken])
}

