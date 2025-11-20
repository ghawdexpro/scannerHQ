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
 * Download and parse a GeoTIFF from Google Solar API
 * Uses proxy route to avoid CORS and authentication issues
 */
export async function downloadGeoTIFF(url: string): Promise<GeoTiffData> {
  console.log('[GEOTIFF] Downloading:', url)

  let fetchUrl = url

  // If URL is from Solar API, route through proxy
  if (url.includes('solar.googleapis.com')) {
    const urlObj = new URL(url)
    const id = urlObj.searchParams.get('id')

    if (id) {
      fetchUrl = `/api/solar/geotiff?id=${id}`
      console.log('[GEOTIFF] Using proxy:', fetchUrl)
    }
  }

  const response = await fetch(fetchUrl)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[GEOTIFF] Download failed:', errorText)
    throw new Error(`Failed to download GeoTIFF: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  console.log('[GEOTIFF] Downloaded, size:', arrayBuffer.byteLength, 'bytes')

  // Parse GeoTIFF
  const tiff = await geotiff.fromArrayBuffer(arrayBuffer)
  const image = await tiff.getImage()
  const rasters = await image.readRasters()

  // Reproject bounding box to lat/lng
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

  console.log('[GEOTIFF] Parsed successfully:', {
    width: rasters.width,
    height: rasters.height,
    bands: rasters.length,
    bounds: { sw, ne }
  })

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
