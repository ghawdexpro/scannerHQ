import { VisualizationData } from '@/types/api'

export interface SolarVisualizationLoaderProps {
  coordinates: {
    lat: number
    lng: number
  }
  visualizationData: VisualizationData
  address: string
  onComplete: () => void
  onSkip: () => void
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
    name: 'Loading Satellite View',
    duration: 2000,
    description: 'Fetching satellite imagery of your property'
  },
  {
    id: 'roof_detection',
    name: 'Detecting Roof Segments',
    duration: 3000,
    description: 'Analyzing roof geometry and orientation'
  },
  {
    id: 'sunlight_analysis',
    name: 'Analyzing Sunlight',
    duration: 2500,
    description: 'Calculating solar irradiance patterns'
  },
  {
    id: 'panel_placement',
    name: 'Placing Solar Panels',
    duration: 4000,
    description: 'Optimizing panel configuration'
  },
  {
    id: '3d_render',
    name: '3D Visualization',
    duration: 3500,
    description: 'Rendering 3D model of your solar installation'
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
}

export interface Building3DViewProps {
  visualizationData: VisualizationData
  coordinates: { lat: number; lng: number }
  onComplete: () => void
  isActive: boolean
}
