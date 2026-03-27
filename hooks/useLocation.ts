"use client"

import { useState, useEffect } from "react"

interface LocationData {
  country: string | null
  state: string | null
  city: string | null
  isLoading: boolean
  error: string | null
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData>({
    country: null,
    state: null,
    city: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    let isMounted = true

    const detectLocation = async () => {
      try {
        // Try Geolocation API first
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              if (!isMounted) return
              
              try {
                // Reverse geocoding using a free API
                const response = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
                )
                const data = await response.json()
                
                if (isMounted) {
                  setLocation({
                    country: data.countryName || null,
                    state: data.principalSubdivision || null,
                    city: data.city || null,
                    isLoading: false,
                    error: null,
                  })
                }
              } catch (err) {
                // Fallback to IP-based detection
                await detectByIP()
              }
            },
            async (error) => {
              // Permission denied or error - fallback to IP
              if (isMounted) {
                await detectByIP()
              }
            },
            { timeout: 5000, enableHighAccuracy: false }
          )
        } else {
          // Geolocation not supported - use IP
          await detectByIP()
        }
      } catch (err) {
        if (isMounted) {
          setLocation({
            country: null,
            state: null,
            city: null,
            isLoading: false,
            error: "Location detection failed",
          })
        }
      }
    }

    const detectByIP = async () => {
      try {
        // Use a free IP geolocation service
        const response = await fetch("https://ipapi.co/json/")
        const data = await response.json()
        
        if (isMounted) {
          setLocation({
            country: data.country_name || null,
            state: data.region || null,
            city: data.city || null,
            isLoading: false,
            error: data.error || null,
          })
        }
      } catch (err) {
        if (isMounted) {
          setLocation({
            country: null,
            state: null,
            city: null,
            isLoading: false,
            error: "IP-based detection failed",
          })
        }
      }
    }

    // Check if location was already detected
    const storedLocation = localStorage.getItem("detectedLocation")
    if (storedLocation) {
      try {
        const parsed = JSON.parse(storedLocation)
        if (isMounted) {
          setLocation({
            ...parsed,
            isLoading: false,
          })
        }
        return
      } catch {
        // Invalid stored data, continue with detection
      }
    }

    detectLocation()

    return () => {
      isMounted = false
    }
  }, [])

  // Save location to localStorage when detected
  useEffect(() => {
    if (location.country && !location.isLoading && !location.error) {
      localStorage.setItem("detectedLocation", JSON.stringify(location))
    }
  }, [location])

  return location
}

