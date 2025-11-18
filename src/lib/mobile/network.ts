/**
 * Network detection and adaptive loading utilities
 * Detects connection speed and optimizes content delivery
 */

export type ConnectionType = '4g' | '3g' | '2g' | 'slow-2g' | 'unknown'
export type ImageQuality = 'high' | 'medium' | 'low'

/**
 * Get effective connection type
 */
export function getConnectionType(): ConnectionType {
  if (typeof window === 'undefined') return 'unknown'

  const connection = (navigator as any).connection || (navigator as any).mozConnection
  if (!connection) return 'unknown'

  return (connection.effectiveType || 'unknown') as ConnectionType
}

/**
 * Get estimated bandwidth in Mbps
 */
export function getEstimatedBandwidth(): number {
  if (typeof window === 'undefined') return 10

  const connection = (navigator as any).connection || (navigator as any).mozConnection
  if (!connection) return 10

  // Fallback values based on connection type
  const bandwidthMap: Record<ConnectionType, number> = {
    '4g': 10,
    '3g': 0.7,
    '2g': 0.15,
    'slow-2g': 0.05,
    'unknown': 10
  }

  return bandwidthMap[getConnectionType()]
}

/**
 * Determine optimal image quality based on connection
 */
export function getOptimalImageQuality(): ImageQuality {
  const connectionType = getConnectionType()

  const qualityMap: Record<ConnectionType, ImageQuality> = {
    '4g': 'high',
    '3g': 'medium',
    '2g': 'low',
    'slow-2g': 'low',
    'unknown': 'high'
  }

  return qualityMap[connectionType]
}

/**
 * Determine if should use aggressive compression
 */
export function shouldCompressImages(): boolean {
  const connectionType = getConnectionType()
  return ['2g', 'slow-2g'].includes(connectionType)
}

/**
 * Get image size multiplier based on connection
 * Use for responsive image size calculation
 */
export function getImageSizeMultiplier(): number {
  const quality = getOptimalImageQuality()
  const multipliers: Record<ImageQuality, number> = {
    high: 1,
    medium: 0.75,
    low: 0.5
  }
  return multipliers[quality]
}

/**
 * Estimate download time for file size in ms
 */
export function estimateDownloadTime(fileSizeKB: number): number {
  const bandwidth = getEstimatedBandwidth() * 1024 * 1024 // Convert to bits per second
  const fileSizeBits = fileSizeKB * 8 * 1024
  const timeSeconds = fileSizeBits / bandwidth
  return timeSeconds * 1000 // Convert to ms
}

/**
 * Check if on slow connection
 */
export function isOnSlowConnection(): boolean {
  const connectionType = getConnectionType()
  return ['2g', 'slow-2g'].includes(connectionType)
}

/**
 * Check if device has low memory (for heavy operations)
 */
export function hasLowMemory(): boolean {
  const deviceMemory = (navigator as any).deviceMemory
  if (deviceMemory === undefined) return false
  return deviceMemory <= 4
}

/**
 * Should defer non-critical operations
 */
export function shouldDeferOperations(): boolean {
  return isOnSlowConnection() || hasLowMemory()
}
