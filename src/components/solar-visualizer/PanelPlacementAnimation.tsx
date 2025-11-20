'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PanelPlacementAnimationProps } from './types'

interface Panel {
  id: number
  x: number
  y: number
  segmentIndex: number
}

export default function PanelPlacementAnimation({
  segments,
  totalPanels,
  panelDimensions,
  center,
  onComplete,
  isActive
}: PanelPlacementAnimationProps) {
  const [placedPanels, setPlacedPanels] = useState<Panel[]>([])
  const [currentPanel, setCurrentPanel] = useState(0)
  const [mapLoaded, setMapLoaded] = useState(false)

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center.latitude},${center.longitude}&zoom=20&size=1200x800&maptype=satellite&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`

  // Cap panels at reasonable number for Malta (typically 37 panels for 15kWp)
  const cappedPanels = Math.min(totalPanels, 40)

  // Timeout fallback if image doesn't load
  useEffect(() => {
    if (!isActive) return

    const timeout = setTimeout(() => {
      if (!mapLoaded) {
        console.warn('Panel placement image failed to load, proceeding anyway')
        setMapLoaded(true)
      }
    }, 3000) // Wait max 3 seconds for image

    return () => clearTimeout(timeout)
  }, [isActive, mapLoaded])

  // Calculate panel layout across segments
  useEffect(() => {
    if (!isActive || !mapLoaded) return

    // Distribute panels across segments based on their area and quality
    const panels: Panel[] = []
    let remainingPanels = cappedPanels

    // Sort segments by quality (best first)
    const sortedSegments = [...segments].sort(
      (a, b) => b.sunlightIntensity.average - a.sunlightIntensity.average
    )

    sortedSegments.forEach((segment, segmentIndex) => {
      if (remainingPanels <= 0) return

      // Calculate how many panels can fit on this segment
      const segmentPanelCapacity = Math.floor(segment.area / (panelDimensions.width * panelDimensions.height))
      const panelsForSegment = Math.min(remainingPanels, segmentPanelCapacity, 15) // Max 15 per segment

      // Generate panel positions for this segment
      const panelsPerRow = Math.ceil(Math.sqrt(panelsForSegment))
      for (let i = 0; i < panelsForSegment; i++) {
        const row = Math.floor(i / panelsPerRow)
        const col = i % panelsPerRow

        // Position based on segment index (simplified grid layout)
        const baseX = 250 + (segmentIndex % 3) * 300
        const baseY = 300 + Math.floor(segmentIndex / 3) * 180

        panels.push({
          id: panels.length,
          x: baseX + (col - panelsPerRow / 2) * 35,
          y: baseY + (row - Math.ceil(panelsForSegment / panelsPerRow) / 2) * 50,
          segmentIndex
        })
      }

      remainingPanels -= panelsForSegment
    })

    setPlacedPanels(panels)

    // Animate panel placement
    let currentIndex = 0
    const interval = setInterval(() => {
      setCurrentPanel(prev => {
        if (prev < panels.length) {
          return prev + 1
        } else {
          clearInterval(interval)
          setTimeout(onComplete, 1000)
          return prev
        }
      })
      currentIndex++
    }, 80) // Place panel every 80ms for smooth animation

    return () => clearInterval(interval)
  }, [isActive, cappedPanels, segments, panelDimensions, onComplete, mapLoaded])

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
        {/* Satellite base */}
        <img
          src={mapUrl}
          alt="Satellite view"
          className="w-full h-full object-cover"
          onLoad={() => setMapLoaded(true)}
        />

        {/* Roof segments (faint) */}
        {mapLoaded && segments.map((segment, index) => (
          <div
            key={segment.id}
            className="absolute rounded-lg border-2 border-gray-600/30 bg-gray-800/10"
            style={{
              left: `${20 + (index % 3) * 25}%`,
              top: `${30 + Math.floor(index / 3) * 20}%`,
              width: `${15 + (segment.area / 100) * 5}%`,
              height: `${10 + (segment.area / 100) * 3}%`,
            }}
          />
        ))}

        {/* Solar panels */}
        {mapLoaded && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1200 800">
            <AnimatePresence>
              {placedPanels.slice(0, currentPanel).map((panel, index) => (
                <motion.g key={panel.id}>
                  {/* Panel rectangle */}
                  <motion.rect
                    x={panel.x - 15}
                    y={panel.y - 22}
                    width="30"
                    height="44"
                    rx="2"
                    className="fill-blue-600 stroke-blue-400"
                    strokeWidth="2"
                    initial={{ scale: 0, rotate: -45, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                      delay: index * 0.02
                    }}
                  />

                  {/* Panel grid lines (realistic solar panel look) */}
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 + 0.2 }}
                  >
                    <line x1={panel.x - 15} y1={panel.y} x2={panel.x + 15} y2={panel.y} className="stroke-blue-300" strokeWidth="0.5" />
                    <line x1={panel.x} y1={panel.y - 22} x2={panel.x} y2={panel.y + 22} className="stroke-blue-300" strokeWidth="0.5" />
                  </motion.g>

                  {/* Shine effect on latest panels */}
                  {index >= currentPanel - 3 && (
                    <motion.rect
                      x={panel.x - 15}
                      y={panel.y - 22}
                      width="30"
                      height="44"
                      rx="2"
                      className="fill-white"
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </motion.g>
              ))}
            </AnimatePresence>
          </svg>
        )}

        {/* Placement indicator for current panel */}
        {currentPanel < placedPanels.length && placedPanels[currentPanel] && (
          <motion.div
            className="absolute w-12 h-16 border-4 border-amber-400 rounded-lg"
            style={{
              left: `${(placedPanels[currentPanel].x / 1200) * 100}%`,
              top: `${(placedPanels[currentPanel].y / 800) * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1]
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity
            }}
          />
        )}
      </div>

      {/* Stats panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                <motion.span
                  key={currentPanel}
                  initial={{ scale: 1.3, color: '#60a5fa' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  transition={{ duration: 0.3 }}
                >
                  {currentPanel}
                </motion.span>
                <span className="text-gray-500">/{cappedPanels}</span>
              </div>
              <div className="text-xs text-gray-500">Panels Placed</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {((currentPanel * panelDimensions.capacity) / 1000).toFixed(1)}
                <span className="text-lg text-gray-500"> kW</span>
              </div>
              <div className="text-xs text-gray-500">Current Capacity</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {Math.round(currentPanel * panelDimensions.capacity * 1.5)}
                <span className="text-lg text-gray-500"> kWh</span>
              </div>
              <div className="text-xs text-gray-500">Annual Generation</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {Math.round((currentPanel / cappedPanels) * 100)}
                <span className="text-lg text-gray-500">%</span>
              </div>
              <div className="text-xs text-gray-500">Placement Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Placement status message */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {currentPanel < cappedPanels ? (
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg">
            <motion.div
              className="w-2 h-2 rounded-full bg-white"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1]
              }}
              transition={{
                duration: 1,
                repeat: Infinity
              }}
            />
            <span>Placing panel {currentPanel + 1} of {cappedPanels}...</span>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>All {cappedPanels} panels optimally placed!</span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
