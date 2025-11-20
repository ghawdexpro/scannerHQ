import { fromUrl, GeoTIFF } from 'geotiff'

export interface GeoTiffData {
  width: number
  height: number
  data: Float32Array | Uint8Array
  min: number
  max: number
  bounds: {
    west: number
    south: number
    east: number
    north: number
  }
}

/**
 * Fetch and parse a GeoTIFF file from a URL
 */
export const fetchGeoTiff = async (url: string): Promise<GeoTIFF> => {
  try {
    console.log('[GEOTIFF] Fetching:', url)
    const tiff = await fromUrl(url)
    return tiff
  } catch (error: any) {
    console.error('[GEOTIFF] Failed to fetch:', error.message)
    throw new Error(`Failed to fetch GeoTIFF: ${error.message}`)
  }
}

/**
 * Parse GeoTIFF and extract raster data
 */
export const parseGeoTiff = async (tiff: GeoTIFF): Promise<GeoTiffData> => {
  try {
    const image = await tiff.getImage()
    const rasters = await image.readRasters()
    const data = rasters[0] as Float32Array | Uint8Array

    // Get image dimensions
    const width = image.getWidth()
    const height = image.getHeight()

    // Calculate min/max values
    let min = Infinity
    let max = -Infinity
    for (let i = 0; i < data.length; i++) {
      const value = data[i]
      if (value < min) min = value
      if (value > max) max = value
    }

    // Get geographic bounds
    const bbox = image.getBoundingBox()

    return {
      width,
      height,
      data,
      min,
      max,
      bounds: {
        west: bbox[0],
        south: bbox[1],
        east: bbox[2],
        north: bbox[3]
      }
    }
  } catch (error: any) {
    console.error('[GEOTIFF] Failed to parse:', error.message)
    throw new Error(`Failed to parse GeoTIFF: ${error.message}`)
  }
}

/**
 * Fetch and parse GeoTIFF in one call
 */
export const fetchAndParseGeoTiff = async (url: string): Promise<GeoTiffData> => {
  const tiff = await fetchGeoTiff(url)
  return await parseGeoTiff(tiff)
}

/**
 * Normalize flux data values to 0-1 range for visualization
 */
export const normalizeFluxData = (
  data: Float32Array | Uint8Array,
  min: number,
  max: number
): Float32Array => {
  const normalized = new Float32Array(data.length)
  const range = max - min

  for (let i = 0; i < data.length; i++) {
    normalized[i] = range > 0 ? (data[i] - min) / range : 0
  }

  return normalized
}

/**
 * Map a normalized value (0-1) to a heatmap color
 * Returns RGB color array [r, g, b]
 */
export const getHeatmapColor = (value: number): [number, number, number] => {
  // Clamp value between 0 and 1
  const v = Math.max(0, Math.min(1, value))

  // Color gradient: blue (low) -> green -> yellow -> orange -> red (high)
  if (v < 0.2) {
    // Blue to cyan
    const t = v / 0.2
    return [0, Math.floor(t * 128), Math.floor(128 + t * 127)]
  } else if (v < 0.4) {
    // Cyan to green
    const t = (v - 0.2) / 0.2
    return [0, Math.floor(128 + t * 127), Math.floor(255 - t * 255)]
  } else if (v < 0.6) {
    // Green to yellow
    const t = (v - 0.4) / 0.2
    return [Math.floor(t * 255), 255, 0]
  } else if (v < 0.8) {
    // Yellow to orange
    const t = (v - 0.6) / 0.2
    return [255, Math.floor(255 - t * 100), 0]
  } else {
    // Orange to red
    const t = (v - 0.8) / 0.2
    return [255, Math.floor(155 - t * 155), 0]
  }
}

/**
 * Convert GeoTIFF data to ImageData for canvas rendering
 */
export const geoTiffToImageData = (
  geoTiffData: GeoTiffData,
  opacity: number = 0.7
): ImageData => {
  const { width, height, data, min, max } = geoTiffData
  const normalized = normalizeFluxData(data, min, max)

  const imageData = new ImageData(width, height)
  const pixels = imageData.data

  for (let i = 0; i < normalized.length; i++) {
    const [r, g, b] = getHeatmapColor(normalized[i])
    const pixelIndex = i * 4

    pixels[pixelIndex] = r
    pixels[pixelIndex + 1] = g
    pixels[pixelIndex + 2] = b
    pixels[pixelIndex + 3] = Math.floor(opacity * 255)
  }

  return imageData
}

/**
 * Extract pixel value at specific lat/lng coordinates
 */
export const getValueAtCoordinate = (
  geoTiffData: GeoTiffData,
  lat: number,
  lng: number
): number | null => {
  const { bounds, width, height, data } = geoTiffData

  // Check if coordinate is within bounds
  if (lat < bounds.south || lat > bounds.north ||
      lng < bounds.west || lng > bounds.east) {
    return null
  }

  // Convert lat/lng to pixel coordinates
  const x = Math.floor(((lng - bounds.west) / (bounds.east - bounds.west)) * width)
  const y = Math.floor(((bounds.north - lat) / (bounds.north - bounds.south)) * height)

  // Get pixel index
  const index = y * width + x

  if (index < 0 || index >= data.length) {
    return null
  }

  return data[index]
}

/**
 * Get flux category based on kWh/m²/year value
 */
export const getFluxCategory = (kwhPerM2Year: number): {
  category: 'excellent' | 'good' | 'fair' | 'poor'
  color: string
  label: string
} => {
  if (kwhPerM2Year >= 1650) {
    return {
      category: 'excellent',
      color: '#ef4444', // red-500
      label: 'Excellent'
    }
  } else if (kwhPerM2Year >= 1460) {
    return {
      category: 'good',
      color: '#f97316', // orange-500
      label: 'Good'
    }
  } else if (kwhPerM2Year >= 1280) {
    return {
      category: 'fair',
      color: '#eab308', // yellow-500
      label: 'Fair'
    }
  } else {
    return {
      category: 'poor',
      color: '#3b82f6', // blue-500
      label: 'Poor'
    }
  }
}
