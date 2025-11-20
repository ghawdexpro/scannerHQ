import { downloadGeoTIFF, GeoTiffData } from './geotiff-processor'
import {
  renderPalette,
  renderRGB,
  ironPalette,
  rainbowPalette,
  binaryPalette,
} from './geotiff-renderer'

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
  urls: DataLayersResponse
): Promise<Layer> {

  switch (layerId) {
    case 'mask':
      return await loadMaskLayer(urls)
    case 'dsm':
      return await loadDsmLayer(urls)
    case 'rgb':
      return await loadRgbLayer(urls)
    case 'annualFlux':
      return await loadAnnualFluxLayer(urls)
    case 'monthlyFlux':
      return await loadMonthlyFluxLayer(urls)
    case 'hourlyShade':
      return await loadHourlyShadeLayer(urls)
    default:
      throw new Error(`Unknown layer: ${layerId}`)
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

async function loadHourlyShadeLayer(urls: DataLayersResponse): Promise<Layer> {
  const mask = await downloadGeoTIFF(urls.maskUrl)

  // Download only a few hours for demo (downloading all 8760 would take too long)
  // Summer solstice (day 172), noon hour 12
  const HOURS_PER_DAY = 24
  const SUMMER_SOLSTICE_DAY = 172
  const hoursToShow = [5, 8, 12, 16, 20] // 5AM, 8AM, noon, 4PM, 8PM

  const hourUrls = hoursToShow.map(hour => {
    const index = (SUMMER_SOLSTICE_DAY * HOURS_PER_DAY) + hour
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
