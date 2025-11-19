import { GOZO_BOUNDS, MALTA_BOUNDS } from '@/config/constants'

/**
 * Check if coordinates are within Gozo bounds
 */
export function isInGozo(lat: number, lng: number): boolean {
  return (
    lat >= GOZO_BOUNDS.south &&
    lat <= GOZO_BOUNDS.north &&
    lng >= GOZO_BOUNDS.west &&
    lng <= GOZO_BOUNDS.east
  )
}

/**
 * Check if coordinates are within Malta main island bounds
 * (excludes Gozo even though it's technically part of Malta)
 */
export function isInMalta(lat: number, lng: number): boolean {
  return (
    lat >= MALTA_BOUNDS.south &&
    lat <= MALTA_BOUNDS.north &&
    lng >= MALTA_BOUNDS.west &&
    lng <= MALTA_BOUNDS.east &&
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
