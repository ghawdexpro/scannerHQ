'use client'

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { loadLibrary } from '@/lib/google/maps-service'
import SolarDataLayers, { type SolarDataLayersHandle } from './SolarDataLayers'
import { getLayer, type Layer, type DataLayersResponse, type LayerId } from '@/lib/google/layer-loader'
import type { ShowcaseStep } from './types'

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// 8-step showcase sequence with unified architecture
const SHOWCASE_STEPS: ShowcaseStep[] = [
  {
    layerId: 'rgb',
    title: 'Analyzing Your Roof',
    description: 'High-resolution aerial imagery analysis...',
    mobileDesc: 'Capturing roof',
    duration: 8000,
    message: '📸 Capturing roof details',
    toggleEffect: true,
  },
  {
    layerId: 'mask',
    title: 'Identifying Suitable Roof Areas',
    description: 'Finding optimal spots for solar panels...',
    mobileDesc: 'Finding areas',
    duration: 8000,
    message: '🎯 Mapping installable areas',
    toggleEffect: true,
  },
  {
    layerId: 'dsm',
    title: 'Building Height Analysis',
    description: '3D surface model for shadow calculations...',
    mobileDesc: 'Analyzing height',
    duration: 8000,
    message: '🏗️ Analyzing roof structure',
    toggleEffect: true,
  },
  {
    layerId: 'monthlyFlux',
    title: 'Monthly Variations',
    description: 'Seasonal patterns throughout the year...',
    mobileDesc: 'Monthly data',
    duration: 6000,
    message: '📅 Monthly solar data',
  },
  {
    layerId: 'hourlyShade',
    title: 'Summer Solstice Shadows',
    description: 'June 21 - Longest day (15.5h daylight)',
    mobileDesc: 'Summer shadows',
    duration: 16000,
    message: '☀️ Summer shadows - best case',
    dayOfYear: 172,
  },
  {
    layerId: 'hourlyShade',
    title: 'Fall Equinox Shadows',
    description: 'September 22 - Equal day/night (12h daylight)',
    mobileDesc: 'Equinox shadows',
    duration: 16000,
    message: '🌤️ Equinox shadows - average case',
    dayOfYear: 265,
  },
  {
    layerId: 'hourlyShade',
    title: 'Winter Solstice Shadows',
    description: 'December 21 - Shortest day (9.5h daylight)',
    mobileDesc: 'Winter shadows',
    duration: 16000,
    message: '❄️ Winter shadows - worst case',
    dayOfYear: 355,
  },
  {
    layerId: 'dsm',
    title: 'Analysis Complete',
    description: 'Professional solar assessment finished',
    mobileDesc: 'Analysis complete',
    duration: 3000,
    message: '✅ Ready for installation planning',
  },
]

interface UnifiedShowcaseProps {
  coordinates: {
    lat: number
    lng: number
  }
  address: string
  dataLayers?: DataLayersResponse
  onComplete: () => void
}

export interface UnifiedShowcaseHandle {
  startShowcase: () => void
}

const UnifiedShowcase = forwardRef<UnifiedShowcaseHandle, UnifiedShowcaseProps>(
  ({ coordinates, address, dataLayers, onComplete }, ref) => {
    console.log('[UnifiedShowcase] Component render, props:', {
      coordinates,
      address,
      hasDataLayers: !!dataLayers,
    })

    // Map and UI state
    const mapDivRef = useRef<HTMLDivElement>(null)
    const [map, setMap] = useState<google.maps.Map | null>(null)
    const [isActive, setIsActive] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [loadingProgress, setLoadingProgress] = useState(0)
    const [currentStep, setCurrentStep] = useState(0)
    const [progress, setProgress] = useState(0)
    const [isLoadingPhase, setIsLoadingPhase] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(0)
    const [currentHour, setCurrentHour] = useState(12)
    const [currentDayOfYear, setCurrentDayOfYear] = useState(172)
    const [overlayVisible, setOverlayVisible] = useState(true)

    // Refs for management
    const solarDataLayersRef = useRef<SolarDataLayersHandle>(null)
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const toggleIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const displayTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const stepInProgressRef = useRef(false)
    const loadedLayersRef = useRef<Map<string, Layer>>(new Map())
    const [currentDisplayLayer, setCurrentDisplayLayer] = useState<Layer | null>(null)

    // Expose startShowcase method to parent
    useImperativeHandle(ref, () => ({
      startShowcase: () => {
        if (isActive) return
        console.log('[UnifiedShowcase] Starting showcase...')
        startPreloading()
      },
    }))

    // State for tracking current loading layer
    const [currentLoadingLayer, setCurrentLoadingLayer] = useState('')

    // Initialize map
    useEffect(() => {
      const initMap = async () => {
        if (!mapDivRef.current) return

        try {
          console.log('[UnifiedShowcase] Initializing map...')
          await loadLibrary('maps')

          const googleMap = new google.maps.Map(mapDivRef.current, {
            center: { lat: coordinates.lat, lng: coordinates.lng },
            zoom: 20,
            mapTypeId: 'satellite',
            tilt: 0,
            heading: 0,
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
          })

          setMap(googleMap)
          console.log('[UnifiedShowcase] Map initialized successfully')
        } catch (error) {
          console.error('[UnifiedShowcase] Failed to initialize map:', error)
        }
      }

      initMap()
    }, [coordinates])

    // Auto-start showcase when map and dataLayers are ready
    useEffect(() => {
      if (map && dataLayers && !isActive && !isLoading) {
        console.log('[UnifiedShowcase] Auto-starting showcase...')
        const timeoutId = setTimeout(() => {
          startPreloading()
        }, 500)

        return () => clearTimeout(timeoutId)
      }
    }, [map, dataLayers, isActive, isLoading])

    // Pre-load all 7 layers upfront
    const startPreloading = async () => {
      if (!dataLayers || !map) {
        console.warn('[UnifiedShowcase] Cannot start preloading - missing dataLayers or map')
        return
      }

      setIsLoading(true)
      setIsActive(true)
      setLoadingProgress(0)

      console.log('[UnifiedShowcase] Starting pre-loading of all 7 layers...')

      try {
        // Define all layers to pre-load with cache keys
        const layersToLoad: Array<{ layerId: LayerId; dayOfYear?: number; cacheKey: string }> = [
          { layerId: 'rgb', cacheKey: 'rgb-0' },
          { layerId: 'mask', cacheKey: 'mask-0' },
          { layerId: 'dsm', cacheKey: 'dsm-0' },
          { layerId: 'monthlyFlux', cacheKey: 'monthlyFlux-0' },
          { layerId: 'hourlyShade', dayOfYear: 172, cacheKey: 'hourlyShade-172' },
          { layerId: 'hourlyShade', dayOfYear: 265, cacheKey: 'hourlyShade-265' },
          { layerId: 'hourlyShade', dayOfYear: 355, cacheKey: 'hourlyShade-355' },
        ]

        // Load all layers in parallel, but continue even if some fail
        const loadPromises = layersToLoad.map(async ({ layerId, dayOfYear, cacheKey }) => {
          try {
            setCurrentLoadingLayer(cacheKey)
            console.log('[UnifiedShowcase] Loading layer:', cacheKey)
            const layer = await getLayer(layerId, dataLayers, {
              dayOfYear,
              showcaseMode: true,
            })
            loadedLayersRef.current.set(cacheKey, layer)
            console.log('[UnifiedShowcase] ✅ Loaded:', cacheKey)

            // Update progress
            setLoadingProgress((prev) => Math.min(prev + 100 / layersToLoad.length, 100))

            return { success: true, cacheKey }
          } catch (error) {
            console.error('[UnifiedShowcase] ❌ Failed to load layer:', cacheKey, error)
            // Update progress anyway so we don't get stuck
            setLoadingProgress((prev) => Math.min(prev + 100 / layersToLoad.length, 100))
            return { success: false, cacheKey, error }
          }
        })

        // Wait for all loads to complete (even if some fail)
        const results = await Promise.allSettled(loadPromises)

        // Check results and log any failures
        const failed = results
          .map((r, i) => r.status === 'rejected' ? layersToLoad[i].cacheKey : null)
          .filter(Boolean)

        if (failed.length > 0) {
          console.warn('[UnifiedShowcase] ⚠️ Some layers failed to load:', failed)
        }

        console.log('[UnifiedShowcase] ✅ All layers pre-loaded successfully!')
        console.log('[UnifiedShowcase] Cache contents:', {
          size: loadedLayersRef.current.size,
          keys: Array.from(loadedLayersRef.current.keys()),
        })

        // Start showcase after brief delay
        setIsLoading(false)
        setTimeout(() => {
          runStep(0)
        }, 500)
      } catch (error) {
        console.error('[UnifiedShowcase] ❌ Pre-loading failed:', error)
        setIsLoading(false)
        setIsActive(false)
      }
    }

    const cleanupCurrentStep = () => {
      console.log('[UnifiedShowcase] Cleaning up current step')
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      if (toggleIntervalRef.current) {
        clearInterval(toggleIntervalRef.current)
        toggleIntervalRef.current = null
      }
      if (displayTimeoutRef.current) {
        clearTimeout(displayTimeoutRef.current)
        displayTimeoutRef.current = null
      }
    }

    const runStep = (stepIndex: number) => {
      if (stepIndex >= SHOWCASE_STEPS.length) {
        completeShowcase()
        return
      }

      // Prevent concurrent step execution
      if (stepInProgressRef.current) {
        console.warn(`[UnifiedShowcase] Step ${stepIndex + 1} blocked - another step in progress`)
        return
      }

      stepInProgressRef.current = true
      console.log(`[UnifiedShowcase] STARTING step ${stepIndex + 1} (locked)`)

      // Clean up previous step
      cleanupCurrentStep()

      const step = SHOWCASE_STEPS[stepIndex]
      setCurrentStep(stepIndex)
      setCurrentDayOfYear(step.dayOfYear || 172)
      setOverlayVisible(true)

      console.log(`[UnifiedShowcase] Configured step ${stepIndex + 1}: ${step.title}`)

      // Get pre-loaded layer from cache
      const cacheKey = `${step.layerId}-${step.dayOfYear || 0}`
      const layer = loadedLayersRef.current.get(cacheKey)

      if (!layer) {
        console.error('[UnifiedShowcase] ❌ Layer not found in cache:', cacheKey)
        stepInProgressRef.current = false
        runStep(stepIndex + 1)
        return
      }

      // Show layer immediately via imperative call
      console.log('[UnifiedShowcase] Showing layer:', cacheKey)
      setCurrentDisplayLayer(layer) // Track which layer is currently displayed
      solarDataLayersRef.current?.showLayer(layer, true)

      // Reset animation state for animated layers
      if (layer.id === 'monthlyFlux') {
        setCurrentMonth(0)
      }
      // Note: hourlyShade initial hour (5 AM) is handled by SolarDataLayers callback

      // Start display phase
      startDisplayPhase(step, stepIndex)
    }

    const startDisplayPhase = (step: ShowcaseStep, stepIndex: number) => {
      console.log(`[UnifiedShowcase] Starting display phase for ${step.title}`)

      // Handle toggle effects for eye-catching steps
      if (step.toggleEffect) {
        console.log('[UnifiedShowcase] Starting toggle effect for', step.layerId)
        let toggleState = true
        const toggleDelay = step.layerId === 'dsm' ? 1000 : 500

        setTimeout(() => {
          let toggleCount = 0
          const maxToggles = 8 // 4 complete on/off cycles

          toggleIntervalRef.current = setInterval(() => {
            toggleState = !toggleState
            toggleCount++

            console.log('[UnifiedShowcase] Toggle', toggleCount, 'state:', toggleState ? 'ON' : 'OFF')
            setOverlayVisible(toggleState)

            if (toggleCount >= maxToggles) {
              if (toggleIntervalRef.current) {
                clearInterval(toggleIntervalRef.current)
                toggleIntervalRef.current = null
              }
              setOverlayVisible(true) // End with overlay visible
            }
          }, 1000) // Toggle every 1 second
        }, toggleDelay)
      }

      // Display progress (0% → 100% over displayTime)
      const displayTime = step.duration || 2000
      setProgress(0)
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + (100 / displayTime) * 50
          return newProgress >= 100 ? 100 : newProgress
        })
      }, 50)

      // Move to next step after display time
      displayTimeoutRef.current = setTimeout(() => {
        console.log(`[UnifiedShowcase] Display phase complete for step ${stepIndex + 1} (unlocking)`)
        stepInProgressRef.current = false
        runStep(stepIndex + 1)
      }, displayTime)
    }

    const completeShowcase = () => {
      console.log('[UnifiedShowcase] Completing showcase')

      // Clean up all intervals and timeouts
      cleanupCurrentStep()

      // Give final layer time to display before disabling showcase mode
      setTimeout(() => {
        setIsActive(false)
        console.log('[UnifiedShowcase] Showcase mode disabled after delay')
      }, 2000)

      stepInProgressRef.current = false

      // Notify completion
      setTimeout(() => {
        onComplete()
      }, 3000)
    }

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        cleanupCurrentStep()
      }
    }, [])

    // Format hour for display
    const formatHour = (hour: number) => {
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      const period = hour < 12 ? 'AM' : 'PM'
      return `${displayHour}:00 ${period}`
    }

    // Set up hour and month change callbacks when ref is ready
    useEffect(() => {
      if (solarDataLayersRef.current?.setOnHourChange) {
        solarDataLayersRef.current.setOnHourChange((hour: number) => {
          setCurrentHour(hour)
        })
      }
      if (solarDataLayersRef.current?.setOnMonthChange) {
        solarDataLayersRef.current.setOnMonthChange((month: number) => {
          setCurrentMonth(month)
        })
      }
    }, [])

    // Get time indicator for animated layers
    const timeIndicator = (() => {
      const step = SHOWCASE_STEPS[currentStep]
      if (!step) return ''

      if (step.layerId === 'monthlyFlux') {
        return ` - ${monthNames[currentMonth]}`
      } else if (step.layerId === 'hourlyShade') {
        return ` - ${formatHour(currentHour)}`
      }
      return ''
    })()

    return (
      <div className="relative w-full h-screen">
        {/* Full-screen map */}
        <div ref={mapDivRef} className="w-full h-full" />

        {/* Loading spinner during pre-load phase */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-sm">
              <div className="mb-4">
                <div className="inline-block">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Loading Showcase</h3>
              <p className="text-gray-600 mb-4">Preparing all layers for smooth playback...</p>
              {currentLoadingLayer && (
                <p className="text-xs text-blue-600 mb-3 font-mono">
                  Loading: <span className="font-semibold">{currentLoadingLayer}</span>
                </p>
              )}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{Math.round(loadingProgress)}%</p>
            </div>
          </div>
        )}

        {/* Solar data layers renderer */}
        {map && dataLayers && (
          <SolarDataLayers
            ref={solarDataLayersRef}
            map={map}
            buildingInsights={{
              center: {
                latitude: coordinates.lat,
                longitude: coordinates.lng,
              },
            }}
            currentLayer={currentDisplayLayer}
            currentDayOfYear={currentDayOfYear}
            overlayVisible={overlayVisible}
            showcaseMode={true}
            dataLayersResponse={dataLayers}
            currentMonth={currentMonth}
            currentHour={currentHour}
          />
        )}

        {/* Showcase UI overlay */}
        {isActive && !isLoading && (
          <>
            {/* Mobile: Ultra-compact top bar */}
            <div className="md:hidden fixed top-2 left-2 right-2 z-40 pointer-events-none">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 font-medium">
                    {currentStep + 1}/{SHOWCASE_STEPS.length}
                  </span>
                  <div className="flex-1 mx-2">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-1 rounded-full transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-blue-600 font-medium text-xs">
                    {SHOWCASE_STEPS[currentStep]?.message?.split(' ')[0] || ''}{' '}
                    {SHOWCASE_STEPS[currentStep]?.mobileDesc || ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop: Full detailed overlay */}
            <div className="hidden md:block fixed top-8 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md transform transition-all duration-500">
                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-2">
                    <span>
                      Step {currentStep + 1} of {SHOWCASE_STEPS.length}
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Current step info */}
                {SHOWCASE_STEPS[currentStep] && (
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {SHOWCASE_STEPS[currentStep].title}
                    </h3>
                    <p className="text-gray-600 mb-4">{SHOWCASE_STEPS[currentStep].description}</p>

                    {/* Large time display for hourly shade */}
                    {SHOWCASE_STEPS[currentStep].layerId === 'hourlyShade' && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <span className="text-4xl font-bold text-blue-600">
                          🕐 {formatHour(currentHour)}
                        </span>
                      </div>
                    )}

                    {/* Animated message */}
                    <div className="flex items-center justify-center space-x-2 text-blue-600">
                      <div className="animate-pulse">
                        <span className="text-lg">
                          {SHOWCASE_STEPS[currentStep].message}
                          {timeIndicator}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: '0s' }}
                        />
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        />
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }
)

UnifiedShowcase.displayName = 'UnifiedShowcase'

export default UnifiedShowcase
