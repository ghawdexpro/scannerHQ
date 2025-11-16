// Malta-specific solar configuration
export const MALTA_CONFIG = {
  // Solar irradiance
  SOLAR_IRRADIANCE: 5.2, // kWh/m²/day average
  PEAK_SUN_HOURS: 5.2, // hours per day average
  ANNUAL_SUNSHINE_HOURS: 3000, // hours per year

  // Feed-in tariffs (EUR per kWh)
  GRANT_TARIFF: 0.105, // With government grant
  NO_GRANT_TARIFF: 0.15, // Without grant
  TARIFF_GUARANTEE_YEARS: 20, // Years guaranteed

  // Grant configuration
  MAX_GRANT_AMOUNT: 2400, // EUR
  GRANT_PERCENTAGE: 0.3, // 30% of installation cost

  // System specifications
  PANEL_WATTAGE: 400, // Watts per panel
  PANEL_WIDTH: 1.0, // meters
  PANEL_HEIGHT: 1.7, // meters
  PANEL_AREA: 1.7, // m²
  SYSTEM_EFFICIENCY: 0.80, // 80% efficiency
  PANEL_DEGRADATION_RATE: 0.005, // 0.5% per year
  PANEL_LIFETIME_YEARS: 25,

  // Installation costs
  COST_PER_KW: 1500, // EUR per kW installed
  MAINTENANCE_COST_YEARLY: 100, // EUR per year

  // Roof parameters
  OPTIMAL_PITCH: 30, // degrees
  OPTIMAL_AZIMUTH: 180, // degrees (south)
  MIN_ROOF_AREA: 20, // m²
  MIN_PANEL_COUNT: 6,
  USABLE_ROOF_PERCENTAGE: 0.75, // 75% typical usable area

  // Location bounds (Malta & Gozo)
  MALTA_BOUNDS: {
    north: 36.1,
    south: 35.8,
    east: 14.6,
    west: 14.1
  },

  // Gozo specific bounds
  GOZO_BOUNDS: {
    north: 36.1,
    south: 36.0,
    east: 14.35,
    west: 14.2
  },

  // Environmental factors
  CO2_OFFSET_FACTOR: 0.4, // kg CO2 per kWh
  TREE_EQUIVALENT: 25, // kg CO2 per tree per year
}

// Application configuration
export const APP_CONFIG = {
  // API timeouts (ms)
  API_TIMEOUT: 30000,
  ANALYSIS_TIMEOUT: 60000,

  // Cache durations (seconds)
  GEOCODING_CACHE: 2592000, // 30 days
  SATELLITE_IMAGE_CACHE: 7776000, // 90 days
  ANALYSIS_CACHE: 604800, // 7 days
  QUOTE_CACHE: 86400, // 1 day

  // Business rules
  QUOTE_VALIDITY_DAYS: 30,
  QUOTE_RESPONSE_HOURS: 3,
  MIN_QUOTE_AMOUNT: 3000, // EUR
  MAX_QUOTE_AMOUNT: 50000, // EUR

  // UI Configuration
  MAP_DEFAULT_ZOOM: 17,
  MAP_MAX_ZOOM: 21,
  MAP_MIN_ZOOM: 10,
  ANIMATION_DURATION: 300, // ms

  // File uploads
  MAX_IMAGE_SIZE: 5242880, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],

  // Rate limiting
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_ANALYSES_PER_DAY: 100,

  // Email configuration
  EMAIL_FROM: 'noreply@ghawdexengineering.com',
  EMAIL_REPLY_TO: 'info@ghawdexengineering.com',
  SUPPORT_EMAIL: 'support@ghawdexengineering.com',

  // Company info
  COMPANY_NAME: 'Ghawdex Engineering',
  COMPANY_PHONE: '+356 2156 0000', // Replace with actual
  COMPANY_ADDRESS: 'Malta', // Replace with actual
  COMPANY_WEBSITE: 'https://ghawdexengineering.com',
}

// Validation rules
export const VALIDATION = {
  PHONE_REGEX: /^(\+356)?[0-9]{8}$/, // Malta phone format
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  POSTCODE_REGEX: /^[A-Z]{3}\s?[0-9]{4}$/, // Malta postcode format
}

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'An error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  INVALID_ADDRESS: 'Please enter a valid address in Malta or Gozo.',
  GOZO_FALLBACK: 'Using AI analysis for Gozo location.',
  SOLAR_API_UNAVAILABLE: 'Solar data unavailable for this location. Using AI estimation.',
  QUOTA_EXCEEDED: 'Daily analysis limit reached. Please try again tomorrow.',
  INVALID_PHONE: 'Please enter a valid Malta phone number.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  QUOTE_EXPIRED: 'This quote has expired. Please request a new analysis.',
}

// Success messages
export const SUCCESS_MESSAGES = {
  ANALYSIS_COMPLETE: 'Solar analysis completed successfully!',
  QUOTE_SENT: 'Quote sent to your email.',
  LEAD_CAPTURED: 'Thank you! We\'ll contact you within 3 hours.',
  PDF_GENERATED: 'PDF report generated successfully.',
}

// SEO metadata
export const SEO_CONFIG = {
  title: 'Solar Scanner - Instant Solar Analysis for Malta & Gozo',
  description: 'Get instant solar panel quotes for your property in Malta and Gozo. AI-powered analysis, government grant calculations, and 20-year ROI projections.',
  keywords: 'solar panels malta, solar energy gozo, photovoltaic malta, solar installation, government grant solar malta',
  ogImage: '/images/og-image.jpg',
}

// Feature flags (can be overridden by env vars)
export const FEATURES = {
  ENABLE_GOZO_AI_FALLBACK: process.env.NEXT_PUBLIC_ENABLE_GOZO_AI_FALLBACK === 'true',
  ENABLE_3D_VISUALIZATION: process.env.NEXT_PUBLIC_ENABLE_3D_VISUALIZATION === 'true',
  ENABLE_WHATSAPP: process.env.NEXT_PUBLIC_ENABLE_WHATSAPP === 'true',
  ENABLE_LIVE_CHAT: false,
  ENABLE_ANALYTICS: !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
}

// API endpoints (relative to API base URL)
export const API_ROUTES = {
  ANALYZE: '/api/analyze',
  QUOTE: '/api/quote',
  LEAD: '/api/lead',
  GEOCODE: '/api/geocode',
  VALIDATE_ADDRESS: '/api/validate-address',
  GENERATE_PDF: '/api/generate-pdf',
  SEND_EMAIL: '/api/send-email',
}

// Local storage keys
export const STORAGE_KEYS = {
  RECENT_ANALYSES: 'solar_recent_analyses',
  USER_PREFERENCES: 'solar_user_preferences',
  DRAFT_QUOTE: 'solar_draft_quote',
}