'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { loadLibrary, validateMaltaAddress } from '@/lib/google/maps-service'
import { geocodeCache } from '@/lib/cache/geocode-cache'
import { ERROR_MESSAGES } from '@/config/constants'
import toast from 'react-hot-toast'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/** Validate coordinates are within reasonable bounds */
const isValidCoordinate = (lat: number, lng: number): boolean => {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    // Malta/Gozo bounds with buffer
    lat >= 35.7 &&
    lat <= 36.2 &&
    lng >= 14.0 &&
    lng <= 14.7
  )
}

interface InteractiveMapInputProps {
  onAddressSelect: (address: string, coordinates: { lat: number; lng: number }) => void
  isLoading?: boolean
}

export default function InteractiveMapInput({ onAddressSelect, isLoading = false }: InteractiveMapInputProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const isMapIdleRef = useRef(false)

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string
    coordinates: { lat: number; lng: number }
  } | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [showLocationPrompt, setShowLocationPrompt] = useState(true)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Handle fullscreen transitions and orientation changes
  useEffect(() => {
    if (map && isFullscreen) {
      // Trigger resize on next tick to let DOM settle
      const timer = setTimeout(() => {
        // Trigger resize event to ensure map adjusts to new container size
        google.maps.event.trigger(map, 'resize')
      }, 100)

      // Handle orientation change in fullscreen mode
      const handleOrientationChange = () => {
        setTimeout(() => {
          if (map && isFullscreen) {
            google.maps.event.trigger(map, 'resize')
          }
        }, 100)
      }

      window.addEventListener('orientationchange', handleOrientationChange)
      window.addEventListener('resize', handleOrientationChange)

      return () => {
        clearTimeout(timer)
        window.removeEventListener('orientationchange', handleOrientationChange)
        window.removeEventListener('resize', handleOrientationChange)
      }
    }
  }, [isFullscreen, map])

  // Request user's location
  const requestUserLocation = async (mapInstance: google.maps.Map) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser', { duration: 2000 })
      setShowLocationPrompt(false)
      setIsFullscreen(true)
      return
    }

    setIsGettingLocation(true)
    setIsFullscreen(true) // Enable fullscreen mode

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }

        // Center map on user location immediately and zoom in
        // Use setCenter instead of panTo for immediate, precise positioning
        mapInstance.setCenter(userLocation)
        mapInstance.setZoom(21) // Closer zoom for precise confirmation

        // Reverse geocode to get address
        try {
          const geocodingLib = await loadLibrary('geocoding')
          const geocoder = new geocodingLib.Geocoder()

          geocoder.geocode({ location: userLocation }, async (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
            if (status === 'OK' && results && results[0]) {
              const address = results[0].formatted_address
              try {
                await validateAndSetLocation(address, userLocation, mapInstance)
                toast.success('Location detected! Please confirm your exact property.')
              } catch (error) {
                console.error('Validation error:', error)
                toast.error('Error validating location. Please try selecting manually.', { duration: 2000 })
              }
            } else {
              toast.error('Could not find address for your location. Please select manually on the map.', { duration: 2000 })
            }
            setIsGettingLocation(false)
            setShowLocationPrompt(false)
          })
        } catch (error) {
          console.error('Geocoding error:', error)
          toast.error('Error finding your address. Please select manually on the map.', { duration: 2000 })
          setIsGettingLocation(false)
          setShowLocationPrompt(false)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        toast.error('Could not get your location. Please select manually on the map.', { duration: 2000 })
        setIsGettingLocation(false)
        setShowLocationPrompt(false)
      }
    )
  }

  // Initialize map on component mount
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return

      try {
        setIsInitializing(true)

        // Load only maps library
        await loadLibrary('maps')

        // Malta center coordinates
        const maltaCenter = { lat: 35.9, lng: 14.4 }

        // Create map with satellite view
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: maltaCenter,
          zoom: 11,
          mapTypeId: 'satellite',
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          isFractionalZoomEnabled: true,
          restriction: {
            latLngBounds: {
              north: 36.1,
              south: 35.8,
              east: 14.6,
              west: 14.1
            },
            strictBounds: false
          }
        })

        // Log to console for debugging
        console.log('Google Maps initialized:', mapInstance)
        console.log('Map center:', maltaCenter)
        console.log('Map zoom:', 11)

        setMap(mapInstance)

        // Add idle listener to track when map is ready for interactions
        mapInstance.addListener('idle', () => {
          isMapIdleRef.current = true
        })

        // Add click listener to map
        mapInstance.addListener('click', async (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            await handleMapClick(e.latLng, mapInstance)
          }
        })

        setIsInitializing(false)
      } catch (error) {
        console.error('Failed to initialize map:', error)
        toast.error('Failed to load map. Please refresh the page.', { duration: 3000 })
        setIsInitializing(false)
      }
    }

    initializeMap()
  }, [])


  // ============================================================================
  // SIMPLE INCREMENTAL ZOOM - USER-FRIENDLY LOCATION SELECTION
  // ============================================================================

  const handleMapClick = useCallback(async (latLng: google.maps.LatLng, mapInstance: google.maps.Map) => {
    const lat = latLng.lat()
    const lng = latLng.lng()

    // GUARD 1: Defer if map not idle
    if (!isMapIdleRef.current) {
      google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
        const deferredLatLng = new google.maps.LatLng(lat, lng)
        handleMapClick(deferredLatLng, mapInstance)
      })
      return
    }

    // GUARD 2: Validate coordinates
    if (!isValidCoordinate(lat, lng)) {
      toast.error(ERROR_MESSAGES.INVALID_ADDRESS, { duration: 2000 })
      return
    }

    // Get current zoom level
    const currentZoom = mapInstance.getZoom() || 11

    // GUARD 3: If not zoomed in enough, increment zoom by 3
    if (currentZoom < 18) {
      const nextZoom = Math.min(currentZoom + 3, 21)
      mapInstance.setOptions({
        center: { lat, lng },
        zoom: nextZoom
      })
      toast('Zoom in closer to select your exact property', {
        id: 'zoom-prompt',
        icon: '🔍',
        duration: 1000
      })
      return
    }

    // GUARD 4: We're zoomed in enough (zoom >= 18) - place pin and geocode
    setIsValidating(true)

    try {
      const geocodingLib = await loadLibrary('geocoding')
      const geocoder = new geocodingLib.Geocoder()

      geocoder.geocode({ location: latLng }, async (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results && results[0]) {
          const address = results[0].formatted_address
          geocodeCache.set(address, { lat, lng })
          await validateAndSetLocation(address, { lat, lng }, mapInstance)
        } else {
          toast.error('Could not find address for this location', { duration: 2000 })
          setIsValidating(false)
        }
      })
    } catch (error) {
      console.error('Geocoding error:', error)
      toast.error('Error finding address. Please try again.', { duration: 2000 })
      setIsValidating(false)
    }
  }, [])

  // Validate and set location with memoization
  const validateAndSetLocation = useCallback(async (
    address: string,
    coordinates: { lat: number; lng: number },
    mapInstance: google.maps.Map
  ) => {
    setIsValidating(true)

    try {
      const validation = await validateMaltaAddress(address)

      if (!validation.isValid) {
        toast.error(ERROR_MESSAGES.INVALID_ADDRESS, { duration: 2000 })
        setIsValidating(false)
        return
      }

      if (validation.isGozo) {
        toast.success('Gozo location detected - Using AI analysis', { duration: 4000 })
      }

      // IMPORTANT: Always use the exact click coordinates, not validation coordinates
      // Validation coordinates come from re-geocoding which can differ from the click point
      setSelectedLocation({
        address: validation.formattedAddress || address,
        coordinates: coordinates // Use exact click coordinates
      })

      // Center map on the EXACT pin location and zoom in
      // Use setCenter instead of panTo for immediate, precise positioning
      mapInstance.setCenter(coordinates)
      mapInstance.setZoom(21)

      // Update or create marker
      updateMarker(coordinates, mapInstance)

      setIsValidating(false)
    } catch (error) {
      console.error('Validation error:', error)
      toast.error('Error validating location. Please try again.', { duration: 2000 })
      setIsValidating(false)
    }
  }, [])

  // Update marker on map - ensures only ONE marker exists at a time
  const updateMarker = (coordinates: { lat: number; lng: number }, mapInstance: google.maps.Map) => {
    // Remove existing marker completely using ref (immediate access)
    if (markerRef.current) {
      markerRef.current.setMap(null)
      google.maps.event.clearInstanceListeners(markerRef.current) // Clean up all event listeners
      markerRef.current = null
    }

    // Create new marker
    const newMarker = new google.maps.Marker({
      position: coordinates,
      map: mapInstance,
      animation: google.maps.Animation.DROP,
      draggable: true,
      title: 'Selected Location'
    })

    // Handle marker drag - update location when dragged
    newMarker.addListener('dragend', async (e: google.maps.MapMouseEvent) => {
      if (e.latLng && mapInstance) {
        await handleMapClick(e.latLng, mapInstance)
      }
    })

    // Store in both ref (for immediate access) and state (for React updates)
    markerRef.current = newMarker
    setMarker(newMarker)
  }

  // Handle confirm button
  const handleConfirm = () => {
    if (selectedLocation) {
      onAddressSelect(selectedLocation.address, selectedLocation.coordinates)
    }
  }

  const isProcessing = isLoading || isValidating

  return (
    <div className={`w-full mx-auto ${isFullscreen ? 'fixed inset-0 z-50 max-w-none bg-black' : 'max-w-4xl'}`}>
      {/* Map Container */}
      <div className={`relative ${isFullscreen ? 'h-full' : ''}`}>
        {isInitializing && (
          <div className="absolute inset-0 bg-gray-100 rounded-2xl flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">Loading Google Maps...</p>
            </div>
          </div>
        )}

        {/* Location Permission Prompt */}
        {showLocationPrompt && !isInitializing && map && (
          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center z-20 p-4">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl">
              <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Find Your Property
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                We can use your current location to help you get started, or you can manually select your property on the map.
              </p>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => requestUserLocation(map)}
                  disabled={isGettingLocation}
                  className="w-full bg-blue-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-full text-sm sm:text-base font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 min-h-12"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      Detecting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                      Use My Current Location
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowLocationPrompt(false)
                    setIsFullscreen(true)
                  }}
                  className="w-full bg-gray-100 text-gray-700 px-4 sm:px-6 py-3 sm:py-4 rounded-full text-sm sm:text-base font-semibold hover:bg-gray-200 transition-colors min-h-12"
                >
                  Select Manually on Map
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        <div
          ref={mapRef}
          className={`w-full overflow-hidden ${isFullscreen ? 'h-screen rounded-none' : 'h-64 sm:h-80 md:h-[600px] rounded-2xl shadow-lg md:shadow-xl'}`}
        />
      </div>

      {/* Selected Location Panel */}
      {selectedLocation && (
        <div className={`bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-2 border-blue-100 ${isFullscreen ? 'fixed bottom-4 sm:bottom-6 left-4 sm:left-1/2 sm:-translate-x-1/2 right-4 sm:max-w-2xl z-50' : 'mt-4 sm:mt-6'}`}>
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase mb-1">
                Selected Location
              </h3>
              <p className="text-base sm:text-lg font-medium text-gray-900 mb-1 break-words">
                {selectedLocation.address}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 break-all">
                {selectedLocation.coordinates.lat.toFixed(6)}, {selectedLocation.coordinates.lng.toFixed(6)}
              </p>
            </div>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-shrink-0 w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-full text-sm sm:text-base font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 min-h-12"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">{isLoading ? 'Analyzing...' : 'Validating...'}</span>
                  <span className="sm:hidden">{isLoading ? 'Analyzing' : 'Validating'}</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Confirm & Analyze</span>
                  <span className="sm:hidden">Confirm</span>
                </>
              )}
            </button>
          </div>

          {/* Controls */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs sm:text-sm text-gray-600">
                📍 Drag marker to adjust location
              </p>
              <div className="flex gap-2">
                {isFullscreen && (
                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-full text-xs sm:text-sm font-semibold hover:bg-gray-700 transition-colors min-h-10"
                  >
                    Exit Fullscreen
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Helper Text - When No Location Selected */}
      {!selectedLocation && !isInitializing && !showLocationPrompt && (
        <div className="mt-4 text-center text-xs sm:text-sm text-gray-500 px-4">
          <p>Click on the satellite map to select your property</p>
          <p className="mt-1 text-xs">💡 Zoom in closer to select exact property</p>
        </div>
      )}
    </div>
  )
}
