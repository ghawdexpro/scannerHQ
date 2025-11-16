import { Loader } from '@googlemaps/js-api-loader'

// Initialize the Google Maps JavaScript API loader
const loader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  version: 'weekly',
  libraries: ['places', 'drawing', 'geometry', 'visualization']
})

// Load Google Maps API
export const loadGoogleMaps = async () => {
  try {
    await loader.load()
    return window.google
  } catch (error) {
    console.error('Error loading Google Maps:', error)
    throw new Error('Failed to load Google Maps')
  }
}

// Geocode an address to get coordinates
export const geocodeAddress = async (address: string) => {
  const google = await loadGoogleMaps()
  const geocoder = new google.maps.Geocoder()

  return new Promise<google.maps.GeocoderResult>((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
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
    const { lat, lng } = result.geometry.location

    // Check if address is in Malta (including Gozo)
    const countryComponent = result.address_components.find(
      component => component.types.includes('country')
    )

    if (countryComponent?.short_name !== 'MT') {
      return { isValid: false, isGozo: false, coordinates: null, formattedAddress: null }
    }

    // Check if it's Gozo (rough coordinates for Gozo region)
    const isGozo = lat() > 36.0 && lat() < 36.1 && lng() > 14.2 && lng() < 14.35

    return {
      isValid: true,
      isGozo,
      coordinates: { lat: lat(), lng: lng() },
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
    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
  })

  return `${baseUrl}?${params.toString()}`
}

// Initialize Places Autocomplete for address input
export const initializeAutocomplete = async (
  inputElement: HTMLInputElement,
  options: google.maps.places.AutocompleteOptions = {}
) => {
  const google = await loadGoogleMaps()

  const autocomplete = new google.maps.places.Autocomplete(inputElement, {
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
  const google = await loadGoogleMaps()
  const p1 = new google.maps.LatLng(point1.lat, point1.lng)
  const p2 = new google.maps.LatLng(point2.lat, point2.lng)

  return google.maps.geometry.spherical.computeDistanceBetween(p1, p2)
}

// Get bounds for Malta
export const getMaltaBounds = async () => {
  const google = await loadGoogleMaps()
  return new google.maps.LatLngBounds(
    new google.maps.LatLng(35.8, 14.1), // Southwest
    new google.maps.LatLng(36.1, 14.6)  // Northeast
  )
}