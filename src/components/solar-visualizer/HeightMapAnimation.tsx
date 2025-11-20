'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { getLayer, type DataLayersResponse } from '@/lib/google/layer-loader'

export interface HeightMapAnimationProps {
  center: { latitude: number; longitude: number }
  dataLayers?: DataLayersResponse
  onComplete: () => void
  isActive: boolean
}

export default function HeightMapAnimation({
  center,
  dataLayers,
  onComplete,
  isActive
}: HeightMapAnimationProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [heightDataLoaded, setHeightDataLoaded] = useState(false)
  const [heightStats, setHeightStats] = useState<{ min: number; max: number; avg: number } | null>(null)
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const overlayRef = useRef<google.maps.GroundOverlay | null>(null)

  // Load DSM (Digital Surface Model) layer
  useEffect(() => {
    if (!isActive || !dataLayers) return

    const loadHeightData = async () => {
      try {
        console.log('[HEIGHT-MAP] Loading DSM layer...')
        const layer = await getLayer('dsm', dataLayers)

        // Get the canvas and convert to data URL
        if (layer.canvases.length > 0) {
          const canvas = layer.canvases[0]
          setOverlayUrl(canvas.toDataURL())

          // Extract min/max from palette
          if (layer.palette) {
            const minMatch = layer.palette.min.match(/([\d.]+)\s*m/)
            const maxMatch = layer.palette.max.match(/([\d.]+)\s*m/)

            if (minMatch && maxMatch) {
              const min = parseFloat(minMatch[1])
              const max = parseFloat(maxMatch[1])
              const avg = (min + max) / 2

              setHeightStats({ min, max, avg })
            }
          }

          setHeightDataLoaded(true)
          console.log('[HEIGHT-MAP] DSM layer loaded successfully')
        }
      } catch (error) {
        console.error('[HEIGHT-MAP] Failed to load DSM layer:', error)
        setHeightDataLoaded(false)
      }
    }

    loadHeightData()
  }, [isActive, dataLayers])

  // Auto-complete animation
  useEffect(() => {
    if (!isActive || !heightDataLoaded) return

    const timer = setTimeout(() => {
      onComplete()
    }, 3000)

    return () => clearTimeout(timer)
  }, [isActive, heightDataLoaded, onComplete])

  if (!dataLayers) {
    // Fallback: No DSM data available
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-6"
      >
        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-3">📏</div>
            <div className="text-lg font-semibold">Height data not available</div>
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
        {/* Satellite base layer */}
        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400">
          <span>Map placeholder</span>
        </div>

        {/* Height map overlay (DSM data) */}
        {overlayUrl && (
          <motion.img
            src={overlayUrl}
            alt="Height map overlay"
            className="absolute inset-0 w-full h-full pointer-events-none object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: heightDataLoaded ? 0.7 : 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            style={{ mixBlendMode: 'multiply' }}
          />
        )}

        {/* Real data badge */}
        <motion.div
          className="absolute top-4 right-4 bg-purple-500/90 text-white px-3 py-1 rounded-full text-xs font-semibold"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          Real Height Data
        </motion.div>

        {/* Scanning line effect */}
        {mapLoaded && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: 2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/0 via-purple-500/30 to-purple-500/0" />
          </motion.div>
        )}
      </div>

      {/* Height statistics */}
      {heightStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="bg-gray-900/50 rounded-lg p-6 border border-gray-800"
        >
          <h3 className="text-white font-semibold mb-4">Elevation Analysis</h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-white">
                {heightStats.min.toFixed(1)}m
              </div>
              <div className="text-xs text-gray-500">Minimum Height</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {heightStats.avg.toFixed(1)}m
              </div>
              <div className="text-xs text-gray-500">Average Height</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {heightStats.max.toFixed(1)}m
              </div>
              <div className="text-xs text-gray-500">Maximum Height</div>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-400">
            💡 Height data resolution: 0.1 meters per pixel
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
