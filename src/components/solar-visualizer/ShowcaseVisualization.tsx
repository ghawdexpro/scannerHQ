'use client'

import { useRef } from 'react'
import UnifiedShowcase, { type UnifiedShowcaseHandle } from './UnifiedShowcase'
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
  })

  const showcaseRef = useRef<UnifiedShowcaseHandle>(null)

  // Start showcase when component mounts
  const handleStart = () => {
    console.log('[ShowcaseVisualization] Starting showcase...')
    showcaseRef.current?.startShowcase()
  }

  return (
    <div className="relative w-full h-screen">
      <UnifiedShowcase
        ref={showcaseRef}
        coordinates={coordinates}
        address={address}
        dataLayers={dataLayers}
        onComplete={onComplete}
      />

      {/* Trigger button for testing (optional) */}
      <button
        onClick={handleStart}
        className="absolute top-4 right-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Start Showcase
      </button>
    </div>
  )
}
