'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { getLayer, type Layer, type DataLayersResponse, type LayerId } from '@/lib/google/layer-loader'

interface SolarDataLayersProps {
  map: google.maps.Map
  buildingInsights: {
    center: {
      latitude: number
      longitude: number
    }
  }
  selectedLayerId: LayerId | 'none'
  selectedDayOfYear?: number
  showcaseMode?: boolean
  dataLayersResponse?: DataLayersResponse
}

export default function SolarDataLayers({
  map,
  buildingInsights,
  selectedLayerId,
  selectedDayOfYear = 172,
  showcaseMode = false,
  dataLayersResponse,
}: SolarDataLayersProps) {
  const [currentLayer, setCurrentLayer] = useState<Layer | undefined>()
  const [overlays, setOverlays] = useState<google.maps.GroundOverlay[]>([])
  const [toggleVisible, setToggleVisible] = useState(true)
  const [overlaysReady, setOverlaysReady] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(0)
  const [currentHour, setCurrentHour] = useState(5) // Start at 5AM for showcase mode

  const overlaysRef = useRef<google.maps.GroundOverlay[]>([])
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Set up global functions for AutoShowcase
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.showcaseToggleOverlay = (visible: boolean) => {
        console.log('[SolarDataLayers] Toggle overlay visibility:', visible)
        setToggleVisible(visible)
      }

      window.areSolarOverlaysReady = () => {
        return overlaysReady && overlays.length > 0
      }

      window.getCurrentLayerId = () => {
        return currentLayer?.id || 'none'
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.showcaseToggleOverlay
        delete window.areSolarOverlaysReady
        delete window.getCurrentLayerId
      }
    }
  }, [overlaysReady, overlays, currentLayer, selectedLayerId])

  // Mark data layers as ready when dataLayersResponse is available
  useEffect(() => {
    if (dataLayersResponse && typeof window !== 'undefined') {
      window.solarDataLayersReady = true
      console.log('[SolarDataLayers] Data layers response ready')
    }
  }, [dataLayersResponse])

  // Load layer when selection changes
  useEffect(() => {
    if (!dataLayersResponse || !map || selectedLayerId === 'none') {
      if (selectedLayerId === 'none') {
        clearOverlays()
      }
      return
    }

    console.log('[SolarDataLayers] Loading layer:', selectedLayerId)
    loadSelectedLayer()
  }, [selectedLayerId, selectedDayOfYear, dataLayersResponse, map])

  // Handle overlay visibility updates
  useEffect(() => {
    console.log(
      '[SolarDataLayers] Visibility update - currentLayer:',
      currentLayer?.id,
      'overlays:',
      overlays.length,
      'toggleVisible:',
      toggleVisible
    )

    let hasVisibleOverlay = false

    if (currentLayer?.id === 'monthlyFlux') {
      console.log('[SolarDataLayers] Setting monthlyFlux overlay, selectedMonth:', currentMonth)
      overlays.forEach((overlay, i) => {
        const shouldShow = i === currentMonth && toggleVisible
        overlay.setMap(shouldShow ? map : null)
        if (shouldShow) hasVisibleOverlay = true
      })
    } else if (currentLayer?.id === 'hourlyShade') {
      console.log('[SolarDataLayers] Setting hourlyShade overlay, selectedHour:', currentHour)
      overlays.forEach((overlay, i) => {
        const shouldShow = i === currentHour && toggleVisible
        overlay.setMap(shouldShow ? map : null)
        if (shouldShow) hasVisibleOverlay = true
      })
    } else if (currentLayer && overlays.length > 0) {
      // For static layers (rgb, mask, dsm, annualFlux)
      console.log('[SolarDataLayers] Setting static overlay for layer:', currentLayer.id)
      overlays.forEach((overlay, i) => {
        const shouldShow = i === 0 && toggleVisible
        console.log(
          `[SolarDataLayers] Overlay ${i}: ${shouldShow ? 'showing' : 'hiding'} (layer: ${currentLayer.id})`
        )
        overlay.setMap(shouldShow ? map : null)
        if (shouldShow) hasVisibleOverlay = true
      })
    }

    // Update ready state
    if (hasVisibleOverlay && !overlaysReady) {
      setOverlaysReady(true)
      console.log('[SolarDataLayers] Overlays now ready and visible')
    } else if (!hasVisibleOverlay && overlaysReady) {
      setOverlaysReady(false)
      console.log('[SolarDataLayers] Overlays no longer visible')
    }
  }, [currentLayer, overlays, toggleVisible, currentMonth, currentHour, map, overlaysReady])

  // Start animation for animated layers
  useEffect(() => {
    if (!currentLayer || !showcaseMode) return

    if (currentLayer.id === 'monthlyFlux' && currentLayer.canvases.length > 1) {
      startMonthlyAnimation()
    } else if (currentLayer.id === 'hourlyShade' && currentLayer.canvases.length > 1) {
      startHourlyAnimation()
    } else {
      stopAnimation()
    }

    return () => {
      stopAnimation()
    }
  }, [currentLayer, showcaseMode])

  const loadSelectedLayer = async () => {
    if (!dataLayersResponse) {
      console.error('[SolarDataLayers] ❌ Cannot load layer - dataLayersResponse is undefined')
      return
    }

    try {
      console.log('[SolarDataLayers] ========== LAYER LOAD START ==========')
      console.log('[SolarDataLayers] Loading layer:', selectedLayerId)
      console.log('[SolarDataLayers] Options:', {
        dayOfYear: selectedDayOfYear,
        showcaseMode,
      })
      console.log('[SolarDataLayers] dataLayersResponse structure:', {
        hasDsmUrl: !!dataLayersResponse.dsmUrl,
        hasRgbUrl: !!dataLayersResponse.rgbUrl,
        hasMaskUrl: !!dataLayersResponse.maskUrl,
        hasAnnualFluxUrl: !!dataLayersResponse.annualFluxUrl,
        hasMonthlyFluxUrl: !!dataLayersResponse.monthlyFluxUrl,
        hourlyShadeUrlsCount: dataLayersResponse.hourlyShadeUrls?.length || 0,
      })

      const layer = await getLayer(selectedLayerId as LayerId, dataLayersResponse, {
        dayOfYear: selectedDayOfYear,
        showcaseMode,
      })

      console.log('[SolarDataLayers] ✅ Layer loaded from getLayer():', {
        id: layer.id,
        canvasesCount: layer.canvases.length,
        bounds: layer.bounds,
        hasPalette: !!layer.palette
      })

      // Clear old overlays
      console.log('[SolarDataLayers] Clearing old overlays...')
      clearOverlays()

      // Create new overlays
      console.log('[SolarDataLayers] Creating', layer.canvases.length, 'new overlay(s)...')
      const newOverlays = layer.canvases.map((canvas, i) => {
        const dataUrl = canvas.toDataURL()
        console.log(`[SolarDataLayers] Canvas ${i} dataURL length:`, dataUrl.length)
        return new google.maps.GroundOverlay(dataUrl, layer.bounds, {
          opacity: 0.7,
        })
      })

      console.log('[SolarDataLayers] Setting overlays in state...')
      setOverlays(newOverlays)
      overlaysRef.current = newOverlays
      setCurrentLayer(layer)

      // Reset animation state
      if (layer.id === 'monthlyFlux') {
        console.log('[SolarDataLayers] Resetting month to 0')
        setCurrentMonth(0)
      } else if (layer.id === 'hourlyShade') {
        console.log('[SolarDataLayers] Resetting hour to 0')
        setCurrentHour(0)
      }

      console.log('[SolarDataLayers] ✅ Layer load complete:', layer.id, 'with', newOverlays.length, 'overlays')
      console.log('[SolarDataLayers] ========== LAYER LOAD END ==========')
    } catch (error) {
      console.error('[SolarDataLayers] ========== LAYER LOAD ERROR ==========')
      console.error('[SolarDataLayers] ❌ Error loading layer:', selectedLayerId)
      console.error('[SolarDataLayers] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        error
      })
      console.error('[SolarDataLayers] ==========================================')
      setOverlaysReady(false)
    }
  }

  const clearOverlays = () => {
    overlaysRef.current.forEach((overlay) => overlay.setMap(null))
    setOverlays([])
    overlaysRef.current = []
    setOverlaysReady(false)
    console.log('[SolarDataLayers] Cleared overlays')
  }

  const startMonthlyAnimation = () => {
    if (animationIntervalRef.current) return

    console.log('[SolarDataLayers] Starting monthly animation')
    animationIntervalRef.current = setInterval(() => {
      setCurrentMonth((prev) => (prev + 1) % 12)
    }, 333) // ~3 months per second
  }

  const startHourlyAnimation = () => {
    if (animationIntervalRef.current) return

    console.log('[SolarDataLayers] Starting hourly animation')
    const frameCount = currentLayer?.canvases.length || 16

    animationIntervalRef.current = setInterval(() => {
      setCurrentHour((prev) => {
        const next = (prev + 1) % frameCount
        return next
      })
    }, 1000) // 1 hour per second
  }

  const stopAnimation = () => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current)
      animationIntervalRef.current = null
      console.log('[SolarDataLayers] Stopped animation')
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearOverlays()
      stopAnimation()
    }
  }, [])

  // This component is invisible - it only manages map overlays
  return null
}
