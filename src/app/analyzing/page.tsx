'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { AnalyzeResponse } from '@/types/api'

// Dynamically import heavy components
const SolarVisualizationLoader = dynamic(
  () => import('@/components/solar-visualizer/SolarVisualizationLoader'),
  {
    loading: () => <VisualizationSkeleton />,
    ssr: false
  }
)

interface AnalysisState {
  status: 'initializing' | 'analyzing' | 'visualizing' | 'complete' | 'error' | 'skipped'
  progress: number
  message: string
  data: AnalyzeResponse | null
  error: string | null
}

export default function AnalyzingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const address = searchParams?.get('address')
  const lat = searchParams?.get('lat')
  const lng = searchParams?.get('lng')

  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: 'initializing',
    progress: 0,
    message: 'Initializing analysis...',
    data: null,
    error: null
  })

  // Run the analysis
  const runAnalysis = useCallback(async () => {
    if (!address || !lat || !lng) {
      setAnalysisState({
        status: 'error',
        progress: 0,
        message: 'Missing required parameters',
        data: null,
        error: 'Invalid request'
      })
      return
    }

    try {
      // Start analysis
      setAnalysisState(prev => ({
        ...prev,
        status: 'analyzing',
        progress: 10,
        message: 'Analyzing property location...'
      }))

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        })
      })

      setAnalysisState(prev => ({ ...prev, progress: 30, message: 'Fetching solar data...' }))

      const data: AnalyzeResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.analysis?.toString() || 'Analysis failed')
      }

      setAnalysisState(prev => ({ ...prev, progress: 50, message: 'Processing roof geometry...' }))

      // Check if we have visualization data (Google Solar API available)
      if (data.visualizationData && data.analysisType === 'google_solar') {
        // Show animated visualization
        setAnalysisState({
          status: 'visualizing',
          progress: 70,
          message: 'Preparing 3D visualization...',
          data,
          error: null
        })
      } else {
        // Skip visualization, go directly to results
        setAnalysisState({
          status: 'skipped',
          progress: 100,
          message: 'Analysis complete',
          data,
          error: null
        })

        // Navigate to results after brief delay
        setTimeout(() => {
          router.push(`/analyze?analysisId=${data.analysisId}`)
        }, 1500)
      }
    } catch (error: any) {
      console.error('Analysis error:', error)
      setAnalysisState({
        status: 'error',
        progress: 0,
        message: error.message || 'Analysis failed',
        data: null,
        error: error.message
      })
    }
  }, [address, lat, lng, router])

  // Run analysis on mount
  useEffect(() => {
    runAnalysis()
  }, [runAnalysis])

  // Handle visualization complete
  const handleVisualizationComplete = useCallback(() => {
    if (analysisState.data) {
      setAnalysisState(prev => ({ ...prev, status: 'complete', progress: 100 }))
      router.push(`/analyze?analysisId=${analysisState.data.analysisId}`)
    }
  }, [analysisState.data, router])

  // Handle skip
  const handleSkip = useCallback(() => {
    if (analysisState.data) {
      router.push(`/analyze?analysisId=${analysisState.data.analysisId}`)
    }
  }, [analysisState.data, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <AnimatePresence mode="wait">
        {/* Initializing / Analyzing State */}
        {(analysisState.status === 'initializing' || analysisState.status === 'analyzing') && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen px-6"
          >
            <AnalyzingLoader progress={analysisState.progress} message={analysisState.message} />
          </motion.div>
        )}

        {/* Visualizing State (Google Solar API available) */}
        {analysisState.status === 'visualizing' && analysisState.data?.visualizationData && (
          <motion.div
            key="visualizing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            <SolarVisualizationLoader
              coordinates={{
                lat: parseFloat(lat || '0'),
                lng: parseFloat(lng || '0')
              }}
              visualizationData={analysisState.data.visualizationData}
              address={address || ''}
              onComplete={handleVisualizationComplete}
              onSkip={handleSkip}
            />
          </motion.div>
        )}

        {/* Skipped State (AI Fallback - no visualization) */}
        {analysisState.status === 'skipped' && (
          <motion.div
            key="skipped"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen px-6"
          >
            <CompletionMessage message="Analysis complete! Redirecting..." />
          </motion.div>
        )}

        {/* Error State */}
        {analysisState.status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen px-6"
          >
            <ErrorMessage error={analysisState.error || 'Unknown error'} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Analyzing loader component
function AnalyzingLoader({ progress, message }: { progress: number; message: string }) {
  return (
    <div className="glass-card p-12 max-w-2xl w-full text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8"
      >
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* Animated sun icon */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 glow-amber"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
          {/* Sun rays */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 w-1 h-8 bg-amber-400 origin-bottom"
              style={{
                transform: `translate(-50%, -100%) rotate(${i * 45}deg)`
              }}
              animate={{
                scaleY: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
        </div>

        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
          Analyzing Your Property
        </h1>
        <p className="text-gray-400 text-lg mb-8">{message}</p>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-red-500 to-amber-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="text-gray-500 text-sm mt-2">{progress}% complete</p>
      </motion.div>
    </div>
  )
}

// Completion message
function CompletionMessage({ message }: { message: string }) {
  return (
    <div className="glass-card p-12 max-w-2xl w-full text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="w-24 h-24 mx-auto mb-8 rounded-full bg-emerald-500 flex items-center justify-center"
      >
        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>
      <h2 className="text-3xl font-bold text-white mb-4">{message}</h2>
    </div>
  )
}

// Error message
function ErrorMessage({ error }: { error: string }) {
  return (
    <div className="glass-card p-12 max-w-2xl w-full text-center border-red-500/20">
      <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-red-500 flex items-center justify-center">
        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">Analysis Failed</h2>
      <p className="text-gray-400 mb-8">{error}</p>
      <button
        onClick={() => window.history.back()}
        className="px-8 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-red-500/50 transition-all"
      >
        Go Back
      </button>
    </div>
  )
}

// Visualization skeleton loader
function VisualizationSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-white text-lg">Loading visualization...</div>
    </div>
  )
}
