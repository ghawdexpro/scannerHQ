import * as geotiff from 'geotiff'
import * as geokeysToProj4 from 'geotiff-geokeys-to-proj4'
import proj4 from 'proj4'

export interface GeoTiffData {
  width: number
  height: number
  rasters: Array<number>[]
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
}

/**
 * Convert day-of-year (1-365) to month (1-12) and day (1-31)
 * Assumes non-leap year (365 days)
 */
export function dayOfYearToMonthDay(dayOfYear: number): { month: number; day: number } {
  const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let daysRemaining = dayOfYear

  for (let month = 0; month < 12; month++) {
    const daysInMonth = daysInMonths[month]
    if (daysRemaining <= daysInMonth) {
      return { month: month + 1, day: daysRemaining }
    }
    daysRemaining -= daysInMonth
  }

  // Fallback (shouldn't reach here with valid input)
  return { month: 12, day: 31 }
}

/**
 * Extract sunlight bit from a pixel value for a specific day
 * Each 32-bit pixel encodes visibility for 31 days (bit 0 = day 1, bit 30 = day 31)
 * Returns 1 if sun visible on that day, 0 if shade
 */
export function decodeSunlightBit(pixelValue: number, dayOfMonth: number): number {
  // Bit position is dayOfMonth - 1 (0-indexed)
  const bitPosition = dayOfMonth - 1
  // Check if the bit is set: (pixelValue >> bitPosition) & 1
  return (pixelValue >> bitPosition) & 1
}

/**
 * Decode an entire raster band for a specific day of month
 * Returns array of 0 (shade) or 1 (sun) for each pixel
 */
export function decodeHourlyShadeRaster(raster: number[], dayOfMonth: number): number[] {
  return raster.map(pixelValue => decodeSunlightBit(pixelValue, dayOfMonth))
}

/**
 * Download and parse a GeoTIFF from Google Solar API
 * Uses proxy route to avoid CORS and authentication issues
 */
export async function downloadGeoTIFF(url: string): Promise<GeoTiffData> {
  console.log('[GEOTIFF] ========== DOWNLOAD START ==========')
  console.log('[GEOTIFF] Original URL:', url.substring(0, 150) + '...')

  let fetchUrl = url

  // If URL is from Solar API, route through proxy
  if (url.includes('solar.googleapis.com')) {
    const urlObj = new URL(url)
    const id = urlObj.searchParams.get('id')

    if (id) {
      fetchUrl = `/api/solar/geotiff?id=${id}`
      console.log('[GEOTIFF] Using proxy route:', fetchUrl)
    } else {
      console.warn('[GEOTIFF] ⚠️ Solar API URL but no ID parameter found')
    }
  }

  console.log('[GEOTIFF] Fetching from:', fetchUrl)
  const startTime = Date.now()
  const response = await fetch(fetchUrl)
  const fetchTime = Date.now() - startTime

  console.log('[GEOTIFF] Response received in', fetchTime, 'ms')
  console.log('[GEOTIFF] Status:', response.status, response.statusText)
  console.log('[GEOTIFF] Headers:', {
    contentType: response.headers.get('content-type'),
    contentLength: response.headers.get('content-length'),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[GEOTIFF] ❌ Download failed')
    console.error('[GEOTIFF] Status:', response.status, response.statusText)
    console.error('[GEOTIFF] Error body:', errorText.substring(0, 500))
    console.error('[GEOTIFF] ========== DOWNLOAD FAILED ==========')
    throw new Error(`Failed to download GeoTIFF: ${response.status}`)
  }

  console.log('[GEOTIFF] Reading array buffer...')
  const arrayBuffer = await response.arrayBuffer()
  console.log('[GEOTIFF] ✅ Downloaded successfully')
  console.log('[GEOTIFF] Size:', (arrayBuffer.byteLength / 1024).toFixed(2), 'KB')

  // Parse GeoTIFF
  console.log('[GEOTIFF] Parsing GeoTIFF...')
  const tiff = await geotiff.fromArrayBuffer(arrayBuffer)
  const image = await tiff.getImage()
  const rasters = await image.readRasters()

  console.log('[GEOTIFF] Reading raster data...')
  console.log('[GEOTIFF] Dimensions:', rasters.width, 'x', rasters.height)
  console.log('[GEOTIFF] Bands:', rasters.length)

  // Reproject bounding box to lat/lng
  console.log('[GEOTIFF] Reprojecting bounds...')
  const geoKeys = image.getGeoKeys()
  const projObj = geokeysToProj4.toProj4(geoKeys)
  const projection = proj4(projObj.proj4, 'WGS84')
  const box = image.getBoundingBox()

  const sw = projection.forward({
    x: box[0] * projObj.coordinatesConversionParameters.x,
    y: box[1] * projObj.coordinatesConversionParameters.y,
  })

  const ne = projection.forward({
    x: box[2] * projObj.coordinatesConversionParameters.x,
    y: box[3] * projObj.coordinatesConversionParameters.y,
  })

  console.log('[GEOTIFF] ✅ Parsed successfully')
  console.log('[GEOTIFF] Final data:', {
    width: rasters.width,
    height: rasters.height,
    bands: rasters.length,
    bounds: {
      north: ne.y.toFixed(6),
      south: sw.y.toFixed(6),
      east: ne.x.toFixed(6),
      west: sw.x.toFixed(6)
    }
  })
  console.log('[GEOTIFF] ========== DOWNLOAD END ==========')

  return {
    width: rasters.width,
    height: rasters.height,
    rasters: [...Array(rasters.length).keys()].map((i) =>
      Array.from(rasters[i] as geotiff.TypedArray),
    ),
    bounds: {
      north: ne.y,
      south: sw.y,
      east: ne.x,
      west: sw.x,
    },
  }
}
