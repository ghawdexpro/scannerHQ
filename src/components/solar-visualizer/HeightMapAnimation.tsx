'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { fetchAndParseGeoTiff, geoTiffToImageData } from '@/lib/utils/geotiff'

export interface HeightMapAnimationProps {
  center: { latitude: number; longitude: number }
  dsmUrl?: string
  onComplete: () => void
  isActive: boolean
}

export default function HeightMapAnimation({
  center,
  dsmUrl,
  onComplete,
  isActive
}: HeightMapAnimationProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [heightDataLoaded, setHeightDataLoaded] = useState(false)
  const [heightStats, setHeightStats] = useState<{ min: number; max: number; avg: number } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center.latitude},${center.longitude}&zoom=20&size=1200x800&maptype=satellite&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`

  // Load DSM (Digital Surface Model) data
  useEffect(() => {
    if (!isActive || !dsmUrl || !canvasRef.current) return

    const loadHeightData = async () => {
      try {
        console.log('[HEIGHT-MAP] Loading DSM data from GeoTIFF...')
        const dsmData = await fetchAndParseGeoTiff(dsmUrl)

        // Convert DSM to height visualization with color gradient
        const imageData = geoTiffToImageData(dsmData, 0.6)

        // Render to canvas
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx) {
          ctx.putImageData(imageData, 0, 0)
        }

        // Calculate height statistics
        const data = dsmData.data
        const sum = Array.from(data).reduce((acc, val) => acc + val, 0)
        const avg = sum / data.length

        setHeightStats({
          min: dsmData.min,
          max: dsmData.max,
          avg
        })

        setHeightDataLoaded(true)
        console.log('[HEIGHT-MAP] DSM data loaded:', {
          min: dsmData.min.toFixed(1),
          max: dsmData.max.toFixed(1),
          avg: avg.toFixed(1)
        })
      } catch (error) {
        console.error('[HEIGHT-MAP] Failed to load DSM data:', error)
        setHeightDataLoaded(false)
      }
    }

    loadHeightData()
  }, [isActive, dsmUrl])

  // Auto-complete animation
  useEffect(() => {
    if (!isActive || !mapLoaded) return

    const timer = setTimeout(() => {
      onComplete()
    }, 3000)

    return () => clearTimeout(timer)
  }, [isActive, mapLoaded, onComplete])

  if (!dsmUrl) {
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
        <img
          src={mapUrl}
          alt="Satellite view"
          className="w-full h-full object-cover"
          onLoad={() => setMapLoaded(true)}
        />

        {/* Height map overlay (DSM data) */}
        {mapLoaded && dsmUrl && (
          <motion.canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
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
