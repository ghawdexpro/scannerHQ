'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { SunlightHeatmapProps } from './types'
import { getLayer, type DataLayersResponse } from '@/lib/google/layer-loader'

export default function SunlightHeatmap({
  segments,
  center,
  onComplete,
  isActive,
  dataLayers
}: SunlightHeatmapProps & { dataLayers?: DataLayersResponse }) {
  const [heatmapOpacity, setHeatmapOpacity] = useState(0)
  const [showLegend, setShowLegend] = useState(false)
  const [fluxLoaded, setFluxLoaded] = useState(false)
  const [realDataStats, setRealDataStats] = useState<{ min: number; max: number; avg: number } | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const mapDivRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<google.maps.GroundOverlay | null>(null)

  // Initialize Google Map
  useEffect(() => {
    if (!isActive || !mapDivRef.current || mapRef.current) return

    console.log('[HEATMAP] Initializing Google Map...')

    mapRef.current = new google.maps.Map(mapDivRef.current, {
      center: { lat: center.latitude, lng: center.longitude },
      zoom: 20,
      mapTypeId: 'satellite',
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
    })

    console.log('[HEATMAP] Google Map initialized')
  }, [isActive, center])

  // Load annual flux layer
  useEffect(() => {
    if (!isActive || !dataLayers || !mapRef.current) return

    const loadAnnualFlux = async () => {
      try {
        console.log('[HEATMAP] Loading annual flux layer...')
        const layer = await getLayer('annualFlux', dataLayers)

        // Remove existing overlay
        if (overlayRef.current) {
          overlayRef.current.setMap(null)
        }

        // Create GroundOverlay from canvas
        if (layer.canvases.length > 0 && mapRef.current) {
          const canvas = layer.canvases[0]
          const dataUrl = canvas.toDataURL()

          const groundOverlay = new google.maps.GroundOverlay(
            dataUrl,
            layer.bounds,
            { opacity: 0.7 }
          )

          groundOverlay.setMap(mapRef.current)
          overlayRef.current = groundOverlay

          // Extract min/max from palette
          if (layer.palette) {
            const minMatch = layer.palette.min.match(/([\d]+)/)
            const maxMatch = layer.palette.max.match(/([\d]+)/)

            if (minMatch && maxMatch) {
              const min = parseFloat(minMatch[1])
              const max = parseFloat(maxMatch[1])
              const avg = (min + max) / 2

              setRealDataStats({ min, max, avg })
            }
          }

          setFluxLoaded(true)
          console.log('[HEATMAP] Annual flux layer loaded successfully')
        }
      } catch (error) {
        console.error('[HEATMAP] Failed to load annual flux layer:', error)
        setFluxLoaded(false)
      }
    }

    loadAnnualFlux()

    // Cleanup
    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null)
      }
    }
  }, [isActive, dataLayers])

  useEffect(() => {
    if (!isActive || !fluxLoaded) return

    // Animate heatmap appearance
    const timer1 = setTimeout(() => {
      setHeatmapOpacity(1)
    }, 300)

    const timer2 = setTimeout(() => {
      setShowLegend(true)
    }, 1000)

    const timer3 = setTimeout(() => {
      onComplete()
    }, 2500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [isActive, onComplete, fluxLoaded])

  // Get color for intensity value (kWh/m²/year)
  const getHeatmapColor = (intensity: number) => {
    if (intensity >= 1500) return { r: 16, g: 185, b: 129, name: 'Excellent' } // emerald
    if (intensity >= 1200) return { r: 234, g: 179, b: 8, name: 'Good' } // yellow
    if (intensity >= 900) return { r: 249, g: 115, b: 22, name: 'Fair' } // orange
    return { r: 239, g: 68, b: 68, name: 'Poor' } // red
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6"
    >
      {/* Main heatmap visualization */}
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
        {/* Google Map */}
        <div ref={mapDivRef} className="w-full h-full" />

        {/* Fallback: Simulated heatmap overlay (if no real data) */}
        {!dataLayers && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: heatmapOpacity * 0.7 }}
            transition={{ duration: 1 }}
          >
            {/* Canvas overlay for heatmap */}
            <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
              <defs>
                {/* Define gradients for each segment */}
                {segments.map((segment, index) => {
                  const color = getHeatmapColor(segment.sunlightIntensity.average)
                  return (
                    <radialGradient key={`gradient-${index}`} id={`heat-${index}`}>
                      <stop offset="0%" stopColor={`rgb(${color.r}, ${color.g}, ${color.b})`} stopOpacity="0.8" />
                      <stop offset="50%" stopColor={`rgb(${color.r}, ${color.g}, ${color.b})`} stopOpacity="0.4" />
                      <stop offset="100%" stopColor={`rgb(${color.r}, ${color.g}, ${color.b})`} stopOpacity="0" />
                    </radialGradient>
                  )
                })}
              </defs>

              {/* Render heat circles for each segment */}
              {segments.map((segment, index) => {
                const color = getHeatmapColor(segment.sunlightIntensity.average)
                // Position based on index (simplified layout)
                const x = 250 + (index % 3) * 300
                const y = 300 + Math.floor(index / 3) * 180
                const radius = 80 + (segment.area / 100) * 30

                return (
                  <motion.g key={segment.id}>
                    {/* Heat glow */}
                    <motion.circle
                      cx={x}
                      cy={y}
                      r={radius}
                      fill={`url(#heat-${index})`}
                      initial={{ r: 0, opacity: 0 }}
                      animate={{ r: radius, opacity: 1 }}
                      transition={{
                        duration: 0.8,
                        delay: index * 0.15,
                        ease: 'easeOut'
                      }}
                    />

                    {/* Pulsing rings */}
                    {segment.sunlightIntensity.quality === 'excellent' && (
                      <motion.circle
                        cx={x}
                        cy={y}
                        r={radius}
                        fill="none"
                        stroke={`rgb(${color.r}, ${color.g}, ${color.b})`}
                        strokeWidth="3"
                        initial={{ r: radius * 0.8, opacity: 0.8 }}
                        animate={{
                          r: radius * 1.5,
                          opacity: 0
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.2
                        }}
                      />
                    )}

                    {/* Intensity value label */}
                    <motion.text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-sm font-bold fill-white"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.15 }}
                    >
                      {Math.round(segment.sunlightIntensity.average)}
                    </motion.text>
                    <motion.text
                      x={x}
                      y={y + 18}
                      textAnchor="middle"
                      className="text-xs fill-gray-300"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.15 }}
                    >
                      kWh/m²
                    </motion.text>
                  </motion.g>
                )
              })}
            </svg>
          </motion.div>
        )}

        {/* Real data badge */}
        {dataLayers && fluxLoaded && (
          <motion.div
            className="absolute top-4 right-4 bg-emerald-500/90 text-white px-3 py-1 rounded-full text-xs font-semibold z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
          >
            Real Solar Data
          </motion.div>
        )}

        {/* Scanning effect */}
        {fluxLoaded && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/0 via-amber-500/30 to-amber-500/0" />
          </motion.div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900/50 rounded-lg p-6 border border-gray-800"
        >
          <h3 className="text-white font-semibold mb-4">Sunlight Intensity Map</h3>

          {/* Color scale */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-400">Solar Potential</span>
            </div>
            <div className="relative h-8 rounded-lg overflow-hidden">
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to right, rgb(239, 68, 68), rgb(249, 115, 22), rgb(234, 179, 8), rgb(16, 185, 129))'
                }}
              />
              {/* Value markers */}
              <div className="absolute inset-0 flex justify-between items-end px-2 pb-1">
                <span className="text-xs text-white font-semibold drop-shadow-lg">Poor</span>
                <span className="text-xs text-white font-semibold drop-shadow-lg">Fair</span>
                <span className="text-xs text-white font-semibold drop-shadow-lg">Good</span>
                <span className="text-xs text-white font-semibold drop-shadow-lg">Excellent</span>
              </div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>&lt;900</span>
              <span>900-1200</span>
              <span>1200-1500</span>
              <span>&gt;1500</span>
            </div>
            <div className="text-center text-xs text-gray-500 mt-1">kWh/m²/year</div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold text-white">
                {Math.round(segments.reduce((sum, s) => sum + s.sunlightIntensity.average, 0) / segments.length)}
              </div>
              <div className="text-xs text-gray-500">Avg. Intensity</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-500">
                {segments.filter(s => s.sunlightIntensity.quality === 'excellent').length}
              </div>
              <div className="text-xs text-gray-500">Excellent Zones</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">
                {segments.filter(s => s.sunlightIntensity.quality === 'good').length}
              </div>
              <div className="text-xs text-gray-500">Good Zones</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {segments.filter(s => s.isOptimal).length}
              </div>
              <div className="text-xs text-gray-500">Optimal Segments</div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
