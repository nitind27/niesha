// Global Theme Configuration System

export interface ThemeConfig {
  // Colors
  primaryColor: string
  secondaryColor?: string
  accentColor?: string
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  
  // Typography
  fontFamily: string
  fontSize: "small" | "medium" | "large"
  
  // Layout
  borderRadius: "none" | "small" | "medium" | "large"
  spacing: "compact" | "comfortable" | "spacious"
  
  // Appearance
  mode: "light" | "dark" | "auto"
}

export const defaultTheme: ThemeConfig = {
  primaryColor: "#2D5BFF", // Modern Admin - Royal Blue
  secondaryColor: "#36B37E", // Modern Admin - Soft Teal
  accentColor: "#E2E8F0", // Light Gray
  backgroundColor: "#FFFFFF", // Ice White
  borderColor: "#E2E8F0",
  textColor: "#212529",
  fontFamily: "Inter",
  fontSize: "medium",
  borderRadius: "medium",
  spacing: "comfortable",
  mode: "auto",
}

export const fontFamilies = [
  { name: "Inter", value: "Inter", category: "Sans Serif" },
  { name: "Roboto", value: "Roboto", category: "Sans Serif" },
  { name: "Poppins", value: "Poppins", category: "Sans Serif" },
  { name: "Open Sans", value: "Open Sans", category: "Sans Serif" },
  { name: "Lato", value: "Lato", category: "Sans Serif" },
  { name: "Montserrat", value: "Montserrat", category: "Sans Serif" },
  { name: "Playfair Display", value: "Playfair Display", category: "Serif" },
  { name: "Merriweather", value: "Merriweather", category: "Serif" },
  { name: "Lora", value: "Lora", category: "Serif" },
  { name: "Roboto Mono", value: "Roboto Mono", category: "Monospace" },
  { name: "Fira Code", value: "Fira Code", category: "Monospace" },
  { name: "Source Code Pro", value: "Source Code Pro", category: "Monospace" },
]

export const fontSizeOptions = [
  { name: "Small", value: "small", size: "14px" },
  { name: "Medium", value: "medium", size: "16px" },
  { name: "Large", value: "large", size: "18px" },
]

export const borderRadiusOptions = [
  { name: "None", value: "none", radius: "0px" },
  { name: "Small", value: "small", radius: "0.25rem" },
  { name: "Medium", value: "medium", radius: "0.5rem" },
  { name: "Large", value: "large", radius: "0.75rem" },
]

export const spacingOptions = [
  { name: "Compact", value: "compact", multiplier: 0.875 },
  { name: "Comfortable", value: "comfortable", multiplier: 1 },
  { name: "Spacious", value: "spacious", multiplier: 1.25 },
]

// Professional Color Scheme Presets
export interface ColorScheme {
  name: string
  description: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  borderColor?: string
  textColor?: string
}

export const professionalColorSchemes: ColorScheme[] = [
  {
    name: "Professional Academic",
    description: "Navy & Gold - Traditional, established, high-end",
    primaryColor: "#1A2B48", // Navy Blue
    secondaryColor: "#C5A059", // Muted Gold
    accentColor: "#6C757D", // Slate Gray
    backgroundColor: "#F8F9FA", // Off-White
    borderColor: "#E2E8F0",
    textColor: "#212529",
  },
  {
    name: "Modern Admin",
    description: "Royal Blue & Teal - Clean, efficient, modern SaaS look",
    primaryColor: "#2D5BFF", // Deep Royal Blue
    secondaryColor: "#36B37E", // Soft Teal
    accentColor: "#E2E8F0", // Light Gray
    backgroundColor: "#FFFFFF", // Ice White
    borderColor: "#E2E8F0",
    textColor: "#212529",
  },
  {
    name: "Trusted Educator",
    description: "Forest Green & Charcoal - Growth, stability, grounded",
    primaryColor: "#1B4332", // Deep Forest Green
    secondaryColor: "#B7E4C7", // Sage Green
    accentColor: "#FF8C00", // Bright Orange
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    textColor: "#212529", // Charcoal
  },
  {
    name: "Clean Minimalist",
    description: "Indigo & Sky - Approachable, friendly, modern",
    primaryColor: "#4F46E5", // Indigo
    secondaryColor: "#0EA5E9", // Sky Blue
    accentColor: "#DC2626", // Crimson
    backgroundColor: "#F9FAFB", // Ghost White
    borderColor: "#E2E8F0",
    textColor: "#212529",
  },
]

// Load theme from localStorage
export function loadTheme(): ThemeConfig {
  if (typeof window === "undefined") return defaultTheme
  
  try {
    const saved = localStorage.getItem("theme-config")
    if (saved) {
      return { ...defaultTheme, ...JSON.parse(saved) }
    }
  } catch (error) {
    console.error("Failed to load theme:", error)
  }
  
  return defaultTheme
}

// Save theme to localStorage
export function saveTheme(theme: ThemeConfig): void {
  if (typeof window === "undefined") return
  
  try {
    localStorage.setItem("theme-config", JSON.stringify(theme))
  } catch (error) {
    console.error("Failed to save theme:", error)
  }
}

// Apply theme to document
export function applyTheme(theme: ThemeConfig): void {
  if (typeof window === "undefined") return
  
  const root = document.documentElement
  
  // Apply colors
  const primaryHsl = hexToHsl(theme.primaryColor)
  root.style.setProperty("--primary", primaryHsl)
  
  if (theme.secondaryColor) {
    const secondaryHsl = hexToHsl(theme.secondaryColor)
    root.style.setProperty("--secondary", secondaryHsl)
  }
  
  if (theme.accentColor) {
    const accentHsl = hexToHsl(theme.accentColor)
    root.style.setProperty("--accent", accentHsl)
  }
  
  // Apply background color
  if (theme.backgroundColor) {
    const bgHsl = hexToHsl(theme.backgroundColor)
    root.style.setProperty("--background", bgHsl)
  }
  
  // Apply border color
  if (theme.borderColor) {
    const borderHsl = hexToHsl(theme.borderColor)
    root.style.setProperty("--border", borderHsl)
    root.style.setProperty("--input", borderHsl)
  }
  
  // Apply text color
  if (theme.textColor) {
    const textHsl = hexToHsl(theme.textColor)
    root.style.setProperty("--foreground", textHsl)
  }
  
  // Apply font family - map to CSS variables
  const fontVariableMap: Record<string, string> = {
    "Inter": "var(--font-inter), Inter, sans-serif",
    "Roboto": "var(--font-roboto), Roboto, sans-serif",
    "Poppins": "var(--font-poppins), Poppins, sans-serif",
    "Open Sans": "var(--font-open-sans), 'Open Sans', sans-serif",
    "Lato": "var(--font-lato), Lato, sans-serif",
    "Montserrat": "var(--font-montserrat), Montserrat, sans-serif",
    "Playfair Display": "var(--font-playfair), 'Playfair Display', serif",
    "Merriweather": "var(--font-merriweather), Merriweather, serif",
    "Lora": "var(--font-lora), Lora, serif",
    "Roboto Mono": "var(--font-roboto-mono), 'Roboto Mono', monospace",
    "Fira Code": "var(--font-fira-code), 'Fira Code', monospace",
    "Source Code Pro": "var(--font-source-code-pro), 'Source Code Pro', monospace",
  }
  
  const fontFamilyValue = fontVariableMap[theme.fontFamily] || `${theme.fontFamily}, sans-serif`
  root.style.setProperty("--font-family", fontFamilyValue)
  document.body.style.fontFamily = fontFamilyValue
  
  // Apply font size
  const fontSizeMap = {
    small: "14px",
    medium: "16px",
    large: "18px",
  }
  root.style.setProperty("--font-size-base", fontSizeMap[theme.fontSize])
  
  // Apply border radius
  const borderRadiusMap = {
    none: "0px",
    small: "0.25rem",
    medium: "0.5rem",
    large: "0.75rem",
  }
  root.style.setProperty("--radius", borderRadiusMap[theme.borderRadius])
  
  // Apply spacing
  const spacingMap = {
    compact: "0.875",
    comfortable: "1",
    spacious: "1.25",
  }
  root.style.setProperty("--spacing-multiplier", spacingMap[theme.spacing])
  
  // Apply mode (dark/light)
  if (theme.mode === "dark") {
    document.documentElement.classList.add("dark")
    document.documentElement.classList.remove("light")
  } else if (theme.mode === "light") {
    document.documentElement.classList.add("light")
    document.documentElement.classList.remove("dark")
  } else {
    // Auto mode - use system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    if (prefersDark) {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
    } else {
      document.documentElement.classList.add("light")
      document.documentElement.classList.remove("dark")
    }
  }
}

// Helper function to convert hex to HSL
function hexToHsl(hex: string): string {
  hex = hex.replace("#", "")
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

