"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/hooks/useLanguage"
import { useLocation } from "@/hooks/useLocation"
import { getLanguageFromState, isIndia } from "@/lib/state-language-map"
import { Button } from "@/components/ui/button"
import { Globe, ChevronDown, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface LanguageSelectorProps {
  variant?: "dropdown" | "inline"
  showSeeMore?: boolean
  className?: string
}

export function LanguageSelector({ 
  variant = "dropdown", 
  showSeeMore = true,
  className 
}: LanguageSelectorProps) {
  const { language, setLanguage, availableLanguages, languages, detectedLanguage } = useTranslation()
  const location = useLocation()
  const [showAllLanguages, setShowAllLanguages] = useState(false)
  const [stateBasedLanguage, setStateBasedLanguage] = useState<string | null>(null)
  
  // Detect state-based language on mount and when location changes
  useEffect(() => {
    if (location.country && isIndia(location.country) && location.state && !location.isLoading) {
      const langCode = getLanguageFromState(location.state)
      if (langCode && langCode !== "en") {
        setStateBasedLanguage(langCode)
      } else {
        setStateBasedLanguage(null)
      }
    } else {
      setStateBasedLanguage(null)
    }
  }, [location.country, location.state, location.isLoading])
  
  // Get available languages with state-based language included
  const getAvailableLanguagesWithState = () => {
    const baseLanguages = availableLanguages
    
    // If state-based language exists and is not already in the list, add it as second option
    if (stateBasedLanguage && stateBasedLanguage !== "en") {
      const stateLang = languages.find(l => l.code === stateBasedLanguage)
      if (stateLang && !baseLanguages.find(l => l.code === stateBasedLanguage)) {
        // Insert after English (first position)
        return [baseLanguages[0], stateLang, ...baseLanguages.slice(1)]
      }
    }
    
    return baseLanguages
  }
  
  const finalAvailableLanguages = getAvailableLanguagesWithState()
  
  // Debug: Log when detected language changes
  // useEffect(() => {
  //   console.log("Detected language:", detectedLanguage)
  //   console.log("Available languages:", availableLanguages)
  // }, [detectedLanguage, availableLanguages])

  const handleLanguageChange = (langCode: string) => {
    // Prevent any default behavior that might cause refresh
    setLanguage(langCode as any)
    setShowAllLanguages(false)
    
    // Add smooth transition effect without page refresh
    if (typeof document !== "undefined") {
      document.body.classList.add("language-transition")
      setTimeout(() => {
        document.body.classList.remove("language-transition")
      }, 300)
    }
    
    // Force a re-render of components using translations
    // This ensures all text updates without page refresh
    if (typeof window !== "undefined") {
      // Dispatch custom event to notify all components
      window.dispatchEvent(new CustomEvent("languageChanged", { 
        detail: { language: langCode } 
      }))
    }
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="flex gap-2">
          {finalAvailableLanguages.map((lang) => (
            <Button
              key={lang.code}
              variant={language === lang.code ? "default" : "outline"}
              size="sm"
              onClick={() => handleLanguageChange(lang.code)}
              className={cn(
                "transition-all duration-200",
                language === lang.code && "ring-2 ring-primary"
              )}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.name.split("(")[0].trim()}
            </Button>
          ))}
        </div>
        {showSeeMore && (
          <button
            onClick={() => setShowAllLanguages(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
          >
            See more languages →
          </button>
        )}
        
        {/* All Languages Modal */}
        <Dialog open={showAllLanguages} onOpenChange={setShowAllLanguages}>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Select Language
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-2 mt-4">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left",
                    "hover:bg-accent hover:border-primary",
                    language === lang.code 
                      ? "bg-accent border-primary ring-2 ring-primary" 
                      : "border-border"
                  )}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium">{lang.name}</div>
                    {detectedLanguage === lang.code && (
                      <div className="text-xs text-muted-foreground">Detected for your region</div>
                    )}
                  </div>
                  {language === lang.code && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Dropdown variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Quick Select
        </div>
        {finalAvailableLanguages.map((lang, index) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              "cursor-pointer transition-all",
              language === lang.code && "bg-accent"
            )}
          >
            <span className="mr-2">{lang.flag}</span>
            <span className="flex-1">{lang.name.split("(")[0].trim()}</span>
            {index === 0 && (
              <span className="ml-2 text-xs text-muted-foreground">(Default)</span>
            )}
            {stateBasedLanguage === lang.code && location.state && (
              <span className="ml-2 text-xs text-primary font-medium">({location.state})</span>
            )}
            {detectedLanguage === lang.code && index > 0 && detectedLanguage !== stateBasedLanguage && (
              <span className="ml-2 text-xs text-muted-foreground">(Detected)</span>
            )}
          </DropdownMenuItem>
        ))}
        {showSeeMore && finalAvailableLanguages.length < languages.length && (
          <>
            <div className="my-1 h-px bg-border" />
            <DropdownMenuItem
              onClick={() => setShowAllLanguages(true)}
              className="cursor-pointer"
            >
              <span className="mr-2">🌐</span>
              See more languages ({languages.length - finalAvailableLanguages.length} more)
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
      
      {/* All Languages Modal */}
      <Dialog open={showAllLanguages} onOpenChange={setShowAllLanguages}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Select Language
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 mt-4">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left",
                  "hover:bg-accent hover:border-primary",
                  language === lang.code 
                    ? "bg-accent border-primary ring-2 ring-primary" 
                    : "border-border"
                )}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1">
                  <div className="font-medium">{lang.name}</div>
                  {detectedLanguage === lang.code && (
                    <div className="text-xs text-muted-foreground">Detected for your region</div>
                  )}
                  {stateBasedLanguage === lang.code && location.state && (
                    <div className="text-xs text-primary font-medium">Based on {location.state}</div>
                  )}
                </div>
                {language === lang.code && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  )
}

