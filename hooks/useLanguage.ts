"use client"

import { create } from "zustand"
import { t, type LanguageCode, SUPPORTED_LANGUAGES } from "@/lib/i18n"
import { getLanguageFromState, isIndia } from "@/lib/state-language-map"

interface LanguageState {
  language: LanguageCode
  detectedLanguage: LanguageCode | null
  isAutoDetected: boolean
  setLanguage: (lang: LanguageCode) => void
  setDetectedLanguage: (lang: LanguageCode | null) => void
  translate: (key: string) => string
  getAvailableLanguages: () => Array<{ code: LanguageCode; name: string; flag: string }>
}

export const useLanguage = create<LanguageState>((set, get) => {
  // Initialize with default values
  const initialState: LanguageState = {
    language: "en",
    detectedLanguage: null,
    isAutoDetected: false,
    setLanguage: (lang) => {
      set({ language: lang, isAutoDetected: false })
      if (typeof window !== "undefined") {
        localStorage.setItem("language", lang)
        localStorage.setItem("isAutoDetected", "false")
      }
    },
    setDetectedLanguage: (lang) => {
      set({ detectedLanguage: lang })
      if (typeof window !== "undefined") {
        if (lang) {
          localStorage.setItem("detectedLanguage", lang)
        }
      }
    },
    translate: (key: string) => {
      const currentLang = get().language
      return t(key, currentLang)
    },
    getAvailableLanguages: () => {
      const { detectedLanguage } = get()
      // Always show English first
      const languages: Array<typeof SUPPORTED_LANGUAGES[number]> = [SUPPORTED_LANGUAGES.find(l => l.code === "en")!]
      
      // Get location from localStorage if available
      let stateBasedLanguage: string | null = null
      if (typeof window !== "undefined") {
        try {
          const storedLocation = localStorage.getItem("detectedLocation")
          if (storedLocation) {
            const location = JSON.parse(storedLocation)
            if (location.country && isIndia(location.country) && location.state) {
              stateBasedLanguage = getLanguageFromState(location.state)
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
      
      // Add state-based language as second option if available and not English
      if (stateBasedLanguage && stateBasedLanguage !== "en") {
        const stateLang = SUPPORTED_LANGUAGES.find(l => l.code === stateBasedLanguage)
        if (stateLang && !languages.find(l => l.code === stateBasedLanguage)) {
          languages.push(stateLang)
        }
      }
      
      // Add detected language if available and not already added
      if (detectedLanguage && detectedLanguage !== "en" && detectedLanguage !== stateBasedLanguage) {
        const detected = SUPPORTED_LANGUAGES.find(l => l.code === detectedLanguage)
        if (detected && !languages.find(l => l.code === detectedLanguage)) {
          languages.push(detected)
        }
      }
      
      return languages
    },
  }

  // Initialize from localStorage or detect
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("language")
    const storedDetected = localStorage.getItem("detectedLanguage")
    const isAutoDetected = localStorage.getItem("isAutoDetected") === "true"
    
    if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
      return {
        ...initialState,
        language: stored as LanguageCode,
        detectedLanguage: storedDetected as LanguageCode | null,
        isAutoDetected,
        translate: (key: string) => t(key, stored as LanguageCode),
      }
    }
  }

  return initialState
})

// Auto-detect language based on location
export function useAutoDetectLanguage() {
  const setDetectedLanguage = useLanguage((state) => state.setDetectedLanguage)
  const isAutoDetected = useLanguage((state) => state.isAutoDetected)
  
  const autoDetect = (state: string | null, country: string | null) => {
    // Only auto-detect on first visit
    if (typeof window === "undefined") return
    
    // Check if user has already selected a language
    const storedLanguage = localStorage.getItem("language")
    if (storedLanguage) {
      return // User has already selected a language
    }
    
    // Check if already detected
    const storedDetected = localStorage.getItem("detectedLanguage")
    if (storedDetected) {
      return // Already detected
    }
    
    if (!isIndia(country)) {
      return // Not in India, keep English
    }
    
    const detectedLang = getLanguageFromState(state)
    if (detectedLang && detectedLang !== "en") {
      setDetectedLanguage(detectedLang as LanguageCode)
      // Don't auto-switch, just mark as detected
      // User can manually select it
    }
  }
  
  return { autoDetect, isAutoDetected }
}

export function useTranslation() {
  const language = useLanguage((state) => state.language)
  const detectedLanguage = useLanguage((state) => state.detectedLanguage)
  const isAutoDetected = useLanguage((state) => state.isAutoDetected)
  const getAvailableLanguages = useLanguage((state) => state.getAvailableLanguages)
  const setLanguage = useLanguage((state) => state.setLanguage)
  
  // Create reactive translate function that updates when language changes
  const translate = (key: string) => {
    return t(key, language)
  }
  
  // Get available languages reactively
  const availableLanguages = getAvailableLanguages()
  
  return { 
    t: translate, 
    language, 
    setLanguage, 
    languages: SUPPORTED_LANGUAGES,
    availableLanguages,
    detectedLanguage,
    isAutoDetected,
  }
}

