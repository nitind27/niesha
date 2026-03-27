// State to Language Mapping for Indian States
export const STATE_LANGUAGE_MAP: Record<string, string> = {
  // States
  "Gujarat": "gu",
  "Maharashtra": "mr",
  "Rajasthan": "hi",
  "Punjab": "pa",
  "Tamil Nadu": "ta",
  "West Bengal": "bn",
  "Karnataka": "kn",
  "Telangana": "te",
  "Andhra Pradesh": "te",
  "Kerala": "ml",
  "Uttar Pradesh": "hi",
  "Madhya Pradesh": "hi",
  "Bihar": "hi",
  "Assam": "as",
  "Odisha": "or",
  "Jharkhand": "hi",
  "Chhattisgarh": "hi",
  "Haryana": "hi",
  "Delhi": "hi",
  "Himachal Pradesh": "hi",
  "Uttarakhand": "hi",
  "Jammu and Kashmir": "ks",
  "Manipur": "mni",
  "Meghalaya": "en", // No specific language, default to English
  "Mizoram": "en",
  "Nagaland": "en",
  "Tripura": "bn",
  "Sikkim": "ne",
  "Goa": "kok",
  "Arunachal Pradesh": "en",
  "Puducherry": "ta",
  "Dadra and Nagar Haveli and Daman and Diu": "gu",
  "Ladakh": "ks",
  "Chandigarh": "pa",
  
  // Alternative names and variations
  "Gujrat": "gu",
  "Maharastra": "mr",
  "Tamilnadu": "ta",
  "Andhra": "te",
  "Orissa": "or",
  "J&K": "ks",
  "JK": "ks",
}

// Get language code from state name
export function getLanguageFromState(state: string | null): string | null {
  if (!state) return null
  
  // Normalize state name
  const normalizedState = state.trim()
  
  // Direct match
  if (STATE_LANGUAGE_MAP[normalizedState]) {
    return STATE_LANGUAGE_MAP[normalizedState]
  }
  
  // Case-insensitive match
  const lowerState = normalizedState.toLowerCase()
  for (const [key, value] of Object.entries(STATE_LANGUAGE_MAP)) {
    if (key.toLowerCase() === lowerState) {
      return value
    }
  }
  
  // Partial match (for cases like "Gujarat State" or "State of Gujarat")
  for (const [key, value] of Object.entries(STATE_LANGUAGE_MAP)) {
    if (lowerState.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerState)) {
      return value
    }
  }
  
  return null
}

// Check if location is in India
export function isIndia(country: string | null): boolean {
  if (!country) return false
  const normalized = country.toLowerCase().trim()
  return normalized === "india" || normalized === "in" || normalized === "भारत"
}

