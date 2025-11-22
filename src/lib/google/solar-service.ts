import axios from 'axios'
import { MALTA_CONFIG, GRANT_CONFIG, FEED_IN_TARIFFS } from '@/config/constants'
import { getLocationType } from '@/lib/utils/location'

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
  imageryQuality?: 'HIGH' | 'MEDIUM' | 'BASE'
  solarPotential: SolarPotential
}

export interface DataLayersResponse {
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
  dsmUrl: string
  rgbUrl: string
  maskUrl: string
  annualFluxUrl: string
  monthlyFluxUrl: string
  hourlyShadeUrls: string[]
  imageryQuality: 'HIGH' | 'MEDIUM' | 'BASE'
}

export interface GeoTiffOptions {
  pixelSizeMeters?: number
  radiusMeters?: number
  view?: 'DSM_LAYER' | 'RGB_LAYER' | 'MASK_LAYER' | 'ANNUAL_FLUX_LAYER' | 'MONTHLY_FLUX_LAYER' | 'HOURLY_SHADE_LAYER'
}

// Get building insights from Google Solar API
export const getBuildingInsights = async (
  lat: number,
  lng: number,
  requiredQuality: 'HIGH' | 'MEDIUM' | 'BASE' = 'HIGH'
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
    console.error('Solar API error response:', error.response?.data)
    console.error('Solar API error status:', error.response?.status)

    const errorMessage = error.response?.data?.error?.message ||
                         error.response?.data?.message ||
                         error.message ||
                         'Failed to fetch solar insights'
    throw new Error(errorMessage)
  }
}

// Calculate solar panel configuration for Malta
export const calculateSolarConfiguration = (
  solarPotential: SolarPotential,
  lat: number,
  lng: number
) => {
  // Use Malta-specific parameters
  const MALTA_SOLAR_IRRADIANCE = MALTA_CONFIG.SOLAR_IRRADIANCE
  const SYSTEM_EFFICIENCY = MALTA_CONFIG.SYSTEM_EFFICIENCY
  const PANEL_WATTAGE = MALTA_CONFIG.PANEL_WATTAGE

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

  // Calculate financial metrics for both grant scenarios
  const withGrant = calculateFinancials(systemSize, yearlyGeneration, true, lat, lng)
  const withoutGrant = calculateFinancials(systemSize, yearlyGeneration, false, lat, lng)

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

// Calculate financial metrics for Malta/Gozo with 2025 grant scheme
export const calculateFinancials = (
  systemSize: number,
  yearlyGeneration: number,
  withGrant: boolean,
  lat: number,
  lng: number,
  options: {
    inverterType?: 'standard' | 'hybrid'
    batteryCapacityKWh?: number
  } = {}
) => {
  const { inverterType = 'hybrid', batteryCapacityKWh = 0 } = options

  // Detect region for grant calculation
  const region = getLocationType(lat, lng)
  const isGozo = region === 'gozo'
  const grantConfig = isGozo ? GRANT_CONFIG.GOZO : GRANT_CONFIG.MALTA

  // System costs
  const INSTALLATION_COST_PER_KW = MALTA_CONFIG.COST_PER_KW
  const BATTERY_COST_PER_KWH = 900 // EUR per kWh (typical lithium battery cost)
  const installationCost = systemSize * INSTALLATION_COST_PER_KW
  const batteryCost = batteryCapacityKWh * BATTERY_COST_PER_KWH
  const totalSystemCost = installationCost + batteryCost

  // Calculate grant amount (maximum possible grant)
  let grantAmount = 0
  let grantBreakdown = {
    solar: 0,
    battery: 0,
    hybridInverter: 0,
    total: 0,
    region: isGozo ? 'Gozo' : 'Malta'
  }

  if (withGrant) {
    // Solar PV grant (hybrid inverter gives €500 more)
    const solarGrantConfig = inverterType === 'hybrid'
      ? grantConfig.SOLAR_HYBRID_INVERTER
      : grantConfig.SOLAR_STANDARD_INVERTER

    const solarGrantByPercentage = installationCost * solarGrantConfig.percentage
    const solarGrantByCapacity = systemSize * solarGrantConfig.perKWp
    const solarGrant = Math.min(solarGrantByPercentage, solarGrantByCapacity, solarGrantConfig.maxAmount)
    grantBreakdown.solar = solarGrant

    // Battery storage grant (if battery is included)
    if (batteryCapacityKWh > 0) {
      const batteryGrantByPercentage = batteryCost * grantConfig.BATTERY.percentage
      const batteryGrantByCapacity = batteryCapacityKWh * grantConfig.BATTERY.perKWh
      const batteryGrant = Math.min(batteryGrantByPercentage, batteryGrantByCapacity, grantConfig.BATTERY.maxAmount)
      grantBreakdown.battery = batteryGrant

      // Hybrid inverter grant (only when battery is installed)
      if (inverterType === 'hybrid') {
        const HYBRID_INVERTER_COST_ESTIMATE = systemSize * 450 // EUR (rough estimate)
        const hybridInverterGrantByPercentage = HYBRID_INVERTER_COST_ESTIMATE * grantConfig.HYBRID_INVERTER_WITH_BATTERY.percentage
        const hybridInverterGrantByCapacity = systemSize * grantConfig.HYBRID_INVERTER_WITH_BATTERY.perKWp
        const hybridInverterGrant = Math.min(
          hybridInverterGrantByPercentage,
          hybridInverterGrantByCapacity,
          grantConfig.HYBRID_INVERTER_WITH_BATTERY.maxAmount
        )
        grantBreakdown.hybridInverter = hybridInverterGrant
      }
    }

    grantAmount = grantBreakdown.solar + grantBreakdown.battery + grantBreakdown.hybridInverter
    grantBreakdown.total = grantAmount

    // Cap at maximum combined grant
    if (grantAmount > grantConfig.MAX_COMBINED_GRANT) {
      grantAmount = grantConfig.MAX_COMBINED_GRANT
      grantBreakdown.total = grantAmount
    }
  }

  // Feed-in tariff based on grant decision
  const feedInTariff = withGrant ? FEED_IN_TARIFFS.WITH_GRANT : FEED_IN_TARIFFS.WITHOUT_GRANT

  // Calculate ROI with 20-year projection
  const upfrontCost = totalSystemCost - grantAmount
  const YEARS = FEED_IN_TARIFFS.GUARANTEE_YEARS
  const PANEL_DEGRADATION = MALTA_CONFIG.PANEL_DEGRADATION_RATE

  let totalSavings = -upfrontCost
  let roiYear = 0
  const projections = []

  for (let year = 1; year <= YEARS; year++) {
    const degradation = Math.pow(1 - PANEL_DEGRADATION, year - 1)
    const yearGeneration = yearlyGeneration * degradation
    const yearRevenue = yearGeneration * feedInTariff

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
    batteryCost,
    totalSystemCost,
    grantAmount,
    grantBreakdown,
    upfrontCost,
    feedInTariff,
    yearlyRevenue: yearlyGeneration * feedInTariff,
    roiYears: roiYear || YEARS + 1,
    twentyYearSavings: totalSavings + upfrontCost,
    totalReturn: totalSavings,
    projections,
    region: isGozo ? 'Gozo' : 'Malta'
  }
}

// Check if Google Solar API is available for location
export const checkSolarApiAvailability = async (
  lat: number,
  lng: number
): Promise<boolean> => {
  try {
    await getBuildingInsights(lat, lng, 'BASE')
    return true
  } catch (error: any) {
    if (error.message === 'LOCATION_NOT_FOUND') {
      return false
    }
    // For other errors, we might want to retry or handle differently
    throw error
  }
}

// Get data layers for visualization
export const getDataLayers = async (
  lat: number,
  lng: number,
  radiusMeters: number = 100,
  requiredQuality: 'HIGH' | 'MEDIUM' | 'BASE' = 'HIGH'
): Promise<DataLayersResponse> => {
  try {
    const response = await axios.get(
      `${SOLAR_API_BASE}/dataLayers:get`,
      {
        params: {
          'location.latitude': lat,
          'location.longitude': lng,
          radiusMeters,
          requiredQuality,
          view: 'FULL_LAYERS',
          key: process.env.GOOGLE_SOLAR_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      }
    )

    return response.data
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('LOCATION_NOT_FOUND')
    }
    console.error('Data Layers API error:', error)
    throw new Error('Failed to fetch data layers')
  }
}

// Get GeoTIFF URL for specific layer type
export const getGeoTiffUrl = (
  lat: number,
  lng: number,
  options: GeoTiffOptions = {}
): string => {
  const {
    pixelSizeMeters = 0.5,
    radiusMeters = 100,
    view = 'ANNUAL_FLUX_LAYER'
  } = options

  const apiKey = process.env.GOOGLE_SOLAR_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const params = new URLSearchParams({
    'location.latitude': lat.toString(),
    'location.longitude': lng.toString(),
    radiusMeters: radiusMeters.toString(),
    pixelSizeMeters: pixelSizeMeters.toString(),
    view,
    key: apiKey || ''
  })

  return `${SOLAR_API_BASE}/geoTiff:get?${params.toString()}`
}

// Calculate sunlight intensity from roof segment stats
export const calculateSunlightIntensity = (
  sunshineQuantiles: number[]
): { min: number; max: number; average: number; quality: 'excellent' | 'good' | 'fair' | 'poor' } => {
  if (!sunshineQuantiles || sunshineQuantiles.length === 0) {
    return { min: 0, max: 0, average: 0, quality: 'poor' }
  }

  const min = Math.min(...sunshineQuantiles)
  const max = Math.max(...sunshineQuantiles)
  const average = sunshineQuantiles.reduce((sum, val) => sum + val, 0) / sunshineQuantiles.length

  let quality: 'excellent' | 'good' | 'fair' | 'poor'
  if (average >= 1500) quality = 'excellent'
  else if (average >= 1200) quality = 'good'
  else if (average >= 900) quality = 'fair'
  else quality = 'poor'

  return { min, max, average, quality }
}

// Extract visualization data from building insights with real GeoTIFF data layers
export const extractVisualizationData = async (
  buildingInsights: BuildingInsightsResponse,
  pinLat: number,
  pinLng: number
) => {
  const { solarPotential, center, imageryQuality } = buildingInsights

  // Fetch real data layers (irradiation, shadows, height) for the exact pin location
  let dataLayers: {
    annualFluxUrl: string
    monthlyFluxUrl: string
    dsmUrl: string
    rgbUrl: string
    maskUrl: string
    shadowPatterns: {
      summerSolstice: string
      winterSolstice: string
      equinox: string
    }
  } | null = null

  try {
    console.log(`[SOLAR-SERVICE] Fetching data layers for pin location: (${pinLat}, ${pinLng})`)

    const dataLayersResponse = await getDataLayers(pinLat, pinLng, 50, 'BASE')

    // hourlyShadeUrls contains shadow data for each hour of the year
    // Array length: 365 days * 24 hours = 8760 entries
    const hourlyShadeUrls = dataLayersResponse.hourlyShadeUrls

    // Calculate indices for specific days at noon (12:00)
    const HOURS_PER_DAY = 24
    const NOON_HOUR = 12

    // Day of year calculations (approximate):
    // Summer Solstice: June 21 (day ~172)
    // Winter Solstice: December 21 (day ~355)
    // Spring Equinox: March 21 (day ~80)
    const SUMMER_SOLSTICE_DAY = 172
    const WINTER_SOLSTICE_DAY = 355
    const EQUINOX_DAY = 80

    const summerIndex = (SUMMER_SOLSTICE_DAY * HOURS_PER_DAY) + NOON_HOUR
    const winterIndex = (WINTER_SOLSTICE_DAY * HOURS_PER_DAY) + NOON_HOUR
    const equinoxIndex = (EQUINOX_DAY * HOURS_PER_DAY) + NOON_HOUR

    dataLayers = {
      annualFluxUrl: dataLayersResponse.annualFluxUrl,
      monthlyFluxUrl: dataLayersResponse.monthlyFluxUrl,
      dsmUrl: dataLayersResponse.dsmUrl,
      rgbUrl: dataLayersResponse.rgbUrl,
      maskUrl: dataLayersResponse.maskUrl,
      shadowPatterns: {
        summerSolstice: hourlyShadeUrls[summerIndex] || hourlyShadeUrls[0],
        winterSolstice: hourlyShadeUrls[winterIndex] || hourlyShadeUrls[0],
        equinox: hourlyShadeUrls[equinoxIndex] || hourlyShadeUrls[0]
      }
    }

    console.log('[SOLAR-SERVICE] Data layers fetched successfully:', {
      hasAnnualFlux: !!dataLayers.annualFluxUrl,
      hasDSM: !!dataLayers.dsmUrl,
      hasShadows: !!dataLayers.shadowPatterns.summerSolstice,
      totalShadeUrls: hourlyShadeUrls.length
    })
  } catch (error: any) {
    console.error('[SOLAR-SERVICE] Failed to fetch data layers:', error.message)
    // Continue without data layers - visualization will use fallback mode
    dataLayers = null
  }

  // Process roof segments with sunlight intensity
  const roofSegments = solarPotential.roofSegmentStats.map((segment, index) => {
    const intensity = calculateSunlightIntensity(segment.stats.sunshineQuantiles)

    return {
      id: `segment-${index}`,
      center: segment.center,
      boundingBox: segment.boundingBox,
      area: segment.stats.areaMeters2,
      pitch: segment.pitchDegrees,
      azimuth: segment.azimuthDegrees,
      height: segment.planeHeightAtCenterMeters,
      sunlightIntensity: intensity,
      // Determine if segment is optimal for solar (south-facing, good angle)
      isOptimal: segment.azimuthDegrees >= 135 && segment.azimuthDegrees <= 225 &&
                 segment.pitchDegrees >= 15 && segment.pitchDegrees <= 40
    }
  })

  // Sort by sunlight intensity (best first)
  roofSegments.sort((a, b) => b.sunlightIntensity.average - a.sunlightIntensity.average)

  return {
    buildingCenter: center,
    pinLocation: { latitude: pinLat, longitude: pinLng },
    imageryQuality: imageryQuality || 'MEDIUM',
    roofSegments,
    totalRoofArea: solarPotential.wholeRoofStats.areaMeters2,
    maxPanels: solarPotential.maxArrayPanelsCount,
    panelDimensions: {
      width: solarPotential.panelWidthMeters,
      height: solarPotential.panelHeightMeters,
      capacity: solarPotential.panelCapacityWatts
    },
    dataLayers
  }
}