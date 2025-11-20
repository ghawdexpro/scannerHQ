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
  console.log('[ShowcaseVisualization] Component render, props:', {
    coordinates,
    address,
    hasDataLayers: !!dataLayers,
    dataLayersKeys: dataLayers ? Object.keys(dataLayers) : 'undefined'
  })

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
    console.log('[ShowcaseVisualization] Checking readiness:', {
      hasMap: !!map,
      hasDataLayers: !!dataLayers,
      hasShowcaseRef: !!showcaseRef.current,
      dataLayersStructure: dataLayers ? {
        hasDsmUrl: !!dataLayers.dsmUrl,
        hasRgbUrl: !!dataLayers.rgbUrl,
        hasMaskUrl: !!dataLayers.maskUrl,
      } : 'undefined'
    })

    if (map && dataLayers && showcaseRef.current) {
      console.log('[ShowcaseVisualization] ✅ All ready - Starting showcase in 500ms')
      setTimeout(() => {
        showcaseRef.current?.startShowcase()
      }, 500)
    } else {
      console.log('[ShowcaseVisualization] ⏳ Not ready yet, waiting...')
    }
  }, [map, dataLayers])

  // **CRITICAL FIX:** Expose function for AutoShowcase to tell us which layer to load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.showcaseSetDesiredLayer = (layerId: typeof currentLayerId, dayOfYear?: number) => {
        console.log('[ShowcaseVisualization] 🔧 Desired layer set to:', layerId, 'dayOfYear:', dayOfYear)
        setCurrentLayerId(layerId)
        if (dayOfYear !== undefined) {
          setCurrentDayOfYear(dayOfYear)
        }
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.showcaseSetDesiredLayer
      }
    }
  }, [])

  return (
    <div className="relative w-full h-screen">
      {/* Full-screen map */}
      <div ref={mapDivRef} className="w-full h-full" />

      {/* Hidden AutoShowcase orchestrator */}
      {map && dataLayers && (
        <>
          {(() => {
            console.log('[ShowcaseVisualization] Rendering AutoShowcase & SolarDataLayers with:', {
              hasMap: !!map,
              hasDataLayers: !!dataLayers,
              currentLayerId,
              currentDayOfYear
            })
            return null
          })()}
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
      {!map && (
        <div className="absolute top-4 left-4 text-white bg-black/50 p-2 rounded">
          ⏳ Map loading...
        </div>
      )}
      {!dataLayers && (
        <div className="absolute top-4 left-4 text-white bg-black/50 p-2 rounded">
          ⏳ Data layers loading...
        </div>
      )}
    </div>
  )
}
