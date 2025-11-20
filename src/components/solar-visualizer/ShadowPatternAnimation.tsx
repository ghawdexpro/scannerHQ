'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getLayer, type DataLayersResponse } from '@/lib/google/layer-loader'

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
  const [overlayUrls, setOverlayUrls] = useState<string[]>([])

  // Load hourly shade layer
  useEffect(() => {
    if (!isActive || !dataLayers) return

    const loadShadows = async () => {
      try {
        console.log('[SHADOWS] Loading hourly shade layer...')
        const layer = await getLayer('hourlyShade', dataLayers)

        // Convert all canvases to data URLs (5 hours: 5AM, 8AM, noon, 4PM, 8PM)
        const urls = layer.canvases.map(canvas => canvas.toDataURL())
        setOverlayUrls(urls)
        setShadowsLoaded(true)
        console.log('[SHADOWS] Loaded', urls.length, 'hourly shade frames')
      } catch (error) {
        console.error('[SHADOWS] Failed to load hourly shade layer:', error)
        setShadowsLoaded(false)
      }
    }

    loadShadows()
  }, [isActive, dataLayers])

  // Animate through hours
  useEffect(() => {
    if (!isActive || !shadowsLoaded || overlayUrls.length === 0) return

    const interval = setInterval(() => {
      setCurrentHour(prev => {
        if (prev >= overlayUrls.length - 1) {
          clearInterval(interval)
          setTimeout(() => onComplete(), 500)
          return prev
        }
        return prev + 1
      })
    }, 800) // Change frame every 800ms

    return () => clearInterval(interval)
  }, [isActive, shadowsLoaded, overlayUrls.length, onComplete])

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
        {/* Base layer */}
        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400">
          <span>Map placeholder</span>
        </div>

        {/* Shadow overlays - animate through hours */}
        <AnimatePresence mode="wait">
          {shadowsLoaded && overlayUrls[currentHour] && (
            <motion.img
              key={`hour-${currentHour}`}
              src={overlayUrls[currentHour]}
              alt={`Shadow pattern at ${hourLabels[currentHour]}`}
              className="absolute inset-0 w-full h-full pointer-events-none object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ mixBlendMode: 'multiply' }}
            />
          )}
        </AnimatePresence>

        {/* Hour indicator overlay */}
        {shadowsLoaded && (
          <motion.div
            key={`label-${currentHour}`}
            className="absolute bottom-6 left-6 right-6"
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
          className="absolute top-4 right-4 bg-blue-500/90 text-white px-3 py-1 rounded-full text-xs font-semibold"
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
