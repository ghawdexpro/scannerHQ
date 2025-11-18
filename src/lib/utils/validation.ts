import { VALIDATION, MALTA_CONFIG } from '@/config/constants'

/**
 * Input validation and sanitization utilities
 * Prevents XSS, injection attacks, and validates Malta-specific formats
 */

/**
 * Sanitize string input - removes potentially harmful characters
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return ''

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets to prevent XSS
    .replace(/[^\w\s.,\-@/()]/g, '') // Allow only safe characters
    .substring(0, 500) // Limit length
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return ''

  return email
    .trim()
    .toLowerCase()
    .replace(/[^\w@.\-+]/g, '')
    .substring(0, 254) // Max email length per RFC
}

/**
 * Sanitize phone number for Malta format
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return ''

  // Remove all non-digit characters except +
  return phone
    .trim()
    .replace(/[^\d+]/g, '')
    .substring(0, 15)
}

/**
 * Sanitize address - allow common address characters
 */
export function sanitizeAddress(address: string): string {
  if (!address || typeof address !== 'string') return ''

  return address
    .trim()
    .replace(/[<>]/g, '')
    .replace(/[^\w\s.,\-/()]/g, '')
    .substring(0, 200)
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false

  const sanitized = sanitizeEmail(email)
  return VALIDATION.EMAIL_REGEX.test(sanitized) && sanitized.length >= 5
}

/**
 * Validate Malta phone number
 */
export function isValidMaltaPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false

  const sanitized = sanitizePhone(phone)
  return VALIDATION.PHONE_REGEX.test(sanitized)
}

/**
 * Validate Malta postcode
 */
export function isValidMaltaPostcode(postcode: string): boolean {
  if (!postcode || typeof postcode !== 'string') return false

  const sanitized = postcode.trim().toUpperCase()
  return VALIDATION.POSTCODE_REGEX.test(sanitized)
}

/**
 * Validate coordinates are within Malta/Gozo bounds
 */
export function isValidMaltaCoordinates(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false
  if (isNaN(lat) || isNaN(lng)) return false

  const { north, south, east, west } = MALTA_CONFIG.MALTA_BOUNDS

  // Check if coordinates are within Malta bounds (includes both Malta and Gozo)
  return lat >= south && lat <= north && lng >= west && lng <= east
}

/**
 * Validate number is within safe range
 */
export function isValidNumber(
  value: unknown,
  min: number = -Infinity,
  max: number = Infinity
): boolean {
  if (typeof value !== 'number') return false
  if (isNaN(value) || !isFinite(value)) return false
  return value >= min && value <= max
}

/**
 * Sanitize and validate analysis parameters
 */
export interface AnalysisParams {
  address: string
  lat: number
  lng: number
}

export function validateAnalysisParams(params: unknown): {
  valid: boolean
  data?: AnalysisParams
  errors: string[]
} {
  const errors: string[] = []

  if (!params || typeof params !== 'object') {
    return { valid: false, errors: ['Invalid parameters'] }
  }

  const { address, lat, lng } = params as any

  // Validate address
  if (!address || typeof address !== 'string') {
    errors.push('Address is required')
  } else if (address.length < 5) {
    errors.push('Address is too short')
  }

  // Validate coordinates
  if (!isValidNumber(lat, -90, 90)) {
    errors.push('Invalid latitude')
  }

  if (!isValidNumber(lng, -180, 180)) {
    errors.push('Invalid longitude')
  }

  if (lat && lng && !isValidMaltaCoordinates(lat, lng)) {
    errors.push('Coordinates must be within Malta or Gozo')
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return {
    valid: true,
    data: {
      address: sanitizeAddress(address),
      lat: Number(lat),
      lng: Number(lng)
    },
    errors: []
  }
}

/**
 * Sanitize and validate lead data
 */
export interface LeadData {
  name: string
  email: string
  phone: string
  address?: string
  source: 'website' | 'referral' | 'advertisement' | 'other'
}

export function validateLeadData(data: unknown): {
  valid: boolean
  data?: LeadData
  errors: string[]
} {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid data'] }
  }

  const { name, email, phone, address, source } = data as any

  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Valid name is required')
  }

  // Validate email
  if (!isValidEmail(email)) {
    errors.push('Valid email address is required')
  }

  // Validate phone
  if (!isValidMaltaPhone(phone)) {
    errors.push('Valid Malta phone number is required (+356 or 8 digits)')
  }

  // Validate source
  const validSources = ['website', 'referral', 'advertisement', 'other']
  if (!validSources.includes(source)) {
    errors.push('Invalid source')
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return {
    valid: true,
    data: {
      name: sanitizeString(name),
      email: sanitizeEmail(email),
      phone: sanitizePhone(phone),
      address: address ? sanitizeAddress(address) : undefined,
      source: source as LeadData['source']
    },
    errors: []
  }
}

/**
 * Prevent SQL injection by escaping special characters
 * Note: Use parameterized queries with Supabase instead when possible
 */
export function escapeSQLString(input: string): string {
  if (!input || typeof input !== 'string') return ''

  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
}

/**
 * Validate file upload (for future PDF uploads, images, etc.)
 */
export function validateFileUpload(
  file: File,
  maxSizeMB: number = 5,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!file) {
    return { valid: false, errors: ['No file provided'] }
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    errors.push(`File size must be less than ${maxSizeMB}MB`)
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`)
  }

  // Check file name for malicious patterns
  const filename = file.name
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    errors.push('Invalid filename')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Sanitize HTML to prevent XSS
 * For user-generated content that needs to be displayed
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') return ''

  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validate and sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return ''

  return query
    .trim()
    .replace(/[<>]/g, '')
    .replace(/[^\w\s\-,.]/g, '')
    .substring(0, 100)
}
