import { GeoTiffData } from './geotiff-processor'

// Color palettes (from solarscan colors.ts)
export const ironPalette = [
  '#00000c', '#00001f', '#000033', '#000047', '#00005b', '#00006f', '#000083', '#000097',
  '#0000ab', '#0000bf', '#0000d3', '#0000e7', '#0000fb', '#0014ff', '#0028ff', '#003cff',
  '#0050ff', '#0064ff', '#0078ff', '#008cff', '#00a0ff', '#00b4ff', '#00c8ff', '#00dcff',
  '#00f0ff', '#14ffeb', '#28ffd7', '#3cffc3', '#50ffaf', '#64ff9b', '#78ff87', '#8cff73',
  '#a0ff5f', '#b4ff4b', '#c8ff37', '#dcff23', '#f0ff0f', '#fffa00', '#ffe600', '#ffd200',
  '#ffbe00', '#ffaa00', '#ff9600', '#ff8200', '#ff6e00', '#ff5a00', '#ff4600', '#ff3200',
  '#ff1e00', '#ff0a00', '#f00000', '#dc0000', '#c80000', '#b40000', '#a00000', '#8c0000',
  '#780000', '#640000', '#500000',
]

export const rainbowPalette = [
  // Purple (low elevation) -> Blue -> Cyan -> Green -> Yellow -> Orange -> Red (high elevation)
  '#440154', '#481567', '#482677', '#453781', '#404788', '#39568c', '#33638d', '#2d708e',
  '#287d8e', '#238a8d', '#1f968b', '#20a387', '#29af7f', '#3cbb75', '#55c667', '#73d055',
  '#95d840', '#b8de29', '#dce319', '#fde724', '#fde825', '#fde227', '#fddc29', '#fdd72d',
  '#fcd134', '#fbcb3c', '#fac344', '#f8bb4c', '#f7b254', '#f5a85d', '#f29e66', '#ef936f',
  '#ec8879', '#e87d82', '#e3718b', '#de6693', '#d85b9b', '#d150a2', '#c945a8', '#c03bae',
  '#b631b3', '#ac28b7', '#a11fba', '#9617bc', '#8a0fbd', '#7e08bd', '#7201bc', '#6600ba',
]

export const binaryPalette = ['#000000', '#ffffff']

export const sunlightPalette = [
  '#0a1c3a', '#1a2f52', '#2a426a', '#3a5582', '#4a689a',
  '#5a7bb2', '#6a8eca', '#7aa1e2', '#8ab4fa',
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
