'use client'

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { type Layer, type DataLayersResponse } from '@/lib/google/layer-loader'

interface SolarDataLayersProps {
  map: google.maps.Map
  buildingInsights: {
    center: {
      latitude: number
      longitude: number
    }
  }
  currentLayer?: Layer | null
  overlayVisible?: boolean
  currentDayOfYear?: number
  currentMonth?: number
  currentHour?: number
  showcaseMode?: boolean
  dataLayersResponse?: DataLayersResponse
}

export interface SolarDataLayersHandle {
  showLayer: (layer: Layer, visible: boolean) => void
}

const SolarDataLayers = forwardRef<SolarDataLayersHandle, SolarDataLayersProps>(
  (
    {
      map,
      buildingInsights,
      currentLayer,
      overlayVisible = true,
      currentDayOfYear = 172,
      currentMonth = 0,
      currentHour = 5,
      showcaseMode = false,
      dataLayersResponse,
    },
    ref
  ) => {
    const [overlays, setOverlays] = useState<google.maps.GroundOverlay[]>([])
    const [animationMonthIdx, setAnimationMonthIdx] = useState(0)
    const [animationHourIdx, setAnimationHourIdx] = useState(5)

    const overlaysRef = useRef<google.maps.GroundOverlay[]>([])
    const animationIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Expose showLayer method for imperative control
    useImperativeHandle(ref, () => ({
      showLayer: (layer: Layer, visible: boolean) => {
        console.log('[SolarDataLayers] showLayer called:', layer.id, 'visible:', visible)
        createAndShowOverlays(layer, visible)
      },
    }))

    // Create overlays from layer canvases
    const createAndShowOverlays = (layer: Layer, visible: boolean) => {
      console.log('[SolarDataLayers] Creating overlays for layer:', layer.id)

      // Clear old overlays first
      overlaysRef.current.forEach((overlay) => overlay.setMap(null))
      overlaysRef.current = []

      // Create new overlays from canvases
      const newOverlays = layer.canvases.map((canvas, i) => {
        const dataUrl = canvas.toDataURL()
        console.log(`[SolarDataLayers] Canvas ${i} dataURL length:`, dataUrl.length)
        return new google.maps.GroundOverlay(dataUrl, layer.bounds, {
          opacity: 0.7,
        })
      })

      // Reset animation indices
      if (layer.id === 'monthlyFlux') {
        setAnimationMonthIdx(0)
      } else if (layer.id === 'hourlyShade') {
        setAnimationHourIdx(5) // Start at 5AM for showcase mode
      }

      setOverlays(newOverlays)
      overlaysRef.current = newOverlays

      // Show/hide based on visibility
      updateOverlayVisibility(newOverlays, layer, visible)
    }

    // Update overlay visibility based on layer type and visibility flag
    const updateOverlayVisibility = (
      overlayList: google.maps.GroundOverlay[],
      layer: Layer,
      visible: boolean
    ) => {
      console.log('[SolarDataLayers] Updating visibility for', layer.id, 'visible:', visible)

      if (layer.id === 'monthlyFlux') {
        // Show only the current month overlay
        overlayList.forEach((overlay, i) => {
          const shouldShow = i === animationMonthIdx && visible
          overlay.setMap(shouldShow ? map : null)
        })
      } else if (layer.id === 'hourlyShade') {
        // Show only the current hour overlay
        overlayList.forEach((overlay, i) => {
          const shouldShow = i === animationHourIdx && visible
          overlay.setMap(shouldShow ? map : null)
        })
      } else {
        // For static layers (rgb, mask, dsm, annualFlux): show first overlay only
        overlayList.forEach((overlay, i) => {
          const shouldShow = i === 0 && visible
          overlay.setMap(shouldShow ? map : null)
        })
      }
    }

    // Handle visibility changes
    useEffect(() => {
      if (overlays.length === 0 || !currentLayer) return

      updateOverlayVisibility(overlays, currentLayer, overlayVisible)
    }, [overlayVisible, currentLayer, animationMonthIdx, animationHourIdx, map])

    // Start animation for monthlyFlux or hourlyShade
    useEffect(() => {
      if (!currentLayer || !showcaseMode) {
        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current)
          animationIntervalRef.current = null
        }
        return
      }

      const startAnimation = () => {
        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current)
        }

        if (currentLayer.id === 'monthlyFlux') {
          console.log('[SolarDataLayers] Starting monthlyFlux animation')
          animationIntervalRef.current = setInterval(() => {
            setAnimationMonthIdx((prev) => (prev + 1) % 12)
          }, 333) // ~3 months per second
        } else if (currentLayer.id === 'hourlyShade') {
          console.log('[SolarDataLayers] Starting hourlyShade animation')
          const frameCount = currentLayer.canvases.length || 16

          animationIntervalRef.current = setInterval(() => {
            setAnimationHourIdx((prev) => (prev + 1) % frameCount)
          }, 1000) // 1 hour per second
        }
      }

      startAnimation()

      return () => {
        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current)
          animationIntervalRef.current = null
        }
      }
    }, [currentLayer, showcaseMode])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        overlaysRef.current.forEach((overlay) => overlay.setMap(null))
        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current)
        }
      }
    }, [])

    // This component is invisible - it only manages map overlays
    return null
  }
)

SolarDataLayers.displayName = 'SolarDataLayers'

export default SolarDataLayers
