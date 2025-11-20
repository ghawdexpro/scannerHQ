'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RoofSegmentAnimationProps } from './types'

export default function RoofSegmentAnimation({
  segments,
  center,
  onComplete,
  isActive
}: RoofSegmentAnimationProps) {
  const [revealedSegments, setRevealedSegments] = useState<number>(0)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Satellite map URL
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center.latitude},${center.longitude}&zoom=20&size=1200x800&maptype=satellite&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`

  useEffect(() => {
    if (!isActive || !mapLoaded) return

    // Reveal segments one by one
    const interval = setInterval(() => {
      setRevealedSegments(prev => {
        if (prev < segments.length) {
          return prev + 1
        } else {
          clearInterval(interval)
          // Complete after showing all segments for a moment
          setTimeout(onComplete, 800)
          return prev
        }
      })
    }, 400) // 400ms between each segment reveal

    return () => clearInterval(interval)
  }, [isActive, segments.length, onComplete, mapLoaded])

  // Get quality color based on sunlight intensity
  const getQualityColor = (quality: 'excellent' | 'good' | 'fair' | 'poor') => {
    switch (quality) {
      case 'excellent': return 'rgb(16, 185, 129)' // emerald-500
      case 'good': return 'rgb(234, 179, 8)' // yellow-500
      case 'fair': return 'rgb(249, 115, 22)' // orange-500
      case 'poor': return 'rgb(239, 68, 68)' // red-500
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6"
    >
      {/* Satellite view with overlays */}
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
        <img
          src={mapUrl}
          alt="Satellite view with roof segments"
          className="w-full h-full object-cover"
          onLoad={() => setMapLoaded(true)}
        />

        {/* Roof segment overlays */}
        {mapLoaded && segments.slice(0, revealedSegments).map((segment, index) => (
          <motion.div
            key={segment.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Segment highlight (simplified rectangular representation) */}
            <motion.div
              className="absolute rounded-lg border-4"
              style={{
                // Position based on segment index (simplified layout)
                left: `${20 + (index % 3) * 25}%`,
                top: `${30 + Math.floor(index / 3) * 20}%`,
                width: `${15 + (segment.area / 100) * 5}%`,
                height: `${10 + (segment.area / 100) * 3}%`,
                borderColor: getQualityColor(segment.sunlightIntensity.quality),
                backgroundColor: `${getQualityColor(segment.sunlightIntensity.quality)}33`, // 20% opacity
                boxShadow: `0 0 20px ${getQualityColor(segment.sunlightIntensity.quality)}80`
              }}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 20
              }}
            >
              {/* Segment label */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <div className="bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white border border-gray-700">
                  Segment {index + 1}
                </div>
              </div>
            </motion.div>

            {/* Scanning line effect for current segment */}
            {index === revealedSegments - 1 && (
              <motion.div
                className="absolute w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"
                style={{
                  top: `${35 + Math.floor(index / 3) * 20}%`,
                }}
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{
                  duration: 0.8,
                  ease: 'easeInOut'
                }}
              />
            )}
          </motion.div>
        ))}

        {/* Grid overlay for technical feel */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full opacity-20">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-amber-500" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Segment details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments.slice(0, revealedSegments).map((segment, index) => (
          <motion.div
            key={segment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-900/50 rounded-lg p-4 border border-gray-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getQualityColor(segment.sunlightIntensity.quality) }}
              />
              <span className="font-semibold text-white">Segment {index + 1}</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Area:</span>
                <span className="text-white">{segment.area.toFixed(1)} m²</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Pitch:</span>
                <span className="text-white">{segment.pitch.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Quality:</span>
                <span
                  className="font-semibold capitalize"
                  style={{ color: getQualityColor(segment.sunlightIntensity.quality) }}
                >
                  {segment.sunlightIntensity.quality}
                </span>
              </div>
              {segment.isOptimal && (
                <div className="mt-2 flex items-center gap-1 text-emerald-400 text-xs">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Optimal orientation</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detection counter */}
      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="inline-block bg-gradient-to-r from-red-500 to-amber-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg">
          {revealedSegments} of {segments.length} roof segments detected
        </div>
      </motion.div>
    </motion.div>
  )
}
