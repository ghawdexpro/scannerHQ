'use client'

import { useServiceWorker } from '@/hooks/useServiceWorker'

/**
 * PWA Initializer Component
 * Registers service worker and enables offline support
 * This component doesn't render anything, just initializes PWA features
 */
export default function PWAInitializer() {
  // Initialize service worker registration
  useServiceWorker()

  // Component doesn't render anything
  return null
}
