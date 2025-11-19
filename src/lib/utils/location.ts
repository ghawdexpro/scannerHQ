import { MALTA_CONFIG } from '@/config/constants'

/**
 * Check if coordinates are within Gozo bounds
 */
export function isInGozo(lat: number, lng: number): boolean {
  const { north, south, east, west } = MALTA_CONFIG.GOZO_BOUNDS
  return (
    lat >= south &&
    lat <= north &&
    lng >= west &&
    lng <= east
  )
}

/**
 * Check if coordinates are within Malta main island bounds
 * (excludes Gozo even though it's technically part of Malta)
 */
export function isInMalta(lat: number, lng: number): boolean {
  const { north, south, east, west } = MALTA_CONFIG.MALTA_BOUNDS
  return (
    lat >= south &&
    lat <= north &&
    lng >= west &&
    lng <= east &&
    !isInGozo(lat, lng) // Exclude Gozo from Malta main island
  )
}

/**
 * Get location type for analysis routing
 */
export function getLocationType(lat: number, lng: number): 'malta' | 'gozo' | 'other' {
  if (isInGozo(lat, lng)) {
    return 'gozo'
  }
  if (isInMalta(lat, lng)) {
    return 'malta'
  }
  return 'other'
}
