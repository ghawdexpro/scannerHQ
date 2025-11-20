'use client'

import { useRef, useEffect, useState } from 'react'
import { loadLibrary } from '@/lib/google/maps-service'
import AutoShowcase, { type AutoShowcaseHandle } from './AutoShowcase'
import SolarDataLayers from './SolarDataLayers'
import type { DataLayersResponse } from '@/lib/google/layer-loader'

interface ShowcaseVisualizationProps {
  coordinates: {
    lat: number
    lng: number
  }
  address: string
  dataLayers?: DataLayersResponse
  onComplete: () => void
}

export default function ShowcaseVisualization({
  coordinates,
  address,
  dataLayers,
  onComplete,
}: ShowcaseVisualizationProps) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [currentLayerId, setCurrentLayerId] = useState<'rgb' | 'mask' | 'dsm' | 'annualFlux' | 'monthlyFlux' | 'hourlyShade' | 'none'>('none')
  const [currentDayOfYear, setCurrentDayOfYear] = useState(172)
  const showcaseRef = useRef<AutoShowcaseHandle>(null)

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      if (!mapDivRef.current) return

      try {
        console.log('[ShowcaseVisualization] Initializing map...')
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
        console.log('[ShowcaseVisualization] Map initialized successfully')
      } catch (error) {
        console.error('[ShowcaseVisualization] Failed to initialize map:', error)
      }
    }

    initMap()
  }, [coordinates])

  // Start showcase when map and data layers are ready
  useEffect(() => {
    if (map && dataLayers && showcaseRef.current) {
      console.log('[ShowcaseVisualization] Starting showcase')
      setTimeout(() => {
        showcaseRef.current?.startShowcase()
      }, 500)
    }
  }, [map, dataLayers])

  // Listen to AutoShowcase state changes via global functions
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const layerId = window.getCurrentLayerId?.()
      if (layerId && layerId !== currentLayerId) {
        setCurrentLayerId(layerId)
        console.log('[ShowcaseVisualization] Layer changed to:', layerId)
      }
    }, 100)

    return () => clearInterval(checkInterval)
  }, [currentLayerId])

  return (
    <div className="relative w-full h-screen">
      {/* Full-screen map */}
      <div ref={mapDivRef} className="w-full h-full" />

      {/* Hidden AutoShowcase orchestrator */}
      {map && dataLayers && (
        <>
          <AutoShowcase ref={showcaseRef} onComplete={onComplete} />

          <SolarDataLayers
            map={map}
            buildingInsights={{
              center: {
                latitude: coordinates.lat,
                longitude: coordinates.lng,
              },
            }}
            selectedLayerId={currentLayerId}
            selectedDayOfYear={currentDayOfYear}
            showcaseMode={true}
            dataLayersResponse={dataLayers}
          />
        </>
      )}
    </div>
  )
}
