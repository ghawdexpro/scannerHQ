// API Request and Response types

// ============================================
// ANALYZE ENDPOINT
// ============================================

export interface AnalyzeRequest {
  address: string
  lat: number
  lng: number
}

export interface SolarAnalysisResult {
  panelsCount: number
  systemSize: number
  yearlyGeneration: number
  roofArea: number
  maxSunshineHours: number
  carbonOffsetYearly: number
  withGrant: FinancialMetrics
  withoutGrant: FinancialMetrics
  roofSegments: RoofSegment[]
}

export interface FinancialMetrics {
  installationCost: number
  grantAmount: number
  upfrontCost: number
  feedInTariff: number
  yearlyRevenue: number
  roiYears: number
  twentyYearSavings: number
  totalReturn: number
  projections: YearlyProjection[]
}

export interface YearlyProjection {
  year: number
  generation: number
  revenue: number
  cumulativeSavings: number
  degradationFactor: number
}

export interface RoofSegment {
  area: number
  pitch: number
  azimuth: number
  optimalForSolar: boolean
}

export interface AnalyzeResponse {
  success: boolean
  analysisId: string
  analysisType: 'google_solar' | 'ai_fallback'
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  analysis: SolarAnalysisResult
  timestamp: string
  expiresAt: string
}

export interface AnalyzeErrorResponse {
  success: false
  error: string
  message: string
  code: string
  timestamp: string
}

// ============================================
// LEAD ENDPOINT
// ============================================

export interface LeadRequest {
  name: string
  email: string
  phone: string
  address?: string
  source?: 'website' | 'referral' | 'advertisement' | 'other'
}

export interface LeadResponse {
  success: boolean
  leadId: string
  message: string
  timestamp: string
}

export interface LeadErrorResponse {
  success: false
  error: string
  message: string
  errors?: Record<string, string>
  timestamp: string
}

// ============================================
// QUOTE ENDPOINT
// ============================================

export interface QuoteRequest {
  analysisId: string
  withGrant: boolean
}

export interface QuoteResponse {
  success: boolean
  quoteId: string
  systemSize: number
  panelCount: number
  installationCost: number
  grantAmount: number
  upfrontCost: number
  feedInTariff: number
  yearlyRevenue: number
  roiYears: number
  twentyYearSavings: number
  expiresAt: string
  timestamp: string
}

export interface QuoteErrorResponse {
  success: false
  error: string
  message: string
  timestamp: string
}

// ============================================
// ERROR TYPES
// ============================================

export type ApiErrorCode =
  | 'INVALID_INPUT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'LOCATION_NOT_FOUND'
  | 'SOLAR_API_ERROR'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR'

export interface ApiError {
  code: ApiErrorCode
  message: string
  statusCode: number
  details?: Record<string, any>
}
