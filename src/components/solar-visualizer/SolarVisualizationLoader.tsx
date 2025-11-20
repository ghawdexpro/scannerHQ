'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { SolarVisualizationLoaderProps, ANIMATION_STAGES } from './types'
import { loadLibrary } from '@/lib/google/maps-service'

// Dynamically import animation components
const HeightMapAnimation = dynamic(() => import('./HeightMapAnimation'), { ssr: false })
const SunlightHeatmap = dynamic(() => import('./SunlightHeatmap'), { ssr: false })
const ShadowPatternAnimation = dynamic(() => import('./ShadowPatternAnimation'), { ssr: false })

type AnimationStageId = 'satellite' | 'height_map' | 'solar_flux' | 'shadow_patterns'

export default function SolarVisualizationLoader({
  coordinates,
  visualizationData,
  address,
  onComplete,
  onSkip,
  dataLayers
}: SolarVisualizationLoaderProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [showSkipButton, setShowSkipButton] = useState(false)
  const [sharedMap, setSharedMap] = useState<google.maps.Map | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const mapDivRef = useRef<HTMLDivElement>(null)

  const currentStage = ANIMATION_STAGES[currentStageIndex]
  const currentStageId = currentStage?.id as AnimationStageId

  // Show skip button after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkipButton(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Initialize shared map once (after satellite stage)
  useEffect(() => {
    // Only initialize map after satellite stage completes
    if (currentStageIndex < 1 || !mapDivRef.current || sharedMap) return

    const initSharedMap = async () => {
      try {
        console.log('[LOADER] Initializing shared map...')
        await loadLibrary('maps')

        const map = new google.maps.Map(mapDivRef.current!, {
          center: { lat: visualizationData.pinLocation.latitude, lng: visualizationData.pinLocation.longitude },
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

        setSharedMap(map)
        setIsMapReady(true)
        console.log('[LOADER] Shared map initialized successfully')
      } catch (error) {
        console.error('[LOADER] Failed to initialize shared map:', error)
      }
    }

    initSharedMap()
  }, [currentStageIndex, visualizationData.pinLocation, sharedMap])

  // Handle stage completion
  const handleStageComplete = useCallback(() => {
    if (currentStageIndex < ANIMATION_STAGES.length - 1) {
      setCurrentStageIndex(prev => prev + 1)
    } else {
      // All stages complete
      onComplete()
    }
  }, [currentStageIndex, onComplete])

  // Calculate overall progress
  const overallProgress = ((currentStageIndex + 1) / ANIMATION_STAGES.length) * 100

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      {/* Header with address and progress */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 p-6 md:p-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Solar Analysis
                </h1>
                <p className="text-gray-400">{address}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
                  {Math.round(overallProgress)}%
                </div>
                <div className="text-sm text-gray-500">Complete</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>

            {/* Current stage info */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-shrink-0">
                <motion.div
                  className="w-3 h-3 rounded-full bg-amber-500"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity
                  }}
                />
              </div>
              <div>
                <div className="text-white font-semibold">{currentStage?.name}</div>
                <div className="text-sm text-gray-500">{currentStage?.description}</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main visualization area */}
      <div className="relative z-0 flex-1 px-6 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Persistent shared map container */}
          {currentStageIndex >= 1 && (
            <div className="glass-card p-6 relative">
              <div
                ref={mapDivRef}
                className="aspect-video bg-gray-900 rounded-lg overflow-hidden"
              />

              {/* Overlay animations on top of shared map */}
              <AnimatePresence mode="wait">
                {/* Stage 2: Height Map (DSM) */}
                {currentStageId === 'height_map' && (
                  <HeightMapAnimation
                    key="height_map"
                    center={visualizationData.pinLocation}
                    dataLayers={dataLayers}
                    onComplete={handleStageComplete}
                    isActive={true}
                    sharedMap={sharedMap ?? undefined}
                    isMapReady={isMapReady}
                  />
                )}

                {/* Stage 3: Solar Flux (Irradiation) */}
                {currentStageId === 'solar_flux' && (
                  <SunlightHeatmap
                    key="solar_flux"
                    segments={visualizationData.roofSegments}
                    center={visualizationData.pinLocation}
                    dataLayers={dataLayers}
                    onComplete={handleStageComplete}
                    isActive={true}
                    sharedMap={sharedMap ?? undefined}
                    isMapReady={isMapReady}
                  />
                )}

                {/* Stage 4: Shadow Pattern Analysis */}
                {currentStageId === 'shadow_patterns' && (
                  <ShadowPatternAnimation
                    key="shadow_patterns"
                    center={visualizationData.pinLocation}
                    dataLayers={dataLayers}
                    onComplete={handleStageComplete}
                    isActive={true}
                    sharedMap={sharedMap ?? undefined}
                    isMapReady={isMapReady}
                  />
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Stage 1: Satellite View Loading (before shared map) */}
          {currentStageId === 'satellite' && (
            <AnimatePresence mode="wait">
              <SatelliteLoading
                key="satellite"
                coordinates={coordinates}
                onComplete={handleStageComplete}
              />
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Skip button */}
      <AnimatePresence>
        {showSkipButton && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 right-8 z-20"
          >
            <button
              onClick={onSkip}
              className="px-6 py-3 bg-gray-800/80 backdrop-blur-md text-white rounded-lg font-semibold border border-gray-700 hover:bg-gray-700/80 hover:border-gray-600 transition-all shadow-lg"
            >
              Skip Animation
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage indicators */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
        <div className="glass-card px-6 py-3">
          <div className="flex items-center gap-2">
            {ANIMATION_STAGES.map((stage, index) => (
              <div
                key={stage.id}
                className={`w-2 h-2 rounded-full transition-all ${
                  index < currentStageIndex
                    ? 'bg-emerald-500'
                    : index === currentStageIndex
                    ? 'bg-amber-500 w-4'
                    : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Satellite loading component
function SatelliteLoading({
  coordinates,
  onComplete
}: {
  coordinates: { lat: number; lng: number }
  onComplete: () => void
}) {
  const [imageLoaded, setImageLoaded] = useState(false)

  // Get static map URL
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=20&size=1200x800&maptype=satellite&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`

  useEffect(() => {
    // Auto-complete after image loads or 2 seconds
    if (imageLoaded) {
      const timer = setTimeout(onComplete, 1000)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(onComplete, 2000)
      return () => clearTimeout(timer)
    }
  }, [imageLoaded, onComplete])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-4 overflow-hidden"
    >
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500">Loading satellite view...</div>
          </div>
        )}
        <motion.img
          src={mapUrl}
          alt="Satellite view"
          className="w-full h-full object-cover"
          onLoad={() => setImageLoaded(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: imageLoaded ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        />
        {/* Scanning effect */}
        {imageLoaded && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/20 to-transparent"
            animate={{
              y: ['-100%', '200%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        )}
      </div>
    </motion.div>
  )
}
