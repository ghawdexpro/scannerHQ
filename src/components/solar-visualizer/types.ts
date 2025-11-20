import { VisualizationData } from '@/types/api'
import type { DataLayersResponse } from '@/lib/google/layer-loader'

export interface SolarVisualizationLoaderProps {
  coordinates: {
    lat: number
    lng: number
  }
  visualizationData: VisualizationData
  address: string
  onComplete: () => void
  onSkip: () => void
  dataLayers?: DataLayersResponse
}

export interface AnimationStage {
  id: string
  name: string
  duration: number
  description: string
}

export const ANIMATION_STAGES: AnimationStage[] = [
  {
    id: 'satellite',
    name: 'Loading Location',
    duration: 2000,
    description: 'Loading satellite view at pin location'
  },
  {
    id: 'height_map',
    name: 'Height Analysis',
    duration: 3000,
    description: 'Mapping building elevation and structure'
  },
  {
    id: 'solar_flux',
    name: 'Solar Irradiation',
    duration: 3000,
    description: 'Real annual solar energy data'
  },
  {
    id: 'shadow_patterns',
    name: 'Shadow Analysis',
    duration: 4000,
    description: 'Seasonal shadow patterns (summer/winter/equinox)'
  }
]

export interface RoofSegmentAnimationProps {
  segments: VisualizationData['roofSegments']
  center: { latitude: number; longitude: number }
  onComplete: () => void
  isActive: boolean
}

export interface PanelPlacementAnimationProps {
  segments: VisualizationData['roofSegments']
  totalPanels: number
  panelDimensions: VisualizationData['panelDimensions']
  center: { latitude: number; longitude: number }
  onComplete: () => void
  isActive: boolean
}

export interface SunlightHeatmapProps {
  segments: VisualizationData['roofSegments']
  center: { latitude: number; longitude: number }
  onComplete: () => void
  isActive: boolean
  dataLayers?: DataLayersResponse
}

export interface Building3DViewProps {
  visualizationData: VisualizationData
  coordinates: { lat: number; lng: number }
  onComplete: () => void
  isActive: boolean
}
