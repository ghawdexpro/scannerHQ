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
  '#3d3d3d', '#414141', '#464646', '#4a4a4a', '#4f4f4f', '#535353', '#585858', '#5c5c5c',
  '#616161', '#656565', '#6a6a6a', '#6e6e6e', '#737373', '#777777', '#7c7c7c', '#808080',
  '#858585', '#898989', '#8e8e8e', '#929292', '#979797', '#9b9b9b', '#a0a0a0', '#a4a4a4',
  '#a9a9a9', '#adadad', '#b2b2b2', '#b6b6b6', '#bbbbbb', '#bfbfbf', '#c4c4c4', '#c8c8c8',
  '#cdcdcd', '#d1d1d1', '#d6d6d6', '#dadada', '#dfdfdf', '#e3e3e3', '#e8e8e8', '#ececec',
  '#f1f1f1', '#f5f5f5', '#fafafa',
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
