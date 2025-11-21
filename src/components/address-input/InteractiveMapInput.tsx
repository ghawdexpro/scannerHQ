'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { loadLibrary, validateMaltaAddress } from '@/lib/google/maps-service'
import { geocodeCache } from '@/lib/cache/geocode-cache'
import { ERROR_MESSAGES } from '@/config/constants'
import toast from 'react-hot-toast'

// ============================================================================
// ANIMATION STATE MACHINE & CONFIGURATION
// ============================================================================

type AnimationState = 'idle' | 'animating' | 'geocoding' | 'validating' | 'complete' | 'error' | 'aborted'

interface AnimationContext {
  state: AnimationState
  startZoom: number
  targetZoom: number
  clickLat: number
  clickLng: number
  startTime: number
  duration: number
  rafId: number | null
  timeoutId: ReturnType<typeof setTimeout> | null
  abortController: AbortController | null
  isLocked: boolean
}

// Animation configuration optimized for various scenarios
const ANIMATION_CONFIG = {
  BASE_DURATION: 600, // ms - base animation duration
  MIN_DURATION: 300,
  MAX_DURATION: 1200,
  DURATION_PER_ZOOM: 80, // ms per zoom level
  TARGET_FPS: 60,
  MIN_ZOOM_FOR_PIN: 18,
  ZOOM_INCREMENT: 3,
  MAX_ZOOM: 21,
  MAX_GEOCODING_TIME: 10000, // 10 seconds
  MAX_VALIDATION_TIME: 5000, // 5 seconds
  MAX_ANIMATION_TIME: 5000, // 5 seconds max for animation
  MAX_RETRY_ATTEMPTS: 3,
} as const

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/** Check if user prefers reduced motion */
const prefersReducedMotion = (): boolean => {
  try {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** Detect if device is low-end (memory/CPU constrained) */
const isLowEndDevice = (): boolean => {
  try {
    if (typeof navigator === 'undefined') return false
    // Check device memory if available (Chrome/Edge)
    const deviceMemory = (navigator as any).deviceMemory
    if (deviceMemory && deviceMemory <= 4) return true

    // Check logical processors
    const cores = navigator.hardwareConcurrency
    if (cores && cores <= 2) return true

    return false
  } catch {
    return false
  }
}

/** Calculate animation duration based on zoom distance and device capability */
const calculateDuration = (zoomDistance: number): number => {
  const baseDuration = ANIMATION_CONFIG.BASE_DURATION + (zoomDistance * ANIMATION_CONFIG.DURATION_PER_ZOOM)
  const clamped = Math.max(ANIMATION_CONFIG.MIN_DURATION, Math.min(baseDuration, ANIMATION_CONFIG.MAX_DURATION))

  // Reduce by 30% on low-end devices
  if (isLowEndDevice()) {
    return Math.ceil(clamped * 0.7)
  }

  // Reduce by 50% if user prefers reduced motion
  if (prefersReducedMotion()) {
    return Math.ceil(clamped * 0.5)
  }

  return clamped
}

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

/** Clamp zoom level within valid bounds */
const clampZoom = (zoom: number): number => {
  return Math.max(0, Math.min(Math.floor(zoom), ANIMATION_CONFIG.MAX_ZOOM))
}

/** Easing function for smooth animation (cubic ease-in-out) */
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/** Linear interpolation between two values */
const interpolate = (start: number, end: number, t: number): number => {
  return start + (end - start) * t
}

/** Unique ID for toast notifications to prevent duplicates */
let lastToastId = ''
const showUniqueToast = (message: string, options: any = {}) => {
  const toastId = `${Date.now()}-${Math.random()}`
  if (toastId !== lastToastId) {
    lastToastId = toastId
    toast(message, { ...options, id: toastId })
  }
}

interface InteractiveMapInputProps {
  onAddressSelect: (address: string, coordinates: { lat: number; lng: number }) => void
  isLoading?: boolean
}

export default function InteractiveMapInput({ onAddressSelect, isLoading = false }: InteractiveMapInputProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const isMapIdleRef = useRef(false)
  const animationContextRef = useRef<AnimationContext>({
    state: 'idle',
    startZoom: 11,
    targetZoom: 21,
    clickLat: 0,
    clickLng: 0,
    startTime: 0,
    duration: 0,
    rafId: null,
    timeoutId: null,
    abortController: null,
    isLocked: false,
  })

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

  // ============================================================================
  // ANIMATION ENGINE FUNCTIONS
  // ============================================================================

  /** Initialize animation context for a new click */
  const initAnimationContext = useCallback((clickLat: number, clickLng: number, startZoom: number) => {
    const ctx = animationContextRef.current
    ctx.clickLat = clickLat
    ctx.clickLng = clickLng
    ctx.startZoom = startZoom
    ctx.targetZoom = ANIMATION_CONFIG.MIN_ZOOM_FOR_PIN
    ctx.startTime = Date.now()
    ctx.duration = calculateDuration(Math.abs(ctx.targetZoom - startZoom))
    ctx.isLocked = true
    ctx.state = 'animating'
    ctx.abortController = new AbortController()
  }, [])

  /** Cleanup animation resources (RAF, timeouts, etc.) */
  const cleanupAnimation = useCallback(() => {
    const ctx = animationContextRef.current
    if (ctx.rafId !== null) {
      cancelAnimationFrame(ctx.rafId)
      ctx.rafId = null
    }
    if (ctx.timeoutId !== null) {
      clearTimeout(ctx.timeoutId)
      ctx.timeoutId = null
    }
    ctx.isLocked = false
  }, [])

  /** Abort animation and clean up */
  const abortAnimation = useCallback(() => {
    const ctx = animationContextRef.current
    if (ctx.abortController) {
      ctx.abortController.abort()
      ctx.abortController = null
    }
    ctx.state = 'aborted'
    cleanupAnimation()
  }, [cleanupAnimation])

  /** Animate zoom level smoothly using RAF */
  const animateZoom = useCallback((mapInstance: google.maps.Map) => {
    const ctx = animationContextRef.current

    const animate = () => {
      const elapsed = Date.now() - ctx.startTime

      // Guard: Check animation time limit (5 seconds max)
      if (elapsed > ANIMATION_CONFIG.MAX_ANIMATION_TIME) {
        console.warn('Animation timeout, jumping to final zoom')
        mapInstance.setZoom(ctx.targetZoom)
        ctx.state = 'complete'
        return
      }

      // Calculate progress (0 to 1) with easing
      const rawProgress = elapsed / ctx.duration
      const clampedProgress = Math.min(rawProgress, 1)
      const easedProgress = easeInOutCubic(clampedProgress)

      // Interpolate zoom level
      const currentZoom = interpolate(ctx.startZoom, ctx.targetZoom, easedProgress)
      mapInstance.setZoom(clampZoom(currentZoom))

      // Continue animation if not complete
      if (clampedProgress < 1) {
        ctx.rafId = requestAnimationFrame(animate)
      } else {
        // Animation complete - zoom to exact target
        mapInstance.setZoom(ctx.targetZoom)
        ctx.state = 'complete'
      }
    }

    // Reduce motion: skip animation and jump to target
    if (prefersReducedMotion()) {
      mapInstance.setZoom(ctx.targetZoom)
      ctx.state = 'complete'
      return
    }

    ctx.rafId = requestAnimationFrame(animate)
  }, [])

  /** Proceed to geocoding after animation completes */
  const proceedToGeocoding = useCallback(async (mapInstance: google.maps.Map) => {
    const ctx = animationContextRef.current

    if (!isValidCoordinate(ctx.clickLat, ctx.clickLng)) {
      console.error('Invalid coordinates after animation:', { lat: ctx.clickLat, lng: ctx.clickLng })
      ctx.state = 'error'
      return
    }

    ctx.state = 'geocoding'

    try {
      const geocodingLib = await loadLibrary('geocoding')
      const geocoder = new geocodingLib.Geocoder()
      const latLng = new google.maps.LatLng(ctx.clickLat, ctx.clickLng)

      // Timeout guard for geocoding
      const geocodingTimeout = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Geocoding timeout')), ANIMATION_CONFIG.MAX_GEOCODING_TIME)
      )

      const geocodingPromise = new Promise<google.maps.GeocoderResult[] | null>((resolve) => {
        geocoder.geocode({ location: latLng }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results)
          } else {
            resolve(null)
          }
        })
      })

      const results = await Promise.race([geocodingPromise, geocodingTimeout])

      if (results && results[0]) {
        const address = results[0].formatted_address
        geocodeCache.set(address, { lat: ctx.clickLat, lng: ctx.clickLng })
        ctx.state = 'validating'
        await validateAndSetLocation(address, { lat: ctx.clickLat, lng: ctx.clickLng }, mapInstance)
      } else {
        toast.error('Could not find address for this location', { duration: 2000 })
        ctx.state = 'error'
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      toast.error('Error finding address. Please try again.', { duration: 2000 })
      ctx.state = 'error'
    }
  }, [])

  /** Proceed to validation after geocoding completes */
  const proceedToValidation = useCallback(async (mapInstance: google.maps.Map) => {
    // Validation is handled in proceedToGeocoding callback
    // This is kept for future enhancement
  }, [])

  // ============================================================================
  // MOBILE RESILIENCE: Visibility and Orientation Handlers
  // ============================================================================

  useEffect(() => {
    const ctx = animationContextRef.current

    // Handle visibility changes (tab switch, device lock, etc.)
    const handleVisibilityChange = () => {
      if (document.hidden && ctx.isLocked) {
        console.warn('Page hidden during animation, aborting')
        abortAnimation()
      }
    }

    // Handle orientation changes (rotate device)
    const handleOrientationChange = () => {
      if (ctx.isLocked && ctx.state === 'animating') {
        console.warn('Orientation changed during animation, aborting')
        abortAnimation()
      }

      // Trigger map resize after orientation change
      if (map) {
        setTimeout(() => {
          google.maps.event.trigger(map, 'resize')
        }, 100)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [map, abortAnimation])

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

  // ============================================================================
  // CLEANUP ON UNMOUNT
  // ============================================================================

  useEffect(() => {
    return () => {
      // Abort any active animation on unmount
      const ctx = animationContextRef.current
      if (ctx.isLocked) {
        abortAnimation()
      }
    }
  }, [abortAnimation])

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
  // BULLETPROOF HANDLE MAP CLICK - 5 GUARD CONDITIONS
  // ============================================================================

  const handleMapClick = useCallback(async (latLng: google.maps.LatLng, mapInstance: google.maps.Map) => {
    const ctx = animationContextRef.current
    const lat = latLng.lat()
    const lng = latLng.lng()

    // GUARD 1: Check if map is idle
    if (!isMapIdleRef.current) {
      google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
        const deferredLatLng = new google.maps.LatLng(lat, lng)
        handleMapClick(deferredLatLng, mapInstance)
      })
      return
    }

    // GUARD 2: Check if animation is already locked
    if (ctx.isLocked) {
      console.warn('Animation already in progress, ignoring click')
      return
    }

    // GUARD 3: Validate coordinates
    if (!isValidCoordinate(lat, lng)) {
      console.error('Invalid coordinates clicked:', { lat, lng })
      toast.error(ERROR_MESSAGES.INVALID_ADDRESS, { duration: 2000 })
      return
    }

    // GUARD 4: Get current zoom and validate
    const currentZoom = mapInstance.getZoom()
    if (currentZoom === null || currentZoom === undefined) {
      console.error('Cannot determine current zoom level')
      toast.error('Error reading map zoom level. Please try again.', { duration: 2000 })
      return
    }

    // GUARD 5: Check if already at target zoom
    if (currentZoom >= ANIMATION_CONFIG.MIN_ZOOM_FOR_PIN) {
      // Already zoomed in enough, proceed directly to geocoding
      initAnimationContext(lat, lng, currentZoom)
      ctx.state = 'geocoding'
      setIsValidating(true)

      // Update map center to clicked location
      mapInstance.setCenter({ lat, lng })
      mapInstance.setZoom(ANIMATION_CONFIG.MAX_ZOOM)

      await proceedToGeocoding(mapInstance)
      cleanupAnimation()
      return
    }

    // ========================================================================
    // START SMOOTH ZOOM ANIMATION
    // ========================================================================

    console.log('Starting smooth zoom animation:', { lat, lng, currentZoom, targetZoom: ANIMATION_CONFIG.MIN_ZOOM_FOR_PIN })

    // Initialize animation context
    initAnimationContext(lat, lng, currentZoom)

    // Update map center immediately to clicked location
    mapInstance.setCenter({ lat, lng })

    // Start smooth zoom animation
    animateZoom(mapInstance)

    // Set up animation completion check
    const checkAnimationCompletion = setInterval(() => {
      if (ctx.state === 'complete' || ctx.state === 'error') {
        clearInterval(checkAnimationCompletion)
        ctx.state = 'geocoding'
        setIsValidating(true)
        proceedToGeocoding(mapInstance).finally(() => {
          cleanupAnimation()
        })
      }
    }, 50)

    // Guard: Clear interval on component unmount or abort
    return () => clearInterval(checkAnimationCompletion)
  }, [
    initAnimationContext,
    cleanupAnimation,
    animateZoom,
    proceedToGeocoding,
  ])

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
