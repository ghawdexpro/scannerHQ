# Layer Animation Implementation Guide - Port from solarscan-2.0

## Executive Summary

This guide provides step-by-step instructions to port the **working Google Solar API layer animation** from the solarscan-2.0 app to Solar Scan GE.

**Current Problem:**
- GeoTIFF files not loading (404 errors, CORS issues, authentication failures)
- Visualization stuck at 50% (Height Analysis stage)
- No images or overlays displaying

**Root Cause:**
- Current implementation tries to fetch GeoTIFFs directly from client-side
- Google Solar API URLs require server-side authentication
- Missing proper GeoTIFF processing and canvas rendering pipeline

**Solution:**
- Port the proven working approach from solarscan-2.0
- Use server-side proxy for all Solar API calls
- Properly download, parse, and render GeoTIFFs to canvas
- Display as Google Maps GroundOverlays

---

## Architecture Overview

### solarscan-2.0 Working Architecture

```
User Browser                    Next.js Server                  Google Solar API
    |                                |                                 |
    |--[1] Request Data Layers------>|                                 |
    |                                |--[2] Fetch with API key-------->|
    |                                |<--[3] Return layer URLs---------|
    |<--[4] Return URLs--------------|                                 |
    |                                |                                 |
    |--[5] Request GeoTIFF---------->|                                 |
    |                                |--[6] Download GeoTIFF---------->|
    |                                |<--[7] Return GeoTIFF data-------|
    |<--[8] Return GeoTIFF data------|                                 |
    |                                |                                 |
    [9] Parse GeoTIFF (geotiff lib)  |                                 |
    [10] Render to Canvas            |                                 |
    [11] Create GroundOverlay        |                                 |
    [12] Display on Google Map       |                                 |
```

**Key Points:**
1. **Server-side proxy** handles ALL Google Solar API communication
2. **API key never exposed** to client
3. **GeoTIFF parsing** done in browser using `geotiff` library
4. **Canvas rendering** converts data to visual overlay
5. **GroundOverlay** displays on Google Maps

---

## Step-by-Step Implementation

### STEP 1: Install Required Dependencies

**Location:** Project root

**Action:**
```bash
cd "/Users/maciejpopiel/Solar Scan GE/solar-scan-ge"
npm install geotiff geotiff-geokeys-to-proj4 proj4
```

**Dependencies Explained:**
- `geotiff` - Parse GeoTIFF binary data
- `geotiff-geokeys-to-proj4` - Convert GeoTIFF coordinate systems
- `proj4` - Reproject coordinates to lat/lng

**Verification:**
```bash
grep -E "geotiff|proj4" package.json
```

Expected output:
```json
"geotiff": "^2.x.x",
"geotiff-geokeys-to-proj4": "^1.x.x",
"proj4": "^2.x.x"
```

---

### STEP 2: Create Server-Side Proxy Routes

#### 2.1: Create dataLayers:get Proxy

**File:** `src/app/api/solar/dataLayers/get/route.ts`

**Purpose:** Fetch data layer URLs from Google Solar API

**Code:**
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const latitude = searchParams.get('location.latitude')
  const longitude = searchParams.get('location.longitude')
  const radiusMeters = searchParams.get('radius_meters') || '50'
  const requiredQuality = searchParams.get('required_quality') || 'BASE'

  if (!latitude || !longitude) {
    return NextResponse.json(
      { error: 'Missing latitude or longitude' },
      { status: 400 }
    )
  }

  const apiKey = process.env.GOOGLE_SOLAR_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 503 }
    )
  }

  try {
    const url = new URL('https://solar.googleapis.com/v1/dataLayers:get')
    url.searchParams.set('location.latitude', latitude)
    url.searchParams.set('location.longitude', longitude)
    url.searchParams.set('radiusMeters', radiusMeters)
    url.searchParams.set('requiredQuality', requiredQuality)
    url.searchParams.set('key', apiKey)

    console.log('[SOLAR-PROXY] Fetching data layers:', url.toString().replace(/key=[^&]+/, 'key=***'))

    const response = await fetch(url.toString())
    const data = await response.json()

    if (!response.ok) {
      console.error('[SOLAR-PROXY] Data layers error:', data)
      return NextResponse.json(data, { status: response.status })
    }

    console.log('[SOLAR-PROXY] Data layers success')
    return NextResponse.json(data)

  } catch (error: any) {
    console.error('[SOLAR-PROXY] Exception:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

**Test:**
```bash
curl "http://localhost:3000/api/solar/dataLayers/get?location.latitude=35.8989&location.longitude=14.5136&radius_meters=50"
```

---

#### 2.2: Create GeoTIFF Download Proxy

**File:** `src/app/api/solar/geotiff/route.ts`

**Purpose:** Download GeoTIFF files and proxy to client

**Code:**
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Extract the id parameter from Solar API GeoTIFF URL
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { error: 'Missing GeoTIFF id parameter' },
      { status: 400 }
    )
  }

  const apiKey = process.env.GOOGLE_SOLAR_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 503 }
    )
  }

  try {
    const url = `https://solar.googleapis.com/v1/geoTiff:get?id=${id}&key=${apiKey}`

    console.log('[GEOTIFF-PROXY] Downloading:', url.replace(/key=[^&]+/, 'key=***'))

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[GEOTIFF-PROXY] Download failed:', errorText)
      return new NextResponse(errorText, { status: response.status })
    }

    const arrayBuffer = await response.arrayBuffer()

    console.log('[GEOTIFF-PROXY] Downloaded successfully, size:', arrayBuffer.byteLength, 'bytes')

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'image/tiff',
        'Content-Length': arrayBuffer.byteLength.toString()
      }
    })

  } catch (error: any) {
    console.error('[GEOTIFF-PROXY] Exception:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

**Test:**
```bash
# First get data layers to get a GeoTIFF URL, then test downloading
curl "http://localhost:3000/api/solar/geotiff?id=SOME_GEOTIFF_ID"
```

---

### STEP 3: Create GeoTIFF Processing Utilities

**File:** `src/lib/google/geotiff-processor.ts`

**Purpose:** Download, parse, and process GeoTIFF files

**Code:**
```typescript
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
```

---

### STEP 4: Create Canvas Rendering Utilities

**File:** `src/lib/google/geotiff-renderer.ts`

**Purpose:** Render GeoTIFF data to HTML Canvas

**Code:**
```typescript
import { GeoTiffData } from './geotiff-processor'

// Color palettes (from solarscan colors.ts)
export const ironPalette = [
  '#00000c',
  '#00001f',
  '#000033',
  '#000047',
  '#00005b',
  '#00006f',
  '#000083',
  '#000097',
  '#0000ab',
  '#0000bf',
  '#0000d3',
  '#0000e7',
  '#0000fb',
  '#0014ff',
  '#0028ff',
  '#003cff',
  '#0050ff',
  '#0064ff',
  '#0078ff',
  '#008cff',
  '#00a0ff',
  '#00b4ff',
  '#00c8ff',
  '#00dcff',
  '#00f0ff',
  '#14ffeb',
  '#28ffd7',
  '#3cffc3',
  '#50ffaf',
  '#64ff9b',
  '#78ff87',
  '#8cff73',
  '#a0ff5f',
  '#b4ff4b',
  '#c8ff37',
  '#dcff23',
  '#f0ff0f',
  '#fffa00',
  '#ffe600',
  '#ffd200',
  '#ffbe00',
  '#ffaa00',
  '#ff9600',
  '#ff8200',
  '#ff6e00',
  '#ff5a00',
  '#ff4600',
  '#ff3200',
  '#ff1e00',
  '#ff0a00',
  '#f00000',
  '#dc0000',
  '#c80000',
  '#b40000',
  '#a00000',
  '#8c0000',
  '#780000',
  '#640000',
  '#500000',
]

export const rainbowPalette = [
  '#3d3d3d',
  '#414141',
  '#464646',
  '#4a4a4a',
  '#4f4f4f',
  '#535353',
  '#585858',
  '#5c5c5c',
  '#616161',
  '#656565',
  '#6a6a6a',
  '#6e6e6e',
  '#737373',
  '#777777',
  '#7c7c7c',
  '#808080',
  '#858585',
  '#898989',
  '#8e8e8e',
  '#929292',
  '#979797',
  '#9b9b9b',
  '#a0a0a0',
  '#a4a4a4',
  '#a9a9a9',
  '#adadad',
  '#b2b2b2',
  '#b6b6b6',
  '#bbbbbb',
  '#bfbfbf',
  '#c4c4c4',
  '#c8c8c8',
  '#cdcdcd',
  '#d1d1d1',
  '#d6d6d6',
  '#dadada',
  '#dfdfdf',
  '#e3e3e3',
  '#e8e8e8',
  '#ececec',
  '#f1f1f1',
  '#f5f5f5',
  '#fafafa',
]

export const binaryPalette = ['#000000', '#ffffff']

export const sunlightPalette = [
  '#0a1c3a',
  '#1a2f52',
  '#2a426a',
  '#3a5582',
  '#4a689a',
  '#5a7bb2',
  '#6a8eca',
  '#7aa1e2',
  '#8ab4fa',
]

/**
 * Normalize data values to 0-1 range for color mapping
 */
function normalize(
  values: number[],
  min?: number,
  max?: number
): number[] {
  const dataMin = min ?? Math.min(...values)
  const dataMax = max ?? Math.max(...values)
  const range = dataMax - dataMin

  return values.map(val => range > 0 ? (val - dataMin) / range : 0)
}

/**
 * Map normalized value (0-1) to color from palette
 */
function valueToColor(value: number, colors: string[]): string {
  const clampedValue = Math.max(0, Math.min(1, value))
  const index = Math.floor(clampedValue * (colors.length - 1))
  return colors[index]
}

/**
 * Render GeoTIFF data to canvas with color palette
 */
export function renderPalette(options: {
  data: GeoTiffData
  mask?: GeoTiffData
  colors: string[]
  min?: number
  max?: number
  index?: number
}): HTMLCanvasElement {
  const { data, mask, colors, min, max, index = 0 } = options

  const canvas = document.createElement('canvas')
  canvas.width = data.width
  canvas.height = data.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  const imageData = ctx.createImageData(data.width, data.height)
  const pixels = imageData.data

  // Get the raster data (band) to visualize
  const raster = data.rasters[index]
  const normalized = normalize(raster, min, max)

  // Get mask data if provided
  const maskData = mask ? mask.rasters[0] : null

  // Render each pixel
  for (let i = 0; i < raster.length; i++) {
    const pixelIndex = i * 4

    // Check mask - skip if pixel is not on roof
    if (maskData && maskData[i] === 0) {
      pixels[pixelIndex + 3] = 0 // Transparent
      continue
    }

    // Get color from palette
    const color = valueToColor(normalized[i], colors)
    const rgb = hexToRgb(color)

    pixels[pixelIndex] = rgb.r
    pixels[pixelIndex + 1] = rgb.g
    pixels[pixelIndex + 2] = rgb.b
    pixels[pixelIndex + 3] = 255 // Opaque
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * Render RGB GeoTIFF data to canvas
 */
export function renderRGB(
  data: GeoTiffData,
  mask?: GeoTiffData
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = data.width
  canvas.height = data.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  const imageData = ctx.createImageData(data.width, data.height)
  const pixels = imageData.data

  const [r, g, b] = data.rasters
  const maskData = mask ? mask.rasters[0] : null

  for (let i = 0; i < r.length; i++) {
    const pixelIndex = i * 4

    // Check mask
    if (maskData && maskData[i] === 0) {
      pixels[pixelIndex + 3] = 0
      continue
    }

    pixels[pixelIndex] = r[i]
    pixels[pixelIndex + 1] = g[i]
    pixels[pixelIndex + 2] = b[i]
    pixels[pixelIndex + 3] = 255
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) throw new Error(`Invalid hex color: ${hex}`)

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}
```

---

### STEP 5: Create Layer Loader

**File:** `src/lib/google/layer-loader.ts`

**Purpose:** Load and prepare each layer type for display

**Code:**
```typescript
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
  maskUrl: string
  dsmUrl: string
  rgbUrl: string
  annualFluxUrl: string
  monthlyFluxUrl: string
  hourlyShadeUrls: string[]
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
  const [mask, ...hours] = await Promise.all([
    downloadGeoTIFF(urls.maskUrl),
    ...urls.hourlyShadeUrls.map(url => downloadGeoTIFF(url)),
  ])

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
```

---

### STEP 6: Update Visualization Components

#### 6.1: Update HeightMapAnimation

**File:** `src/components/solar-visualizer/HeightMapAnimation.tsx`

**Changes:**
- Use `getLayer('dsm', dataLayers)` to load DSM
- Create GroundOverlay from canvas
- Remove old GeoTIFF fetching code

**Key Code:**
```typescript
import { getLayer, DataLayersResponse } from '@/lib/google/layer-loader'

// Inside component:
const [overlay, setOverlay] = useState<google.maps.GroundOverlay | null>(null)

useEffect(() => {
  if (!dsmUrl || !map) return

  const loadDsm = async () => {
    try {
      // Fetch data layers
      const response = await fetch(
        `/api/solar/dataLayers/get?location.latitude=${center.latitude}&location.longitude=${center.longitude}&radius_meters=50`
      )
      const dataLayers: DataLayersResponse = await response.json()

      // Load DSM layer
      const layer = await getLayer('dsm', dataLayers)

      // Create ground overlay from canvas
      const groundOverlay = new google.maps.GroundOverlay(
        layer.canvases[0].toDataURL(),
        layer.bounds,
        { opacity: 0.7 }
      )

      groundOverlay.setMap(map)
      setOverlay(groundOverlay)

      setHeightDataLoaded(true)
    } catch (error) {
      console.error('Failed to load DSM:', error)
    }
  }

  loadDsm()
}, [dsmUrl, map, center])

// Cleanup
useEffect(() => {
  return () => {
    overlay?.setMap(null)
  }
}, [overlay])
```

#### 6.2: Update SunlightHeatmap

**File:** `src/components/solar-visualizer/SunlightHeatmap.tsx`

**Changes:**
- Load annual flux layer using `getLayer`
- Display canvas as GroundOverlay

**Key Code:**
```typescript
const loadAnnualFlux = async () => {
  const response = await fetch(
    `/api/solar/dataLayers/get?location.latitude=${center.latitude}&location.longitude=${center.longitude}&radius_meters=50`
  )
  const dataLayers: DataLayersResponse = await response.json()

  const layer = await getLayer('annualFlux', dataLayers)

  const overlay = new google.maps.GroundOverlay(
    layer.canvases[0].toDataURL(),
    layer.bounds,
    { opacity: 0.7 }
  )

  overlay.setMap(map)
  setOverlay(overlay)
}
```

#### 6.3: Update ShadowPatternAnimation

**File:** `src/components/solar-visualizer/ShadowPatternAnimation.tsx`

**Changes:**
- Load hourly shade layer
- Animate through hours by switching canvases

**Key Code:**
```typescript
const [canvases, setCanvases] = useState<HTMLCanvasElement[]>([])
const [currentHour, setCurrentHour] = useState(12)

const loadShadows = async () => {
  const response = await fetch(
    `/api/solar/dataLayers/get?location.latitude=${center.latitude}&location.longitude=${center.longitude}&radius_meters=50`
  )
  const dataLayers: DataLayersResponse = await response.json()

  const layer = await getLayer('hourlyShade', dataLayers)
  setCanvases(layer.canvases)
  setBounds(layer.bounds)
}

// Animate through hours
useEffect(() => {
  if (canvases.length === 0) return

  const timer = setInterval(() => {
    setCurrentHour(h => (h + 1) % 24)
  }, 1000)

  return () => clearInterval(timer)
}, [canvases])

// Update overlay when hour changes
useEffect(() => {
  if (!map || !canvases[currentHour] || !bounds) return

  overlay?.setMap(null)

  const newOverlay = new google.maps.GroundOverlay(
    canvases[currentHour].toDataURL(),
    bounds,
    { opacity: 0.7 }
  )

  newOverlay.setMap(map)
  setOverlay(newOverlay)
}, [currentHour, canvases, bounds, map])
```

---

### STEP 7: Update Types

**File:** `src/types/api.ts`

**Add:**
```typescript
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
```

---

### STEP 8: Test Each Layer Individually

**Test Order:**
1. Test proxy routes (verify 200 responses)
2. Test GeoTIFF download (verify file downloads)
3. Test canvas rendering (verify canvas creation)
4. Test GroundOverlay display (verify map overlay)
5. Test each layer type (rgb → dsm → annualFlux → shadows)

**Testing Commands:**
```bash
# Start dev server
npm run dev

# Test in browser
# Navigate to: http://localhost:3000/analyzing?lat=35.8989&lng=14.5136&address=Test

# Open browser console and check for:
# - "[SOLAR-PROXY] Fetching data layers"
# - "[GEOTIFF-PROXY] Downloading"
# - "[GEOTIFF] Downloaded, size: XXX bytes"
# - "[GEOTIFF] Parsed successfully"
```

---

### STEP 9: Deploy to Railway

**Commands:**
```bash
git add .
git commit -m "Implement working layer animation from solarscan-2.0

- Added server-side proxy routes for Solar API
- Installed geotiff, proj4 dependencies
- Ported GeoTIFF download and rendering utilities
- Updated visualization components to use GroundOverlays
- Fixed all layer loading issues

Layers now properly load and display:
- RGB satellite imagery
- DSM height data
- Annual solar flux
- Hourly shadow patterns

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

railway up
```

---

## Troubleshooting

### Issue: GeoTIFF downloads still failing

**Check:**
1. API key is set in `.env.local`
2. Proxy routes are created correctly
3. Check Railway logs: `railway logs`
4. Verify proxy URL in browser network tab

**Fix:**
```bash
# Verify API key
grep GOOGLE_SOLAR_API_KEY .env.local

# Test proxy directly
curl http://localhost:3000/api/solar/dataLayers/get?location.latitude=35.8989&location.longitude=14.5136
```

### Issue: Canvas not rendering

**Check:**
1. GeoTIFF data is valid (check console logs)
2. Canvas element is created
3. Palette colors are defined

**Fix:**
Add console logs in `renderPalette()`:
```typescript
console.log('Rendering canvas:', {
  width: data.width,
  height: data.height,
  rasterLength: raster.length
})
```

### Issue: GroundOverlay not visible

**Check:**
1. Bounds are correct (north > south, east > west)
2. Opacity is > 0
3. Map is loaded
4. Canvas toDataURL() returns valid data

**Fix:**
```typescript
console.log('GroundOverlay bounds:', layer.bounds)
console.log('Canvas data URL:', layer.canvases[0].toDataURL().substring(0, 50))
```

---

## Success Criteria

**When implementation is complete, you should see:**

1. ✅ Browser console shows proxy requests succeeding
2. ✅ GeoTIFF files download (check Network tab, see binary responses)
3. ✅ Canvas elements are created and contain image data
4. ✅ GroundOverlays appear on the map
5. ✅ Layers animate sequentially (RGB → DSM → Flux → Shadows)
6. ✅ Each layer displays for ~3 seconds before progressing
7. ✅ Progress bar moves from 0% → 100%
8. ✅ After all layers, redirects to results page

---

## Time Estimates

- **Step 1** (Dependencies): 5 minutes
- **Step 2** (Proxy routes): 30 minutes
- **Step 3** (GeoTIFF processor): 20 minutes
- **Step 4** (Canvas renderer): 30 minutes
- **Step 5** (Layer loader): 40 minutes
- **Step 6** (Update components): 60 minutes
- **Step 7** (Types): 10 minutes
- **Step 8** (Testing): 45 minutes
- **Step 9** (Deploy): 15 minutes

**Total: ~4 hours**

---

## References

**Working Code Locations:**
- `/Users/maciejpopiel/solarscan 2.0 CC/solarscan-2.0/src/routes/solar.ts`
- `/Users/maciejpopiel/solarscan 2.0 CC/solarscan-2.0/src/routes/layer.ts`
- `/Users/maciejpopiel/solarscan 2.0 CC/solarscan-2.0/src/routes/visualize.ts`
- `/Users/maciejpopiel/solarscan 2.0 CC/solarscan-2.0/src/routes/components/SolarDataLayers.svelte`

**Google Solar API Docs:**
- https://developers.google.com/maps/documentation/solar/data-layers
- https://developers.google.com/maps/documentation/solar/geotiff

**Libraries:**
- https://geotiffjs.github.io/geotiff.js/
- https://github.com/proj4js/proj4js
