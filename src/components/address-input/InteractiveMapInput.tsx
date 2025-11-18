'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { loadLibrary, validateMaltaAddress } from '@/lib/google/maps-service'
import { ERROR_MESSAGES } from '@/config/constants'
import toast from 'react-hot-toast'

interface InteractiveMapInputProps {
  onAddressSelect: (address: string, coordinates: { lat: number; lng: number }) => void
  isLoading?: boolean
}

export default function InteractiveMapInput({ onAddressSelect, isLoading = false }: InteractiveMapInputProps) {
  const mapRef = useRef<HTMLDivElement>(null)
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
  const [isRotating, setIsRotating] = useState(false)
  const animationFrameRef = useRef<number | null>(null)

  // Start 3D rotation animation around the building
  const start3DRotation = (mapInstance: google.maps.Map, center: { lat: number; lng: number }) => {
    setIsRotating(true)

    // Switch to hybrid for better 3D building visibility
    mapInstance.setMapTypeId('hybrid')

    // Log for debugging
    console.log('Starting 3D rotation at:', center)
    console.log('Current map type:', mapInstance.getMapTypeId())

    // Use moveCamera for better 3D support
    let heading = 0

    // First move to 3D view
    mapInstance.moveCamera({
      center: center,
      zoom: 20, // Zoom level that supports 3D buildings
      tilt: 67.5,
      heading: 0
    })

    console.log('Moved camera to 3D view - tilt:', mapInstance.getTilt(), 'heading:', mapInstance.getHeading())

    // Then start rotation after map settles
    const rotate = () => {
      heading = (heading + 1) % 360 // Rotate 1 degree per frame for smoother animation

      mapInstance.moveCamera({
        center: center,
        zoom: 20,
        tilt: 67.5,
        heading: heading
      })

      animationFrameRef.current = requestAnimationFrame(rotate)
    }

    // Wait for map to settle into 3D mode
    setTimeout(rotate, 1000)
  }

  // Stop 3D rotation animation
  const stop3DRotation = (mapInstance?: google.maps.Map) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Reset to top-down view if map instance provided
    if (mapInstance) {
      mapInstance.setTilt(0)
      mapInstance.setHeading(0)
      mapInstance.setMapTypeId('satellite')
    }

    setIsRotating(false)
  }

  // Request user's location
  const requestUserLocation = async (mapInstance: google.maps.Map) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
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

        // Center map on user location and zoom in with smooth animation
        mapInstance.panTo(userLocation)

        // Smoothly zoom in to the location
        setTimeout(() => {
          mapInstance.setZoom(21) // Closer zoom for precise confirmation (same as 3D view)
        }, 500)

        // Reverse geocode to get address
        try {
          const geocodingLib = await loadLibrary('geocoding')
          const geocoder = new geocodingLib.Geocoder()

          geocoder.geocode({ location: userLocation }, async (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
            if (status === 'OK' && results && results[0]) {
              const address = results[0].formatted_address
              // Don't start 3D animation yet - just set location and ask for confirmation
              await validateAndSetLocation(address, userLocation, mapInstance, false)
              toast.success('Location detected! Please confirm your exact property.')
            }
          })
        } catch (error) {
          console.error('Geocoding error:', error)
        }

        setIsGettingLocation(false)
        setShowLocationPrompt(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        toast.error('Could not get your location. Please select manually on the map.')
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

        // Create map with satellite/hybrid view and 3D support
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: maltaCenter,
          zoom: 11,
          mapTypeId: 'satellite',
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          tilt: 0,
          heading: 0,
          rotateControl: true,
          // Additional 3D support options
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

        // Log map capabilities
        console.log('Map initialized with 3D support')
        console.log('Tilt enabled:', mapInstance.getTilt())
        console.log('Heading enabled:', mapInstance.getHeading())

        // Log to console for debugging
        console.log('Google Maps initialized:', mapInstance)
        console.log('Map center:', maltaCenter)
        console.log('Map zoom:', 11)

        setMap(mapInstance)

        // Add click listener to map
        mapInstance.addListener('click', async (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            await handleMapClick(e.latLng, mapInstance)
          }
        })

        setIsInitializing(false)
      } catch (error) {
        console.error('Failed to initialize map:', error)
        toast.error('Failed to load map. Please refresh the page.')
        setIsInitializing(false)
      }
    }

    initializeMap()
  }, [])

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Handle map click
  const handleMapClick = async (latLng: google.maps.LatLng, mapInstance: google.maps.Map) => {
    const lat = latLng.lat()
    const lng = latLng.lng()

    setIsValidating(true)

    try {
      // Reverse geocode to get address
      const geocodingLib = await loadLibrary('geocoding')
      const geocoder = new geocodingLib.Geocoder()

      geocoder.geocode({ location: latLng }, async (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results && results[0]) {
          const address = results[0].formatted_address
          await validateAndSetLocation(address, { lat, lng }, mapInstance)
        } else {
          toast.error('Could not find address for this location')
          setIsValidating(false)
        }
      })
    } catch (error) {
      console.error('Geocoding error:', error)
      toast.error('Error finding address. Please try again.')
      setIsValidating(false)
    }
  }

  // Validate and set location
  const validateAndSetLocation = async (
    address: string,
    coordinates: { lat: number; lng: number },
    mapInstance: google.maps.Map,
    autoStart3D: boolean = true // Only start 3D animation if explicitly requested
  ) => {
    setIsValidating(true)

    try {
      const validation = await validateMaltaAddress(address)

      if (!validation.isValid) {
        toast.error(ERROR_MESSAGES.INVALID_ADDRESS)
        setIsValidating(false)
        return
      }

      if (validation.isGozo) {
        toast.success('Gozo location detected - Using AI analysis', { duration: 4000 })
      }

      const validCoords = validation.coordinates || coordinates

      setSelectedLocation({
        address: validation.formattedAddress || address,
        coordinates: validCoords
      })

      // Update or create marker
      updateMarker(validCoords, mapInstance)

      // Only start 3D rotation animation if autoStart3D is true
      if (autoStart3D) {
        start3DRotation(mapInstance, validCoords)
      }

      setIsValidating(false)
    } catch (error) {
      console.error('Validation error:', error)
      toast.error('Error validating location. Please try again.')
      setIsValidating(false)
    }
  }

  // Update marker on map - ensures only ONE marker exists at a time
  const updateMarker = (coordinates: { lat: number; lng: number }, mapInstance: google.maps.Map) => {
    // Remove existing marker completely
    if (marker) {
      marker.setMap(null)
      google.maps.event.clearInstanceListeners(marker) // Clean up all event listeners
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
          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center z-20">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
              <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Find Your Property
              </h3>
              <p className="text-gray-600 mb-6">
                We can use your current location to help you get started, or you can manually select your property on the map.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => requestUserLocation(map)}
                  disabled={isGettingLocation}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Detecting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5" />
                      Use My Current Location
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowLocationPrompt(false)
                    setIsFullscreen(true)
                  }}
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-colors"
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
          className={`w-full overflow-hidden ${isFullscreen ? 'h-screen rounded-none' : 'h-[600px] rounded-2xl shadow-xl'}`}
        />
      </div>

      {/* Selected Location Panel */}
      {selectedLocation && (
        <div className={`bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100 ${isFullscreen ? 'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-full mx-4' : 'mt-6'}`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                Selected Location
              </h3>
              <p className="text-lg font-medium text-gray-900 mb-1">
                {selectedLocation.address}
              </p>
              <p className="text-sm text-gray-500">
                {selectedLocation.coordinates.lat.toFixed(6)}, {selectedLocation.coordinates.lng.toFixed(6)}
              </p>
            </div>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-shrink-0 bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isLoading ? 'Analyzing...' : 'Validating...'}
                </>
              ) : (
                <>
                  Confirm & Analyze
                </>
              )}
            </button>
          </div>

          {/* Controls */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                {isRotating ? '🎬 3D View Active' : '📍 Location Selected - Drag marker to adjust'}
              </p>
              <div className="flex gap-2">
                {!isRotating && isFullscreen && (
                  <button
                    onClick={() => {
                      if (map && selectedLocation) {
                        start3DRotation(map, selectedLocation.coordinates)
                        toast.success('Starting 3D view of your property!')
                      }
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-sm font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
                  >
                    ✨ View in 3D
                  </button>
                )}
                {isRotating && isFullscreen && (
                  <button
                    onClick={() => {
                      if (map) {
                        stop3DRotation(map)
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Stop Rotation
                  </button>
                )}
                {isFullscreen && (
                  <button
                    onClick={() => {
                      setIsFullscreen(false)
                      if (map) {
                        stop3DRotation(map)
                      }
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-full text-sm font-semibold hover:bg-gray-700 transition-colors"
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
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Click anywhere on the satellite map to select your property location</p>
          <p className="mt-1">💡 Tip: Use the zoom controls (+/-) and drag to navigate to your exact property</p>
        </div>
      )}
    </div>
  )
}
