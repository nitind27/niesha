"use client"

import { useState, useEffect } from "react"
import { Palette, Sparkles, Type, Layout, Moon, Sun, Monitor, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  ThemeConfig, 
  loadTheme, 
  saveTheme, 
  applyTheme, 
  defaultTheme,
  fontFamilies,
  fontSizeOptions,
  borderRadiusOptions,
  spacingOptions,
  professionalColorSchemes,
  ColorScheme
} from "@/lib/theme-config"

const presetColors = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Green", value: "#10b981" },
  { name: "Pink", value: "#ec4899" },
  { name: "Orange", value: "#f97316" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Red", value: "#ef4444" },
  { name: "Yellow", value: "#eab308" },
]

export function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme)
  const [expandedSections, setExpandedSections] = useState({
    presets: true,
    colors: false,
    typography: false,
    layout: false,
    appearance: false,
  })

  useEffect(() => {
    // Load saved theme
    const savedTheme = loadTheme()
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  const updateTheme = (updates: Partial<ThemeConfig>) => {
    const newTheme = { ...theme, ...updates }
    setTheme(newTheme)
    applyTheme(newTheme)
    saveTheme(newTheme)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <>
      {/* Floating Theme Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-[9999] h-12 w-12 md:h-14 md:w-14 rounded-full shadow-2xl",
          "bg-primary hover:bg-primary/90 text-white",
          "transition-all duration-300 hover:scale-110 active:scale-95",
          "flex items-center justify-center group",
          "animate-pulse-slow"
        )}
        style={{
          boxShadow: `0 10px 40px -10px ${theme.primaryColor}40, 0 0 20px ${theme.primaryColor}20`,
        }}
      >
        <Palette className="h-5 w-5 md:h-6 md:w-6 group-hover:rotate-180 transition-transform duration-500" />
        <span className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium pointer-events-none">
          Theme
        </span>
      </Button>

      {/* Theme Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div
            className={cn(
              "fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-[9999]",
              "w-[calc(100vw-2rem)] max-w-96 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6",
              "shadow-2xl animate-in slide-in-from-right-5 duration-300",
              "transform transition-all max-h-[90vh] overflow-y-auto scrollbar-hide"
            )}
            style={{
              marginTop: "80px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-6 sticky top-0 bg-slate-900/95 pb-4 border-b border-white/10">
              <div className="p-2 rounded-lg bg-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Theme Settings</h3>
                <p className="text-xs text-slate-400">Customize your experience</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-slate-400 hover:text-white"
              >
                ×
              </Button>
            </div>

            {/* Professional Presets Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection("presets")}
                className="w-full flex items-center justify-between mb-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-white">Professional Themes</p>
                </div>
                {expandedSections.presets ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>
              
              {expandedSections.presets && (
                <div className="space-y-3 pl-6">
                  {professionalColorSchemes.map((scheme) => {
                    const isActive = theme.primaryColor === scheme.primaryColor
                    return (
                      <button
                        key={scheme.name}
                        onClick={() => {
                          updateTheme({
                            primaryColor: scheme.primaryColor,
                            secondaryColor: scheme.secondaryColor,
                            accentColor: scheme.accentColor,
                            backgroundColor: scheme.backgroundColor,
                            borderColor: scheme.borderColor,
                            textColor: scheme.textColor,
                          })
                        }}
                        className={cn(
                          "w-full p-3 rounded-lg border transition-all text-left group",
                          "hover:scale-[1.02] hover:border-primary/50",
                          isActive
                            ? "bg-primary/20 border-primary ring-2 ring-primary/30"
                            : "bg-slate-800/50 border-white/10 hover:bg-slate-800"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <div className="flex gap-1">
                              <div
                                className="w-5 h-5 rounded border-2 border-white/30 shadow-sm"
                                style={{ backgroundColor: scheme.primaryColor }}
                                title="Primary"
                              />
                              <div
                                className="w-5 h-5 rounded border-2 border-white/30 shadow-sm"
                                style={{ backgroundColor: scheme.secondaryColor }}
                                title="Secondary"
                              />
                            </div>
                            <div className="flex gap-1">
                              <div
                                className="w-5 h-5 rounded border-2 border-white/30 shadow-sm"
                                style={{ backgroundColor: scheme.accentColor }}
                                title="Accent"
                              />
                              <div
                                className="w-5 h-5 rounded border-2 border-white/30 shadow-sm"
                                style={{ backgroundColor: scheme.backgroundColor }}
                                title="Background"
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-white">{scheme.name}</p>
                              {isActive && (
                                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                              )}
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{scheme.description}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Colors Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection("colors")}
                className="w-full flex items-center justify-between mb-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-white">Custom Colors</p>
                </div>
                {expandedSections.colors ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>
              
              {expandedSections.colors && (
                <div className="space-y-4 pl-6">
                  {/* Primary Color */}
                  <div>
                    <p className="text-xs font-medium text-slate-300 mb-2">Primary Color</p>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {presetColors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => updateTheme({ primaryColor: color.value })}
                          className={cn(
                            "h-10 w-full rounded-lg transition-all duration-300",
                            "hover:scale-110 hover:ring-2 hover:ring-white/20",
                            "relative group"
                          )}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        >
                          {theme.primaryColor === color.value && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-5 w-5 rounded-full bg-white/90 flex items-center justify-center">
                                <svg className="h-3 w-3 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.primaryColor}
                        onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                        className="h-10 w-full rounded-lg cursor-pointer border border-white/10 bg-slate-800"
                      />
                      <div
                        className="h-10 w-10 rounded-lg border-2 border-white/20 flex-shrink-0"
                        style={{ backgroundColor: theme.primaryColor }}
                      />
                    </div>
                  </div>
                  
                  {/* Secondary Color */}
                  <div>
                    <p className="text-xs font-medium text-slate-300 mb-2">Secondary Color</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.secondaryColor || "#8b5cf6"}
                        onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                        className="h-10 w-full rounded-lg cursor-pointer border border-white/10 bg-slate-800"
                      />
                      <div
                        className="h-10 w-10 rounded-lg border-2 border-white/20 flex-shrink-0"
                        style={{ backgroundColor: theme.secondaryColor || "#8b5cf6" }}
                      />
                    </div>
                  </div>
                  
                  {/* Accent Color */}
                  <div>
                    <p className="text-xs font-medium text-slate-300 mb-2">Accent Color</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.accentColor || "#10b981"}
                        onChange={(e) => updateTheme({ accentColor: e.target.value })}
                        className="h-10 w-full rounded-lg cursor-pointer border border-white/10 bg-slate-800"
                      />
                      <div
                        className="h-10 w-10 rounded-lg border-2 border-white/20 flex-shrink-0"
                        style={{ backgroundColor: theme.accentColor || "#10b981" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Typography Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection("typography")}
                className="w-full flex items-center justify-between mb-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-white">Typography</p>
                </div>
                {expandedSections.typography ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>
              
              {expandedSections.typography && (
                <div className="space-y-4 pl-6">
                  {/* Font Family */}
                  <div>
                    <p className="text-xs font-medium text-slate-300 mb-2">Font Family</p>
                    <select
                      value={theme.fontFamily}
                      onChange={(e) => updateTheme({ fontFamily: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {fontFamilies.map((font) => (
                        <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                          {font.name} ({font.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Font Size */}
                  <div>
                    <p className="text-xs font-medium text-slate-300 mb-2">Font Size</p>
                    <div className="grid grid-cols-3 gap-2">
                      {fontSizeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updateTheme({ fontSize: option.value as "small" | "medium" | "large" })}
                          className={cn(
                            "h-10 px-3 rounded-lg border transition-all",
                            theme.fontSize === option.value
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-slate-800 border-white/10 text-slate-300 hover:border-white/20"
                          )}
                        >
                          <span className="text-xs font-medium">{option.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Layout Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection("layout")}
                className="w-full flex items-center justify-between mb-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-white">Layout</p>
                </div>
                {expandedSections.layout ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>
              
              {expandedSections.layout && (
                <div className="space-y-4 pl-6">
                  {/* Border Radius */}
                  <div>
                    <p className="text-xs font-medium text-slate-300 mb-2">Border Radius</p>
                    <div className="grid grid-cols-4 gap-2">
                      {borderRadiusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updateTheme({ borderRadius: option.value as "none" | "small" | "medium" | "large" })}
                          className={cn(
                            "h-10 px-2 rounded-lg border transition-all flex items-center justify-center",
                            theme.borderRadius === option.value
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-slate-800 border-white/10 text-slate-300 hover:border-white/20"
                          )}
                          title={option.name}
                        >
                          <div
                            className="w-6 h-6 border-2 border-current"
                            style={{ borderRadius: option.radius }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spacing */}
                  <div>
                    <p className="text-xs font-medium text-slate-300 mb-2">Spacing</p>
                    <div className="grid grid-cols-3 gap-2">
                      {spacingOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updateTheme({ spacing: option.value as "compact" | "comfortable" | "spacious" })}
                          className={cn(
                            "h-10 px-3 rounded-lg border transition-all",
                            theme.spacing === option.value
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-slate-800 border-white/10 text-slate-300 hover:border-white/20"
                          )}
                        >
                          <span className="text-xs font-medium">{option.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Appearance Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection("appearance")}
                className="w-full flex items-center justify-between mb-3 text-left"
              >
                <div className="flex items-center gap-2">
                  {theme.mode === "dark" ? (
                    <Moon className="h-4 w-4 text-primary" />
                  ) : theme.mode === "light" ? (
                    <Sun className="h-4 w-4 text-primary" />
                  ) : (
                    <Monitor className="h-4 w-4 text-primary" />
                  )}
                  <p className="text-sm font-semibold text-white">Appearance</p>
                </div>
                {expandedSections.appearance ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>
              
              {expandedSections.appearance && (
                <div className="pl-6">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => updateTheme({ mode: "light" })}
                      className={cn(
                        "h-12 px-3 rounded-lg border transition-all flex flex-col items-center justify-center gap-1",
                        theme.mode === "light"
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-slate-800 border-white/10 text-slate-300 hover:border-white/20"
                      )}
                    >
                      <Sun className="h-5 w-5" />
                      <span className="text-xs font-medium">Light</span>
                    </button>
                    <button
                      onClick={() => updateTheme({ mode: "dark" })}
                      className={cn(
                        "h-12 px-3 rounded-lg border transition-all flex flex-col items-center justify-center gap-1",
                        theme.mode === "dark"
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-slate-800 border-white/10 text-slate-300 hover:border-white/20"
                      )}
                    >
                      <Moon className="h-5 w-5" />
                      <span className="text-xs font-medium">Dark</span>
                    </button>
                    <button
                      onClick={() => updateTheme({ mode: "auto" })}
                      className={cn(
                        "h-12 px-3 rounded-lg border transition-all flex flex-col items-center justify-center gap-1",
                        theme.mode === "auto"
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-slate-800 border-white/10 text-slate-300 hover:border-white/20"
                      )}
                    >
                      <Monitor className="h-5 w-5" />
                      <span className="text-xs font-medium">Auto</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Magic Effect Indicator */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                <span>Changes applied instantly!</span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
