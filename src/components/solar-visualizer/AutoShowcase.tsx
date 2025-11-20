'use client'

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import type { ShowcaseStep } from './types'

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// 8-step showcase sequence matching reference repo
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

interface AutoShowcaseProps {
  onComplete: () => void
}

export interface AutoShowcaseHandle {
  startShowcase: () => void
}

const AutoShowcase = forwardRef<AutoShowcaseHandle, AutoShowcaseProps>(
  ({ onComplete }, ref) => {
    const [isActive, setIsActive] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [progress, setProgress] = useState(0)
    const [isLoadingPhase, setIsLoadingPhase] = useState(false)
    const [currentLayerId, setCurrentLayerId] = useState<ShowcaseStep['layerId'] | 'none'>('none')
    const [currentDayOfYear, setCurrentDayOfYear] = useState(172)
    const [currentMonth, setCurrentMonth] = useState(0)
    const [currentHour, setCurrentHour] = useState(12)

    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const toggleIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const displayTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const loadCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const stepInProgressRef = useRef(false)

    // Expose startShowcase method to parent
    useImperativeHandle(ref, () => ({
      startShowcase: () => {
        if (isActive) return
        console.log('[AutoShowcase] Starting showcase...')
        setIsActive(true)
        setCurrentStep(0)
        setProgress(0)
        setIsLoadingPhase(false)
        waitForDataLayersReady()
      },
    }))

    const waitForDataLayersReady = () => {
      console.log('[AutoShowcase] Waiting for data layers to be ready...')

      const checkInterval = setInterval(() => {
        if (window.solarDataLayersReady) {
          console.log('[AutoShowcase] Data layers ready, starting showcase')
          clearInterval(checkInterval)
          runStep(0)
        }
      }, 100)

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        if (currentStep === 0) {
          console.warn('[AutoShowcase] Timeout waiting for data layers, starting anyway')
          runStep(0)
        }
      }, 10000)
    }

    const cleanupCurrentStep = () => {
      console.log('[AutoShowcase] Cleaning up current step')
      if (loadCheckIntervalRef.current) {
        clearInterval(loadCheckIntervalRef.current)
        loadCheckIntervalRef.current = null
      }
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
        console.warn(`[AutoShowcase] Step ${stepIndex + 1} blocked - another step in progress`)
        return
      }

      stepInProgressRef.current = true
      console.log(`[AutoShowcase] STARTING step ${stepIndex + 1} (locked)`)

      // Clean up previous step
      cleanupCurrentStep()

      const step = SHOWCASE_STEPS[stepIndex]
      setCurrentStep(stepIndex)
      console.log(`[AutoShowcase] Configured step ${stepIndex + 1}: ${step.title}`)

      // Set the layer ID and day of year
      setCurrentLayerId(step.layerId)
      if (step.dayOfYear) {
        setCurrentDayOfYear(step.dayOfYear)
      }

      // **CRITICAL FIX:** Tell ShowcaseVisualization which layer to load via window function
      console.log('[AutoShowcase] 🔧 Setting desired layer via window.showcaseSetDesiredLayer:', step.layerId)
      if (typeof window !== 'undefined' && window.showcaseSetDesiredLayer) {
        window.showcaseSetDesiredLayer(step.layerId, step.dayOfYear)
      } else {
        console.error('[AutoShowcase] ❌ window.showcaseSetDesiredLayer not available!')
      }

      // Reset overlay visibility
      if (window.showcaseToggleOverlay) {
        window.showcaseToggleOverlay(true)
        console.log('[AutoShowcase] Reset overlay visibility to true for step', stepIndex + 1)
      }

      // Start loading phase
      startLoadingPhase()

      // Poll for layer ready, then start display phase
      // Now poll for the actual desired layer, not the stale currentLayerId
      pollForLayerReady(step.layerId, () => {
        startDisplayPhase(step, stepIndex)
      })
    }

    const startLoadingPhase = () => {
      setIsLoadingPhase(true)
      setProgress(0)

      console.log('[AutoShowcase] Starting loading phase with sinusoidal animation')
      progressIntervalRef.current = setInterval(() => {
        // Sinusoidal progress that cycles between 10-90%
        setProgress(50 + 40 * Math.sin(Date.now() / 200))
      }, 50)
    }

    const pollForLayerReady = (expectedLayerId: ShowcaseStep['layerId'], callback: () => void) => {
      let checks = 0
      const maxChecks = 60 // 6 seconds timeout
      let callbackCalled = false

      console.log('[AutoShowcase] ========== POLLING START ==========')
      console.log('[AutoShowcase] Waiting for layer:', expectedLayerId)
      console.log('[AutoShowcase] Max checks:', maxChecks, '(timeout:', maxChecks * 100, 'ms)')

      loadCheckIntervalRef.current = setInterval(() => {
        if (callbackCalled) return

        checks++
        const overlaysReady = window.areSolarOverlaysReady?.() || false
        const currentLoadedLayer = window.getCurrentLayerId?.()
        const correctLayerLoaded = currentLoadedLayer === expectedLayerId

        console.log(
          `[AutoShowcase] Poll check ${checks}/${maxChecks}:`,
          JSON.stringify({
            overlaysReady,
            currentLoadedLayer,
            expectedLayer: expectedLayerId,
            correctLayerLoaded,
            areSolarOverlaysReadyExists: !!window.areSolarOverlaysReady,
            getCurrentLayerIdExists: !!window.getCurrentLayerId,
            solarDataLayersReady: window.solarDataLayersReady
          }, null, 2)
        )

        if (overlaysReady && correctLayerLoaded) {
          console.log('[AutoShowcase] ✅ READY - Layer and overlays ready, starting display phase')
          console.log('[AutoShowcase] ========== POLLING END (SUCCESS) ==========')
          callbackCalled = true
          if (loadCheckIntervalRef.current) {
            clearInterval(loadCheckIntervalRef.current)
            loadCheckIntervalRef.current = null
          }
          callback()
        } else if (checks >= maxChecks) {
          console.warn('[AutoShowcase] ⏱️ TIMEOUT - Proceeding anyway after', checks, 'checks')
          console.warn('[AutoShowcase] Final state:', {
            overlaysReady,
            correctLayerLoaded,
            currentLoadedLayer,
            expectedLayer: expectedLayerId
          })
          console.log('[AutoShowcase] ========== POLLING END (TIMEOUT) ==========')
          callbackCalled = true
          if (loadCheckIntervalRef.current) {
            clearInterval(loadCheckIntervalRef.current)
            loadCheckIntervalRef.current = null
          }
          callback()
        }
      }, 100)
    }

    const startDisplayPhase = (step: ShowcaseStep, stepIndex: number) => {
      setIsLoadingPhase(false)
      console.log(`[AutoShowcase] Starting display phase for ${step.title}`)

      // Clear loading progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }

      // Ensure overlay visibility for non-toggle steps
      if (!step.toggleEffect) {
        console.log('[AutoShowcase] Non-toggle step - ensuring overlay visibility')
        setTimeout(() => {
          if (window.showcaseToggleOverlay) {
            window.showcaseToggleOverlay(true)
          }
        }, 100)
      }

      // Special handling for mask layer
      if (step.layerId === 'mask') {
        console.log('[AutoShowcase] Special handling for mask layer - ensuring visibility')
        setTimeout(() => {
          if (window.showcaseToggleOverlay) {
            window.showcaseToggleOverlay(true)
          }
        }, 200)
      }

      const displayTime = step.duration || 2000

      // Handle toggle effects for eye-catching steps
      if (step.toggleEffect) {
        console.log('[AutoShowcase] Starting toggle effect for', step.layerId)
        let toggleState = true

        const toggleDelay = step.layerId === 'dsm' ? 1000 : 500

        setTimeout(() => {
          let toggleCount = 0
          const maxToggles = 8 // 4 complete on/off cycles

          toggleIntervalRef.current = setInterval(() => {
            toggleState = !toggleState
            toggleCount++

            console.log('[AutoShowcase] Toggle', toggleCount, 'state:', toggleState ? 'ON' : 'OFF')

            if (window.showcaseToggleOverlay) {
              window.showcaseToggleOverlay(toggleState)
            }

            if (toggleCount >= maxToggles) {
              if (toggleIntervalRef.current) {
                clearInterval(toggleIntervalRef.current)
                toggleIntervalRef.current = null
              }
              toggleState = true // End with overlay visible
              if (window.showcaseToggleOverlay) {
                window.showcaseToggleOverlay(true)
              }
            }
          }, 1000) // Toggle every 1 second
        }, toggleDelay)
      }

      // Display progress (0% → 100% over displayTime)
      setProgress(0)
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + (100 / displayTime) * 50
          return newProgress >= 100 ? 100 : newProgress
        })
      }, 50)

      // Move to next step after display time
      displayTimeoutRef.current = setTimeout(() => {
        console.log(`[AutoShowcase] Display phase complete for step ${currentStep + 1} (unlocking)`)
        stepInProgressRef.current = false
        runStep(currentStep + 1)
      }, displayTime)
    }

    const completeShowcase = () => {
      console.log('[AutoShowcase] Completing showcase')

      // Clean up all intervals and timeouts
      cleanupCurrentStep()

      // Give final layer time to load before disabling showcase mode
      setTimeout(() => {
        setIsActive(false)
        setIsLoadingPhase(false)
        console.log('[AutoShowcase] Showcase mode disabled after delay')
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

    // Get time indicator for animated layers
    const timeIndicator = (() => {
      const step = SHOWCASE_STEPS[currentStep]
      if (!step) return ''

      if (step.layerId === 'monthlyFlux') {
        return ` - ${monthNames[currentMonth]}`
      } else if (step.layerId === 'hourlyShade') {
        const hour12 = currentHour === 0 ? 12 : currentHour > 12 ? currentHour - 12 : currentHour
        const period = currentHour < 12 ? 'AM' : 'PM'
        return ` - ${hour12 === 0 ? 12 : hour12}:00 ${period}`
      }
      return ''
    })()

    if (!isActive) return null

    return (
      <>
        {/* Mobile: Ultra-compact top bar */}
        <div className="md:hidden fixed top-2 left-2 right-2 z-50 pointer-events-none">
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
        <div className="hidden md:block fixed top-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md transform transition-all duration-500">
            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-600 mb-2">
                <span>
                  Step {currentStep + 1} of {SHOWCASE_STEPS.length}
                </span>
                <span>{isLoadingPhase ? 'Loading...' : Math.round(progress) + '%'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-100 ${
                    isLoadingPhase ? 'animate-pulse' : ''
                  }`}
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
    )
  }
)

AutoShowcase.displayName = 'AutoShowcase'

export default AutoShowcase
