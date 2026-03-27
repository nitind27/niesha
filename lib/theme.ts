// Theme management for multi-tenant SaaS

export interface SchoolTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl?: string
  faviconUrl?: string
  schoolName: string
}

export function applyTheme(theme: SchoolTheme) {
  if (typeof window === "undefined") return

  const root = document.documentElement

  // Convert hex to HSL for CSS variables
  const primaryHsl = hexToHsl(theme.primaryColor)
  const secondaryHsl = hexToHsl(theme.secondaryColor)
  const accentHsl = hexToHsl(theme.accentColor)

  root.style.setProperty("--primary", primaryHsl)
  root.style.setProperty("--secondary", secondaryHsl)
  root.style.setProperty("--accent", accentHsl)

  // Update favicon
  if (theme.faviconUrl) {
    const link = document.querySelector("link[rel='icon']") as HTMLLinkElement
    if (link) {
      link.href = theme.faviconUrl
    }
  }

  // Update page title
  if (theme.schoolName) {
    document.title = `${theme.schoolName} - Codeat ERP`
  }
}

function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace("#", "")

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export function getDefaultTheme(): SchoolTheme {
  return {
    primaryColor: "#3b82f6",
    secondaryColor: "#8b5cf6",
    accentColor: "#10b981",
    schoolName: "Codeat ERP",
  }
}

