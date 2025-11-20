import { downloadGeoTIFF, GeoTiffData } from './geotiff-processor'
import {
  renderPalette,
  renderRGB,
  ironPalette,
  rainbowPalette,
  binaryPalette,
  type GeoTiff,
} from './visualize'

export type LayerId = 'mask' | 'dsm' | 'rgb' | 'annualFlux' | 'monthlyFlux' | 'hourlyShade'

export interface Layer {
  id: LayerId
  bounds: google.maps.LatLngBoundsLiteral
  canvases: HTMLCanvasElement[]
  palette?: {
    colors: string[]
    min: string
    max: string
  }
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

/**
 * Load and prepare a layer for display
 */
export async function getLayer(
  layerId: LayerId,
  urls: DataLayersResponse,
  options?: {
    dayOfYear?: number // For hourlyShade layer (1-365)
    showcaseMode?: boolean // For hourlyShade - show only daylight hours (16 frames vs 24)
  }
): Promise<Layer> {
  console.log('[LayerLoader] ========== getLayer() CALL ==========')
  console.log('[LayerLoader] Requested layer:', layerId)
  console.log('[LayerLoader] Options:', options)
  console.log('[LayerLoader] URLs available:', {
    hasDsmUrl: !!urls.dsmUrl,
    hasRgbUrl: !!urls.rgbUrl,
    hasMaskUrl: !!urls.maskUrl,
    hasAnnualFluxUrl: !!urls.annualFluxUrl,
    hasMonthlyFluxUrl: !!urls.monthlyFluxUrl,
    hourlyShadeUrlsCount: urls.hourlyShadeUrls?.length || 0,
  })

  try {
    let result: Layer
    switch (layerId) {
      case 'mask':
        console.log('[LayerLoader] Loading mask layer...')
        result = await loadMaskLayer(urls)
        break
      case 'dsm':
        console.log('[LayerLoader] Loading DSM layer...')
        result = await loadDsmLayer(urls)
        break
      case 'rgb':
        console.log('[LayerLoader] Loading RGB layer...')
        result = await loadRgbLayer(urls)
        break
      case 'annualFlux':
        console.log('[LayerLoader] Loading annual flux layer...')
        result = await loadAnnualFluxLayer(urls)
        break
      case 'monthlyFlux':
        console.log('[LayerLoader] Loading monthly flux layer...')
        result = await loadMonthlyFluxLayer(urls)
        break
      case 'hourlyShade':
        console.log('[LayerLoader] Loading hourly shade layer...')
        result = await loadHourlyShadeLayer(urls, options?.dayOfYear, options?.showcaseMode)
        break
      default:
        throw new Error(`Unknown layer: ${layerId}`)
    }
    console.log('[LayerLoader] ✅ Layer loaded successfully:', result.id, 'with', result.canvases.length, 'canvases')
    console.log('[LayerLoader] =========================================')
    return result
  } catch (error) {
    console.error('[LayerLoader] ❌ Error loading layer:', layerId)
    console.error('[LayerLoader] Error details:', error)
    console.error('[LayerLoader] =========================================')
    throw error
  }
}

async function loadMaskLayer(urls: DataLayersResponse): Promise<Layer> {
  const mask = await downloadGeoTIFF(urls.maskUrl)

  return {
    id: 'mask',
    bounds: toBounds(mask.bounds),
    canvases: [
      renderPalette({
        data: mask,
        colors: binaryPalette,
      }),
    ],
    palette: {
      colors: binaryPalette,
      min: 'No roof',
      max: 'Roof',
    },
  }
}

async function loadDsmLayer(urls: DataLayersResponse): Promise<Layer> {
  const [mask, data] = await Promise.all([
    downloadGeoTIFF(urls.maskUrl),
    downloadGeoTIFF(urls.dsmUrl),
  ])

  const values = data.rasters[0]
  const sorted = [...values].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]

  return {
    id: 'dsm',
    bounds: toBounds(mask.bounds),
    canvases: [
      renderPalette({
        data,
        mask,
        colors: rainbowPalette,
        min,
        max,
      }),
    ],
    palette: {
      colors: rainbowPalette,
      min: `${min.toFixed(1)} m`,
      max: `${max.toFixed(1)} m`,
    },
  }
}

async function loadRgbLayer(urls: DataLayersResponse): Promise<Layer> {
  const [mask, data] = await Promise.all([
    downloadGeoTIFF(urls.maskUrl),
    downloadGeoTIFF(urls.rgbUrl),
  ])

  return {
    id: 'rgb',
    bounds: toBounds(mask.bounds),
    canvases: [renderRGB(data, mask)],
  }
}

async function loadAnnualFluxLayer(urls: DataLayersResponse): Promise<Layer> {
  const [mask, data] = await Promise.all([
    downloadGeoTIFF(urls.maskUrl),
    downloadGeoTIFF(urls.annualFluxUrl),
  ])

  const values = data.rasters[0]
  const sorted = [...values].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]

  return {
    id: 'annualFlux',
    bounds: toBounds(mask.bounds),
    canvases: [
      renderPalette({
        data,
        mask,
        colors: ironPalette,
        min,
        max,
      }),
    ],
    palette: {
      colors: ironPalette,
      min: `${Math.round(min)} kWh/m²/year`,
      max: `${Math.round(max)} kWh/m²/year`,
    },
  }
}

async function loadMonthlyFluxLayer(urls: DataLayersResponse): Promise<Layer> {
  const [mask, data] = await Promise.all([
    downloadGeoTIFF(urls.maskUrl),
    downloadGeoTIFF(urls.monthlyFluxUrl),
  ])

  // Render all 12 months
  const canvases = [...Array(12).keys()].map((month) =>
    renderPalette({
      data,
      mask,
      colors: ironPalette,
      min: 0,
      max: 200,
      index: month,
    })
  )

  return {
    id: 'monthlyFlux',
    bounds: toBounds(mask.bounds),
    canvases,
    palette: {
      colors: ironPalette,
      min: 'Low',
      max: 'High',
    },
  }
}

async function loadHourlyShadeLayer(
  urls: DataLayersResponse,
  dayOfYear: number = 172, // Default to summer solstice
  showcaseMode: boolean = false
): Promise<Layer> {
  const mask = await downloadGeoTIFF(urls.maskUrl)

  const HOURS_PER_DAY = 24

  // In showcase mode, show only daylight hours (5AM-8PM = 16 hours)
  // In normal mode, show all 24 hours
  const hoursToShow = showcaseMode
    ? [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] // 5AM-8PM (16 hours)
    : Array.from({ length: 24 }, (_, i) => i) // All 24 hours

  const hourUrls = hoursToShow.map(hour => {
    const index = (dayOfYear * HOURS_PER_DAY) + hour
    return urls.hourlyShadeUrls[index]
  })

  const hours = await Promise.all(hourUrls.map(url => downloadGeoTIFF(url)))

  const canvases = hours.map(data =>
    renderPalette({
      data,
      mask,
      colors: binaryPalette,
    })
  )

  return {
    id: 'hourlyShade',
    bounds: toBounds(mask.bounds),
    canvases,
    palette: {
      colors: binaryPalette,
      min: 'Shadow',
      max: 'Sunlight',
    },
  }
}

function toBounds(bounds: {
  north: number
  south: number
  east: number
  west: number
}): google.maps.LatLngBoundsLiteral {
  return {
    north: bounds.north,
    south: bounds.south,
    east: bounds.east,
    west: bounds.west,
  }
}
