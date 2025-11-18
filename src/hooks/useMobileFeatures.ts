import { useEffect, useState } from 'react'

interface MobileFeatures {
  supportsCamera: boolean
  supportsGeolocation: boolean
  supportsVibration: boolean
  supportsShare: boolean
  isOnline: boolean
  deviceMemory: number | undefined
  effectiveType: string | undefined
}

/**
 * Hook to detect available mobile device features
 * Used for progressive enhancement and feature detection
 */
export function useMobileFeatures(): MobileFeatures {
  const [features, setFeatures] = useState<MobileFeatures>({
    supportsCamera: false,
    supportsGeolocation: false,
    supportsVibration: false,
    supportsShare: false,
    isOnline: true,
    deviceMemory: undefined,
    effectiveType: undefined
  })

  useEffect(() => {
    // Check for camera support
    const supportsCamera = !!(
      navigator.mediaDevices?.getUserMedia ||
      (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia
    )

    // Check for geolocation support
    const supportsGeolocation = 'geolocation' in navigator

    // Check for vibration API
    const supportsVibration = 'vibrate' in navigator

    // Check for Web Share API
    const supportsShare = 'share' in navigator

    // Get device memory (Chrome only)
    const deviceMemory = (navigator as any).deviceMemory

    // Get connection type
    const connection = (navigator as any).connection || (navigator as any).mozConnection
    const effectiveType = connection?.effectiveType

    // Check online status
    const isOnline = typeof window !== 'undefined' ? navigator.onLine : true

    setFeatures({
      supportsCamera,
      supportsGeolocation,
      supportsVibration,
      supportsShare,
      isOnline,
      deviceMemory,
      effectiveType
    })

    // Listen for online/offline events
    const handleOnline = () => setFeatures((prev) => ({ ...prev, isOnline: true }))
    const handleOffline = () => setFeatures((prev) => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return features
}
