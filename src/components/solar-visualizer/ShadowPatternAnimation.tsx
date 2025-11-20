'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getLayer, type DataLayersResponse } from '@/lib/google/layer-loader'
import { loadLibrary } from '@/lib/google/maps-service'

export interface ShadowPatternAnimationProps {
  center: { latitude: number; longitude: number }
  dataLayers?: DataLayersResponse
  onComplete: () => void
  isActive: boolean
}

export default function ShadowPatternAnimation({
  center,
  dataLayers,
  onComplete,
  isActive
}: ShadowPatternAnimationProps) {
  const [currentHour, setCurrentHour] = useState(0)
  const [shadowsLoaded, setShadowsLoaded] = useState(false)
  const [overlayDataUrls, setOverlayDataUrls] = useState<string[]>([])
  const [bounds, setBounds] = useState<google.maps.LatLngBoundsLiteral | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const mapRef = useRef<google.maps.Map | null>(null)
  const mapDivRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<google.maps.GroundOverlay | null>(null)

  // Initialize Google Map
  useEffect(() => {
    if (!isActive || !mapDivRef.current || mapRef.current) return

    const initMap = async () => {
      try {
        console.log('[SHADOWS] Loading Google Maps library...')
        await loadLibrary('maps')

        console.log('[SHADOWS] Initializing Google Map...')

        mapRef.current = new google.maps.Map(mapDivRef.current!, {
          center: { lat: center.latitude, lng: center.longitude },
          zoom: 20,
          mapTypeId: 'satellite',
          tilt: 0,
          heading: 0,
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
        })

        setIsMapLoaded(true)
        console.log('[SHADOWS] Google Map initialized successfully')
      } catch (error) {
        console.error('[SHADOWS] Failed to initialize Google Map:', error)
      }
    }

    initMap()
  }, [isActive, center])

  // Load hourly shade layer
  useEffect(() => {
    if (!isActive || !dataLayers || !mapRef.current || !isMapLoaded) return

    const loadShadows = async () => {
      try {
        console.log('[SHADOWS] Loading hourly shade layer...')
        const layer = await getLayer('hourlyShade', dataLayers)

        // Convert all canvases to data URLs (5 hours: 5AM, 8AM, noon, 4PM, 8PM)
        const urls = layer.canvases.map(canvas => canvas.toDataURL())
        setOverlayDataUrls(urls)
        setBounds(layer.bounds)
        setShadowsLoaded(true)
        console.log('[SHADOWS] Loaded', urls.length, 'hourly shade frames')
      } catch (error) {
        console.error('[SHADOWS] Failed to load hourly shade layer:', error)
        setShadowsLoaded(false)
        // Still complete the stage after delay even on error
        setTimeout(() => {
          console.warn('[SHADOWS] Completing stage despite error')
          onComplete()
        }, 2000)
      }
    }

    loadShadows()
  }, [isActive, dataLayers, isMapLoaded])

  // Animate through hours
  useEffect(() => {
    if (!isActive || !shadowsLoaded || overlayDataUrls.length === 0) return

    const interval = setInterval(() => {
      setCurrentHour(prev => {
        if (prev >= overlayDataUrls.length - 1) {
          clearInterval(interval)
          setTimeout(() => onComplete(), 500)
          return prev
        }
        return prev + 1
      })
    }, 800) // Change frame every 800ms

    return () => clearInterval(interval)
  }, [isActive, shadowsLoaded, overlayDataUrls.length, onComplete])

  // Safety timeout: force completion after 12 seconds
  useEffect(() => {
    if (!isActive) return

    const safetyTimer = setTimeout(() => {
      console.warn('[SHADOWS] Safety timeout reached, forcing completion')
      onComplete()
    }, 12000)

    return () => clearTimeout(safetyTimer)
  }, [isActive, onComplete])

  // Update overlay when hour changes
  useEffect(() => {
    if (!mapRef.current || !overlayDataUrls[currentHour] || !bounds) return

    // Remove existing overlay
    if (overlayRef.current) {
      overlayRef.current.setMap(null)
    }

    // Create new overlay for current hour
    const groundOverlay = new google.maps.GroundOverlay(
      overlayDataUrls[currentHour],
      bounds,
      { opacity: 0.8 }
    )

    groundOverlay.setMap(mapRef.current)
    overlayRef.current = groundOverlay

    // Cleanup
    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null)
      }
    }
  }, [currentHour, overlayDataUrls, bounds])

  const hourLabels = ['5AM', '8AM', '12PM', '4PM', '8PM']

  if (!dataLayers) {
    // Fallback: Show message that shadow data is not available
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-6"
      >
        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-3">🌓</div>
            <div className="text-lg font-semibold">Shadow data not available</div>
            <div className="text-sm">Continuing with analysis...</div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6"
    >
      {/* Main visualization */}
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
        {/* Google Map */}
        <div ref={mapDivRef} className="w-full h-full" />

        {/* Hour indicator overlay */}
        {shadowsLoaded && (
          <motion.div
            key={`label-${currentHour}`}
            className="absolute bottom-6 left-6 right-6 z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-4 text-white shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="text-4xl">🌞</div>
                <div className="flex-1">
                  <div className="font-bold text-lg">Shadow Pattern - {hourLabels[currentHour]}</div>
                  <div className="text-sm opacity-90">Summer Solstice (June 21)</div>
                  <div className="text-xs opacity-75 mt-1">Showing shadow movement throughout the day</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Real data badge */}
        <motion.div
          className="absolute top-4 right-4 bg-blue-500/90 text-white px-3 py-1 rounded-full text-xs font-semibold z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          Real Shadow Data
        </motion.div>
      </div>

      {/* Hour timeline */}
      <div className="flex items-center justify-center gap-4">
        {hourLabels.map((hour, index) => (
          <motion.div
            key={hour}
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: currentHour === index ? 1.2 : 1
            }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold
              ${currentHour === index ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-gray-800 text-gray-400'}
              transition-all duration-300
            `}>
              {hour}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
