import { useEffect, useState } from 'react'

interface ServiceWorkerState {
  isInstalled: boolean
  isUpdating: boolean
  error: Error | null
  registration: ServiceWorkerRegistration | null
}

/**
 * Hook to register and manage service worker
 * Enables offline support and PWA capabilities
 */
export function useServiceWorker(): ServiceWorkerState {
  const [state, setState] = useState<ServiceWorkerState>({
    isInstalled: false,
    isUpdating: false,
    error: null,
    registration: null
  })

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers are not supported in this browser')
      return
    }

    const registerServiceWorker = async () => {
      try {
        setState((prev) => ({ ...prev, isUpdating: true }))

        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
          updateViaCache: 'none'
        })

        setState((prev) => ({
          ...prev,
          isInstalled: true,
          isUpdating: false,
          registration
        }))

        console.log('Service Worker registered successfully:', registration)

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is ready to activate
                console.log('New Service Worker update available')
              }
            })
          }
        })
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error')
        setState((prev) => ({
          ...prev,
          error: err,
          isUpdating: false
        }))
        console.error('Service Worker registration failed:', err)
      }
    }

    registerServiceWorker()
  }, [])

  return state
}
