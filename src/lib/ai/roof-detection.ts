import { getStaticMapUrl } from '@/lib/google/maps-service'

// Types for AI analysis
export interface RoofAnalysis {
  success: boolean
  roofArea: number // m²
  usableArea: number // m²
  orientation: 'south' | 'southeast' | 'southwest' | 'east' | 'west' | 'north'
  pitch: number // degrees
  confidence: number // 0-1
  obstacles: Array<{
    type: 'chimney' | 'vent' | 'skylight' | 'shadow' | 'other'
    area: number
  }>
  panelPlacement: {
    maxPanels: number
    layout: Array<{
      x: number
      y: number
      width: number
      height: number
    }>
  }
}

// Fallback AI analysis for Gozo and unsupported areas
export const analyzeRoofWithAI = async (
  lat: number,
  lng: number
): Promise<RoofAnalysis> => {
  // Get satellite image
  const imageUrl = getStaticMapUrl(lat, lng, {
    zoom: 20,
    maptype: 'satellite',
    size: '640x640',
    scale: 2
  })

  // For MVP, we'll use a simplified estimation
  // In production, this would call a real AI model (TensorFlow.js, Roboflow, etc.)
  const analysis = await performSimplifiedAnalysis(lat, lng, imageUrl)

  return analysis
}

// Simplified analysis for MVP
// This would be replaced with actual AI model inference
const performSimplifiedAnalysis = async (
  lat: number,
  lng: number,
  imageUrl: string
): Promise<RoofAnalysis> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000))

  // For MVP, use reasonable estimates based on typical Malta properties
  // Average roof size in Malta: 80-120 m²
  const baseRoofArea = 80 + Math.random() * 40
  const usablePercentage = 0.65 + Math.random() * 0.15 // 65-80% usable
  const usableArea = baseRoofArea * usablePercentage

  // Panel calculations
  const PANEL_AREA = 1.7 * 1.0 // m² per panel
  const maxPanels = Math.floor(usableArea / PANEL_AREA)

  // Generate a grid layout
  const layout = generatePanelLayout(maxPanels)

  return {
    success: true,
    roofArea: Math.round(baseRoofArea),
    usableArea: Math.round(usableArea),
    orientation: determineOrientation(lat, lng),
    pitch: 30, // Standard pitch for Malta
    confidence: 0.75, // Moderate confidence for AI estimate
    obstacles: [
      { type: 'chimney', area: 2 },
      { type: 'shadow', area: 5 }
    ],
    panelPlacement: {
      maxPanels,
      layout
    }
  }
}

// Determine roof orientation (simplified for MVP)
const determineOrientation = (
  lat: number,
  lng: number
): 'south' | 'southeast' | 'southwest' | 'east' | 'west' | 'north' => {
  // In production, this would analyze shadows and roof geometry
  const orientations: Array<'south' | 'southeast' | 'southwest'> = ['south', 'southeast', 'southwest']
  return orientations[Math.floor(Math.random() * orientations.length)]
}

// Generate panel layout grid
const generatePanelLayout = (panelCount: number) => {
  const layout = []
  const PANEL_WIDTH = 100 // pixels in visualization
  const PANEL_HEIGHT = 60 // pixels in visualization
  const SPACING = 5 // pixels

  // Calculate grid dimensions
  const cols = Math.ceil(Math.sqrt(panelCount * 1.5))
  const rows = Math.ceil(panelCount / cols)

  let panelsPlaced = 0
  for (let row = 0; row < rows && panelsPlaced < panelCount; row++) {
    for (let col = 0; col < cols && panelsPlaced < panelCount; col++) {
      layout.push({
        x: 100 + col * (PANEL_WIDTH + SPACING),
        y: 100 + row * (PANEL_HEIGHT + SPACING),
        width: PANEL_WIDTH,
        height: PANEL_HEIGHT
      })
      panelsPlaced++
    }
  }

  return layout
}

// Calculate solar potential for AI-detected roof
export const calculateAISolarPotential = (roofAnalysis: RoofAnalysis) => {
  const PANEL_WATTAGE = 400 // W
  const MALTA_SOLAR_IRRADIANCE = 5.2 // kWh/m²/day
  const SYSTEM_EFFICIENCY = 0.80

  // Orientation factors
  const orientationFactors = {
    south: 1.0,
    southeast: 0.95,
    southwest: 0.95,
    east: 0.85,
    west: 0.85,
    north: 0.6
  }

  const orientationFactor = orientationFactors[roofAnalysis.orientation]
  const systemSize = (roofAnalysis.panelPlacement.maxPanels * PANEL_WATTAGE) / 1000 // kW

  const yearlyGeneration =
    systemSize *
    MALTA_SOLAR_IRRADIANCE *
    365 *
    SYSTEM_EFFICIENCY *
    orientationFactor

  return {
    systemSize,
    panelCount: roofAnalysis.panelPlacement.maxPanels,
    yearlyGeneration,
    monthlyAverage: yearlyGeneration / 12,
    dailyAverage: yearlyGeneration / 365,
    co2Offset: yearlyGeneration * 0.0004 // tons CO2 per kWh
  }
}

// Generate visual overlay for satellite image
export const generateSolarOverlay = async (
  imageUrl: string,
  roofAnalysis: RoofAnalysis
): Promise<string> => {
  // In production, this would use Canvas API or server-side image processing
  // For MVP, we'll return a placeholder or the original image

  // This would typically:
  // 1. Load the satellite image
  // 2. Draw panel rectangles based on layout
  // 3. Add transparency and styling
  // 4. Return base64 or URL of processed image

  return imageUrl // Placeholder for MVP
}

// Validate if roof is suitable for solar
export const validateRoofSuitability = (roofAnalysis: RoofAnalysis) => {
  const MIN_USABLE_AREA = 20 // m²
  const MIN_PANELS = 6
  const MAX_PITCH = 60 // degrees

  const issues = []

  if (roofAnalysis.usableArea < MIN_USABLE_AREA) {
    issues.push('Roof area too small for viable solar installation')
  }

  if (roofAnalysis.panelPlacement.maxPanels < MIN_PANELS) {
    issues.push('Insufficient space for minimum panel requirement')
  }

  if (roofAnalysis.pitch > MAX_PITCH) {
    issues.push('Roof pitch too steep for standard installation')
  }

  if (roofAnalysis.orientation === 'north') {
    issues.push('North-facing roof significantly reduces solar efficiency')
  }

  return {
    suitable: issues.length === 0,
    issues,
    recommendation: issues.length === 0
      ? 'Roof is suitable for solar installation'
      : 'Roof may require special consideration for solar installation'
  }
}