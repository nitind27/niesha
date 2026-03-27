"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

export interface SiteSettings {
  site_name: string
  site_tagline: string
  site_logo_url: string
  site_favicon_url: string
  site_primary_color: string
  site_footer_text: string
  support_email: string
  support_phone: string
  maintenance_mode: string
  allow_registration: string
}

const DEFAULTS: SiteSettings = {
  site_name: "Codeat ERP",
  site_tagline: "Multi-tenant ERP for schools, companies, trusts, and NGOs",
  site_logo_url: "",
  site_favicon_url: "",
  site_primary_color: "#3b82f6",
  site_footer_text: "© 2025 Codeat ERP. All rights reserved.",
  support_email: "support@codeat.in",
  support_phone: "",
  maintenance_mode: "false",
  allow_registration: "true",
}

const SiteSettingsContext = createContext<SiteSettings>(DEFAULTS)

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS)

  useEffect(() => {
    fetch("/api/admin/global-settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.settings) {
          const merged = { ...DEFAULTS, ...data.settings } as SiteSettings
          setSettings(merged)

          // Apply favicon dynamically
          if (merged.site_favicon_url) {
            let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
            if (!link) {
              link = document.createElement("link")
              link.rel = "icon"
              document.head.appendChild(link)
            }
            link.href = merged.site_favicon_url
          }

          // Apply page title
          if (merged.site_name) {
            document.title = merged.site_name
          }
        }
      })
      .catch(() => {}) // silently fall back to defaults
  }, [])

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
