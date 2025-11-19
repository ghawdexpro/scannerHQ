'use client'

import { Suspense, useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, MapPin, Sun, Zap, Calculator, TrendingUp, Home, DollarSign, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { AnalyzeResponse, AnalyzeErrorResponse } from '@/types/api'
import { useAuth } from '@/context/AuthContext'
import QuoteRequestForm from '@/components/quote/QuoteRequestForm'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

function AnalyzeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(null)
  const [showQuoteForm, setShowQuoteForm] = useState(false)

  const address = searchParams.get('address')
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  // Access environment variable properly in client component
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // TODO: Re-enable authentication when Google/Apple OAuth is implemented
  // Authentication check disabled for development

  useEffect(() => {
    const performAnalysis = async () => {
      // TODO: Re-enable auth check when OAuth is implemented

      if (!address || !lat || !lng) {
        setAnalysisError('Invalid parameters')
        setIsAnalyzing(false)
        return
      }

      try {
        console.log('[CLIENT] Starting analysis:', { address, lat, lng })

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            address,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            userId: user?.id,
            phone: user?.phone
          })
        })

        const data = await response.json()

        if (!response.ok) {
          const errorData = data as AnalyzeErrorResponse
          console.error('[CLIENT] Analysis error:', errorData)
          setAnalysisError(errorData.message || 'Analysis failed')
          setIsAnalyzing(false)
          return
        }

        const successData = data as AnalyzeResponse
        console.log('[CLIENT] Analysis successful:', successData)

        setAnalysisData(successData)
        setAnalysisComplete(true)
      } catch (error: any) {
        console.error('[CLIENT] Unexpected error:', error)
        setAnalysisError(error.message || 'An unexpected error occurred')
      } finally {
        setIsAnalyzing(false)
      }
    }

    performAnalysis()
  }, [address, lat, lng])

  if (!address || !lat || !lng) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Parameters</h1>
          <p className="text-gray-600 mb-6">Please start from the home page to analyze a location.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Solar Analysis Results
            </h1>
            <div className="flex items-center justify-center gap-2 text-gray-600 text-sm sm:text-base">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <p className="break-words">{address}</p>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Coordinates: {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
            </p>
          </motion.div>
        </div>

        {/* Analysis Error State */}
        {analysisError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">Analysis Failed</h3>
                <p className="text-red-700 mb-4">{analysisError}</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Try Again
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Analysis Loading */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Analyzing Your Property
              </h2>
              <p className="text-gray-600">
                We're calculating the solar potential for your location...
              </p>
              <div className="mt-6 flex justify-center gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Analysis Complete */}
        {analysisComplete && analysisData && (
          <>
            {/* Analysis Type Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                analysisData.analysisType === 'google_solar'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                <CheckCircle className="w-4 h-4" />
                {analysisData.analysisType === 'google_solar'
                  ? 'Google Solar API Analysis'
                  : 'AI-Powered Roof Detection'}
              </div>
            </motion.div>

            {/* Key Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12 max-w-6xl mx-auto"
            >
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="font-semibold text-xs sm:text-sm md:text-base text-gray-700">System Size</h3>
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {analysisData.analysis.systemSize.toFixed(1)} kW
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-2">
                  {analysisData.analysis.panelsCount} panels
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="font-semibold text-xs sm:text-sm md:text-base text-gray-700">Annual Generation</h3>
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {Math.round(analysisData.analysis.yearlyGeneration).toLocaleString()} kWh
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-2">per year</p>
              </div>

              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="font-semibold text-xs sm:text-sm md:text-base text-gray-700">Roof Area</h3>
                  <Home className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {analysisData.analysis.roofArea.toFixed(0)} m²
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-2">usable area</p>
              </div>

              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="font-semibold text-xs sm:text-sm md:text-base text-gray-700">Carbon Offset</h3>
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {Math.round(analysisData.analysis.carbonOffsetYearly / 1000)} tons
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-2">CO₂ per year</p>
              </div>
            </motion.div>

            {/* Satellite Image */}
            {mapsApiKey && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="max-w-4xl mx-auto mb-8 sm:mb-12"
              >
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <img
                    src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=800x400&maptype=satellite&key=${mapsApiKey}`}
                    alt="Satellite view of property"
                    className="w-full h-48 sm:h-64 md:h-96 object-cover"
                    loading="lazy"
                    width="800"
                    height="400"
                  />
                </div>
              </motion.div>
            )}

            {/* Financial Scenarios - Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-4xl mx-auto mb-12"
            >
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="grid grid-cols-2 border-b">
                  <button className="px-6 py-4 font-semibold text-blue-600 border-b-2 border-blue-600 bg-blue-50">
                    <DollarSign className="w-5 h-5 inline mr-2" />
                    With Government Grant
                  </button>
                  <button className="px-6 py-4 font-semibold text-gray-700 hover:bg-gray-50">
                    <DollarSign className="w-5 h-5 inline mr-2" />
                    Without Grant
                  </button>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Installation Cost</p>
                      <p className="text-2xl font-bold text-gray-900">
                        €{analysisData.analysis.withGrant.installationCost.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Government Grant</p>
                      <p className="text-2xl font-bold text-green-600">
                        €{analysisData.analysis.withGrant.grantAmount.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Your Investment</p>
                      <p className="text-2xl font-bold text-gray-900">
                        €{analysisData.analysis.withGrant.upfrontCost.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Feed-in Tariff</p>
                      <p className="text-2xl font-bold text-gray-900">
                        €{analysisData.analysis.withGrant.feedInTariff.toFixed(3)}/kWh
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Annual Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        €{Math.round(analysisData.analysis.withGrant.yearlyRevenue).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">20-Year Savings</p>
                      <p className="text-2xl font-bold text-green-600">
                        €{Math.round(analysisData.analysis.withGrant.twentyYearSavings).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Chart */}
                  {analysisData.analysis.withGrant.projections && analysisData.analysis.withGrant.projections.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={analysisData.analysis.withGrant.projections}
                        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip formatter={(value) => `€${Number(value).toLocaleString()}`} />
                        <Legend />
                        <ReferenceLine y={0} stroke="#999" strokeDasharray="3 3" />
                        <Line
                          type="monotone"
                          dataKey="cumulativeSavings"
                          stroke="#059669"
                          dot={false}
                          name="Cumulative Savings"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </motion.div>

            {/* CTA / Quote Request Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="max-w-2xl mx-auto"
            >
              {!showQuoteForm ? (
                <div className="text-center">
                  <button
                    onClick={() => setShowQuoteForm(true)}
                    className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-700 transition-colors"
                  >
                    <Calculator className="w-5 h-5 inline mr-2" />
                    Get Full Quote & Save Details
                  </button>
                  <p className="text-gray-600 mt-4">
                    We'll prepare a detailed quote and contact you within 3 hours
                  </p>
                </div>
              ) : (
                <QuoteRequestForm
                  analysisId={analysisData.analysisId}
                  onSuccess={() => {
                    // Optionally redirect or show success message
                    console.log('Quote requested successfully')
                  }}
                  onCancel={() => setShowQuoteForm(false)}
                />
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnalyzeContent />
    </Suspense>
  )
}
