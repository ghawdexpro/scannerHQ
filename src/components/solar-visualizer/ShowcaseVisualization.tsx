'use client'

import UnifiedShowcase from './UnifiedShowcase'
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

  return (
    <UnifiedShowcase
      coordinates={coordinates}
      address={address}
      dataLayers={dataLayers}
      onComplete={onComplete}
    />
  )
}
