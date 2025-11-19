import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

// Cache for loaded libraries
const libraryCache: { [key: string]: any } = {}
let isConfigured = false

// Configure Google Maps (only on client side)
const configureGoogleMaps = () => {
  if (!isConfigured && typeof window !== 'undefined') {
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      v: 'weekly'
    })
    isConfigured = true
  }
}

// Load Google Maps core library
export const loadGoogleMaps = async () => {
  try {
    if (typeof window === 'undefined') {
      throw new Error('Google Maps can only be loaded on the client side')
    }

    configureGoogleMaps()

    if (!libraryCache.core) {
      libraryCache.core = await importLibrary('core')
    }
    return window.google
  } catch (error) {
    console.error('Error loading Google Maps:', error)
    throw new Error('Failed to load Google Maps')
  }
}

// Load specific Google Maps library
export const loadLibrary = async (name: string) => {
  try {
    if (typeof window === 'undefined') {
      throw new Error('Google Maps can only be loaded on the client side')
    }

    configureGoogleMaps()

    if (!libraryCache[name]) {
      libraryCache[name] = await importLibrary(name as any)
    }
    return libraryCache[name]
  } catch (error) {
    console.error(`Error loading Google Maps ${name} library:`, error)
    throw new Error(`Failed to load Google Maps ${name} library`)
  }
}

// Geocode an address to get coordinates
export const geocodeAddress = async (address: string) => {
  const geocodingLib = await loadLibrary('geocoding')
  const geocoder = new geocodingLib.Geocoder()

  return new Promise<google.maps.GeocoderResult>((resolve, reject) => {
    geocoder.geocode({ address }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
      if (status === 'OK' && results && results[0]) {
        resolve(results[0])
      } else {
        reject(new Error(`Geocoding failed: ${status}`))
      }
    })
  })
}

// Validate if address is in Malta or Gozo
export const validateMaltaAddress = async (address: string): Promise<{
  isValid: boolean
  isGozo: boolean
  coordinates: { lat: number; lng: number } | null
  formattedAddress: string | null
}> => {
  try {
    const result = await geocodeAddress(address)
    const location = result.geometry.location

    // Get lat/lng values
    const lat = typeof location.lat === 'function' ? location.lat() : location.lat
    const lng = typeof location.lng === 'function' ? location.lng() : location.lng

    // Ensure lat and lng are numbers
    const latitude = Number(lat)
    const longitude = Number(lng)

    // Check if address is in Malta (including Gozo)
    const countryComponent = result.address_components.find(
      component => component.types.includes('country')
    )

    if (countryComponent?.short_name !== 'MT') {
      return { isValid: false, isGozo: false, coordinates: null, formattedAddress: null }
    }

    // Check if it's Gozo (rough coordinates for Gozo region)
    const isGozo = latitude > 36.0 && latitude < 36.1 && longitude > 14.2 && longitude < 14.35

    return {
      isValid: true,
      isGozo,
      coordinates: { lat: latitude, lng: longitude },
      formattedAddress: result.formatted_address
    }
  } catch (error) {
    console.error('Address validation error:', error)
    return { isValid: false, isGozo: false, coordinates: null, formattedAddress: null }
  }
}

// Get static map image URL
export const getStaticMapUrl = (
  lat: number,
  lng: number,
  options: {
    zoom?: number
    size?: string
    maptype?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'
    scale?: 1 | 2
  } = {}
) => {
  const {
    zoom = 20,
    size = '640x640',
    maptype = 'satellite',
    scale = 2
  } = options

  const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap'
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: zoom.toString(),
    size,
    maptype,
    scale: scale.toString(),
    // Use NEXT_PUBLIC key for client, fallback to server-side key for API routes
    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || ''
  })

  return `${baseUrl}?${params.toString()}`
}

// Initialize Places Autocomplete for address input
export const initializeAutocomplete = async (
  inputElement: HTMLInputElement,
  options: google.maps.places.AutocompleteOptions = {}
) => {
  const placesLib = await loadLibrary('places') as google.maps.PlacesLibrary

  const autocomplete = new placesLib.Autocomplete(inputElement, {
    componentRestrictions: { country: 'mt' }, // Restrict to Malta
    fields: ['address_components', 'geometry', 'formatted_address'],
    types: ['address'],
    ...options
  })

  return autocomplete
}

// Calculate distance between two points
export const calculateDistance = async (
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
) => {
  const [mapsLib, geometryLib] = await Promise.all([
    loadLibrary('maps'),
    loadLibrary('geometry')
  ])

  const p1 = new mapsLib.LatLng(point1.lat, point1.lng)
  const p2 = new mapsLib.LatLng(point2.lat, point2.lng)

  return geometryLib.spherical.computeDistanceBetween(p1, p2)
}

// Get bounds for Malta
export const getMaltaBounds = async () => {
  const mapsLib = await loadLibrary('maps')
  return new mapsLib.LatLngBounds(
    new mapsLib.LatLng(35.8, 14.1), // Southwest
    new mapsLib.LatLng(36.1, 14.6)  // Northeast
  )
}