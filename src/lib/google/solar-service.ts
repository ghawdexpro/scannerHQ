import axios from 'axios'

// Google Solar API base URL
const SOLAR_API_BASE = 'https://solar.googleapis.com/v1'

export interface SolarPotential {
  maxArrayPanelsCount: number
  maxArrayAreaMeters2: number
  maxSunshineHoursPerYear: number
  carbonOffsetFactorKgPerMwh: number
  wholeRoofStats: {
    areaMeters2: number
    sunshineQuantiles: number[]
    groundAreaMeters2: number
  }
  roofSegmentStats: Array<{
    pitchDegrees: number
    azimuthDegrees: number
    stats: {
      areaMeters2: number
      sunshineQuantiles: number[]
      groundAreaMeters2: number
    }
    center: {
      latitude: number
      longitude: number
    }
    boundingBox: {
      sw: { latitude: number; longitude: number }
      ne: { latitude: number; longitude: number }
    }
    planeHeightAtCenterMeters: number
  }>
  solarPanelConfigs: Array<{
    panelsCount: number
    yearlyEnergyDcKwh: number
    roofSegmentSummaries: Array<{
      pitchDegrees: number
      azimuthDegrees: number
      panelsCount: number
      yearlyEnergyDcKwh: number
    }>
  }>
  panelCapacityWatts: number
  panelHeightMeters: number
  panelWidthMeters: number
  panelLifetimeYears: number
  buildingInsights: {
    name: string
    center: {
      latitude: number
      longitude: number
    }
    boundingBox: {
      sw: { latitude: number; longitude: number }
      ne: { latitude: number; longitude: number }
    }
    imageryDate: {
      year: number
      month: number
      day: number
    }
    imageryProcessedDate: {
      year: number
      month: number
      day: number
    }
    postalCode: string
    administrativeArea: string
    statisticalArea: string
    regionCode: string
    solarPotential: any
  }
}

export interface BuildingInsightsResponse {
  name: string
  center: {
    latitude: number
    longitude: number
  }
  imageryDate: {
    year: number
    month: number
    day: number
  }
  solarPotential: SolarPotential
}

// Get building insights from Google Solar API
export const getBuildingInsights = async (
  lat: number,
  lng: number,
  requiredQuality: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH'
): Promise<BuildingInsightsResponse> => {
  try {
    const response = await axios.get(
      `${SOLAR_API_BASE}/buildingInsights:findClosest`,
      {
        params: {
          'location.latitude': lat,
          'location.longitude': lng,
          requiredQuality,
          key: process.env.GOOGLE_SOLAR_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      }
    )

    return response.data
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('LOCATION_NOT_FOUND')
    }
    console.error('Solar API error:', error)
    throw new Error('Failed to fetch solar insights')
  }
}

// Calculate solar panel configuration for Malta
export const calculateSolarConfiguration = (solarPotential: SolarPotential) => {
  // Use Malta-specific parameters
  const MALTA_SOLAR_IRRADIANCE = 5.2 // kWh/m²/day
  const SYSTEM_EFFICIENCY = 0.80 // 80% efficiency
  const PANEL_WATTAGE = 400 // Standard panel wattage

  // Get the best configuration (usually the last one with max panels)
  const bestConfig = solarPotential.solarPanelConfigs[
    solarPotential.solarPanelConfigs.length - 1
  ]

  if (!bestConfig) {
    return null
  }

  // Business rule: Always cap at 15 kWp
  const MAX_SYSTEM_SIZE = 15 // kWp
  const calculatedSystemSize = (bestConfig.panelsCount * PANEL_WATTAGE) / 1000 // kW
  const systemSize = Math.min(calculatedSystemSize, MAX_SYSTEM_SIZE)
  const panelsCount = Math.floor((systemSize * 1000) / PANEL_WATTAGE) // Recalculate panel count based on cap

  // Recalculate yearly generation proportionally to capped system
  const generationRatio = systemSize / calculatedSystemSize
  const yearlyGeneration = bestConfig.yearlyEnergyDcKwh * SYSTEM_EFFICIENCY * generationRatio

  // Calculate financial metrics
  const withGrant = calculateFinancials(systemSize, yearlyGeneration, true)
  const withoutGrant = calculateFinancials(systemSize, yearlyGeneration, false)

  return {
    panelsCount,
    systemSize,
    yearlyGeneration,
    roofArea: solarPotential.wholeRoofStats.areaMeters2,
    maxSunshineHours: solarPotential.maxSunshineHoursPerYear,
    withGrant,
    withoutGrant,
    roofSegments: solarPotential.roofSegmentStats.map(segment => ({
      area: segment.stats.areaMeters2,
      pitch: segment.pitchDegrees,
      azimuth: segment.azimuthDegrees,
      optimalForSolar: segment.azimuthDegrees >= 135 && segment.azimuthDegrees <= 225 // South-facing
    }))
  }
}

// Calculate financial metrics for Malta
export const calculateFinancials = (
  systemSize: number,
  yearlyGeneration: number,
  withGrant: boolean
) => {
  const INSTALLATION_COST_PER_KW = 1500 // EUR per kW (estimated)
  const MALTA_GRANT_MAX = 2500 // EUR (2025 scheme)
  const GRANT_PERCENTAGE = 0.5 // 50% of installation cost
  const FEED_IN_TARIFF = withGrant ? 0.105 : 0.15 // EUR per kWh
  const PANEL_DEGRADATION = 0.005 // 0.5% per year
  const YEARS = 20

  const installationCost = systemSize * INSTALLATION_COST_PER_KW
  const grantAmount = withGrant ? Math.min(installationCost * GRANT_PERCENTAGE, MALTA_GRANT_MAX) : 0
  const upfrontCost = installationCost - grantAmount

  let totalSavings = -upfrontCost
  let roiYear = 0
  const projections = []

  for (let year = 1; year <= YEARS; year++) {
    const degradation = Math.pow(1 - PANEL_DEGRADATION, year - 1)
    const yearGeneration = yearlyGeneration * degradation
    const yearRevenue = yearGeneration * FEED_IN_TARIFF

    totalSavings += yearRevenue

    if (totalSavings > 0 && roiYear === 0) {
      roiYear = year
    }

    projections.push({
      year,
      generation: yearGeneration,
      revenue: yearRevenue,
      cumulativeSavings: totalSavings,
      degradationFactor: degradation
    })
  }

  return {
    installationCost,
    grantAmount,
    upfrontCost,
    feedInTariff: FEED_IN_TARIFF,
    yearlyRevenue: yearlyGeneration * FEED_IN_TARIFF,
    roiYears: roiYear || YEARS + 1,
    twentyYearSavings: totalSavings + upfrontCost,
    totalReturn: totalSavings,
    projections
  }
}

// Check if Google Solar API is available for location
export const checkSolarApiAvailability = async (
  lat: number,
  lng: number
): Promise<boolean> => {
  try {
    await getBuildingInsights(lat, lng, 'LOW')
    return true
  } catch (error: any) {
    if (error.message === 'LOCATION_NOT_FOUND') {
      return false
    }
    // For other errors, we might want to retry or handle differently
    throw error
  }
}