'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchAndParseGeoTiff, geoTiffToImageData } from '@/lib/utils/geotiff'

export interface ShadowPatternAnimationProps {
  center: { latitude: number; longitude: number }
  shadowPatterns?: {
    summerSolstice: string
    winterSolstice: string
    equinox: string
  } | null
  onComplete: () => void
  isActive: boolean
}

type Season = 'summer' | 'winter' | 'equinox'

export default function ShadowPatternAnimation({
  center,
  shadowPatterns,
  onComplete,
  isActive
}: ShadowPatternAnimationProps) {
  const [currentSeason, setCurrentSeason] = useState<Season>('summer')
  const [mapLoaded, setMapLoaded] = useState(false)
  const [shadowsLoaded, setShadowsLoaded] = useState<Record<Season, boolean>>({
    summer: false,
    winter: false,
    equinox: false
  })

  const summerCanvasRef = useRef<HTMLCanvasElement>(null)
  const winterCanvasRef = useRef<HTMLCanvasElement>(null)
  const equinoxCanvasRef = useRef<HTMLCanvasElement>(null)

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center.latitude},${center.longitude}&zoom=20&size=1200x800&maptype=satellite&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`

  // Load shadow GeoTIFFs
  useEffect(() => {
    if (!isActive || !shadowPatterns) return

    const loadShadows = async () => {
      try {
        // Load summer solstice shadows
        if (shadowPatterns.summerSolstice && summerCanvasRef.current) {
          console.log('[SHADOWS] Loading summer solstice pattern...')
          const summerData = await fetchAndParseGeoTiff(shadowPatterns.summerSolstice)
          const summerImage = geoTiffToImageData(summerData, 0.6)
          const ctx = summerCanvasRef.current.getContext('2d')
          if (ctx) {
            ctx.putImageData(summerImage, 0, 0)
            setShadowsLoaded(prev => ({ ...prev, summer: true }))
          }
        }

        // Load winter solstice shadows
        if (shadowPatterns.winterSolstice && winterCanvasRef.current) {
          console.log('[SHADOWS] Loading winter solstice pattern...')
          const winterData = await fetchAndParseGeoTiff(shadowPatterns.winterSolstice)
          const winterImage = geoTiffToImageData(winterData, 0.6)
          const ctx = winterCanvasRef.current.getContext('2d')
          if (ctx) {
            ctx.putImageData(winterImage, 0, 0)
            setShadowsLoaded(prev => ({ ...prev, winter: true }))
          }
        }

        // Load equinox shadows
        if (shadowPatterns.equinox && equinoxCanvasRef.current) {
          console.log('[SHADOWS] Loading equinox pattern...')
          const equinoxData = await fetchAndParseGeoTiff(shadowPatterns.equinox)
          const equinoxImage = geoTiffToImageData(equinoxData, 0.6)
          const ctx = equinoxCanvasRef.current.getContext('2d')
          if (ctx) {
            ctx.putImageData(equinoxImage, 0, 0)
            setShadowsLoaded(prev => ({ ...prev, equinox: true }))
          }
        }

        console.log('[SHADOWS] All shadow patterns loaded')
      } catch (error) {
        console.error('[SHADOWS] Failed to load shadow patterns:', error)
      }
    }

    loadShadows()
  }, [isActive, shadowPatterns])

  // Animate through seasons
  useEffect(() => {
    if (!isActive || !mapLoaded) return

    const timeline = [
      { season: 'summer' as Season, delay: 500 },
      { season: 'equinox' as Season, delay: 1700 },
      { season: 'winter' as Season, delay: 2900 }
    ]

    const timers = timeline.map(({ season, delay }) =>
      setTimeout(() => setCurrentSeason(season), delay)
    )

    const completeTimer = setTimeout(() => {
      onComplete()
    }, 4200)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(completeTimer)
    }
  }, [isActive, mapLoaded, onComplete])

  const seasonInfo = {
    summer: {
      name: 'Summer Solstice',
      date: 'June 21',
      description: 'Longest day - shortest shadows',
      sunIcon: '☀️',
      color: 'from-amber-500 to-orange-500'
    },
    equinox: {
      name: 'Spring/Fall Equinox',
      date: 'March/September 21',
      description: 'Equal day & night - medium shadows',
      sunIcon: '🌤️',
      color: 'from-yellow-500 to-amber-500'
    },
    winter: {
      name: 'Winter Solstice',
      date: 'December 21',
      description: 'Shortest day - longest shadows',
      sunIcon: '⛅',
      color: 'from-blue-400 to-blue-600'
    }
  }

  if (!shadowPatterns) {
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
        {/* Satellite base layer */}
        <img
          src={mapUrl}
          alt="Satellite view"
          className="w-full h-full object-cover"
          onLoad={() => setMapLoaded(true)}
        />

        {/* Shadow overlays */}
        <AnimatePresence mode="wait">
          {mapLoaded && (
            <>
              {/* Summer shadows */}
              <motion.canvas
                key="summer"
                ref={summerCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: currentSeason === 'summer' && shadowsLoaded.summer ? 1 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ mixBlendMode: 'multiply' }}
              />

              {/* Equinox shadows */}
              <motion.canvas
                key="equinox"
                ref={equinoxCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: currentSeason === 'equinox' && shadowsLoaded.equinox ? 1 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ mixBlendMode: 'multiply' }}
              />

              {/* Winter shadows */}
              <motion.canvas
                key="winter"
                ref={winterCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: currentSeason === 'winter' && shadowsLoaded.winter ? 1 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ mixBlendMode: 'multiply' }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Season indicator overlay */}
        {mapLoaded && (
          <motion.div
            key={currentSeason}
            className="absolute bottom-6 left-6 right-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className={`bg-gradient-to-r ${seasonInfo[currentSeason].color} rounded-lg p-4 text-white shadow-2xl`}>
              <div className="flex items-center gap-3">
                <div className="text-4xl">{seasonInfo[currentSeason].sunIcon}</div>
                <div className="flex-1">
                  <div className="font-bold text-lg">{seasonInfo[currentSeason].name}</div>
                  <div className="text-sm opacity-90">{seasonInfo[currentSeason].date}</div>
                  <div className="text-xs opacity-75 mt-1">{seasonInfo[currentSeason].description}</div>
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

      {/* Season timeline */}
      <div className="flex items-center justify-center gap-4">
        {(['summer', 'equinox', 'winter'] as Season[]).map((season, index) => (
          <motion.div
            key={season}
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: currentSeason === season ? 1.2 : 1
            }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center text-2xl
              ${currentSeason === season ? 'bg-gradient-to-r ' + seasonInfo[season].color : 'bg-gray-800'}
              transition-all duration-300
            `}>
              {seasonInfo[season].sunIcon}
            </div>
            <div className={`
              text-xs font-semibold
              ${currentSeason === season ? 'text-white' : 'text-gray-500'}
              transition-colors duration-300
            `}>
              {season === 'summer' ? 'Summer' : season === 'winter' ? 'Winter' : 'Equinox'}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
