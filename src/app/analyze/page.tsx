'use client'

import { Suspense, useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, MapPin, Sun, Zap, Calculator, TrendingUp, Home, DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react'
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
  const [imageError, setImageError] = useState(false)

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
                  {!imageError ? (
                    <img
                      src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=800x400&maptype=satellite&key=${mapsApiKey}`}
                      alt="Satellite view of property"
                      className="w-full h-48 sm:h-64 md:h-96 object-cover"
                      loading="lazy"
                      width="800"
                      height="400"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-48 sm:h-64 md:h-96 flex items-center justify-center bg-gray-100">
                      <div className="text-center text-gray-500">
                        <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Satellite image unavailable</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Financial Results - Stunning Single-Page Layout */}
            {(() => {
              // Combine both scenarios for dual-line chart
              const combinedProjections = useMemo(() => {
                if (!analysisData.analysis.withGrant.projections || !analysisData.analysis.withoutGrant.projections) {
                  return []
                }
                return analysisData.analysis.withGrant.projections.map((item, index) => ({
                  year: item.year,
                  withGrantSavings: item.cumulativeSavings,
                  withoutGrantSavings: analysisData.analysis.withoutGrant.projections[index]?.cumulativeSavings || 0
                }))
              }, [analysisData])

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="max-w-6xl mx-auto mb-12"
                >
                  {/* Hero Metrics - Big Savings Numbers */}
                  <div className="bg-gradient-to-br from-green-50 via-blue-50 to-green-50 rounded-2xl shadow-2xl p-6 sm:p-8 mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-6 sm:mb-8">
                      💰 Your Potential Solar Savings
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                      {/* Total 20-Year Savings */}
                      <div className="text-center bg-white/80 rounded-xl p-4 sm:p-6 shadow-lg">
                        <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto mb-3" />
                        <p className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">
                          €{Math.round(analysisData.analysis.withGrant.twentyYearSavings).toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">Total 20-Year Savings</p>
                        <p className="text-xs text-gray-500 mt-1">(with government grant)</p>
                      </div>

                      {/* Breakeven Time */}
                      <div className="text-center bg-white/80 rounded-xl p-4 sm:p-6 shadow-lg">
                        <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600 mx-auto mb-3" />
                        <p className="text-3xl sm:text-4xl font-bold text-amber-600 mb-2">
                          {analysisData.analysis.withGrant.roiYears}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">Years to Breakeven</p>
                        <p className="text-xs text-gray-500 mt-1">Recover your investment</p>
                      </div>

                      {/* Government Grant */}
                      <div className="text-center bg-white/80 rounded-xl p-4 sm:p-6 shadow-lg">
                        <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mx-auto mb-3" />
                        <p className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">
                          €{analysisData.analysis.withGrant.grantAmount.toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">Government Grant</p>
                        <p className="text-xs text-gray-500 mt-1">30% of installation cost</p>
                      </div>
                    </div>

                    {/* Monthly Averages */}
                    <div className="text-center text-sm text-gray-600 bg-white/60 rounded-lg p-3 sm:p-4">
                      <span className="font-semibold text-green-700">
                        €{Math.round(analysisData.analysis.withGrant.twentyYearSavings / 20 / 12)}/month
                      </span>
                      {' '}with grant
                      <span className="mx-2">|</span>
                      <span className="font-semibold text-blue-700">
                        €{Math.round(analysisData.analysis.withoutGrant.twentyYearSavings / 20 / 12)}/month
                      </span>
                      {' '}without grant
                    </div>
                  </div>

                  {/* Dual-Line Chart */}
                  {combinedProjections.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
                      <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">
                        Cumulative Savings Over 20 Years
                      </h3>
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart
                          data={combinedProjections}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="year"
                            label={{ value: 'Year', position: 'insideBottom', offset: -10 }}
                            stroke="#6b7280"
                          />
                          <YAxis
                            stroke="#6b7280"
                            tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`}
                          />
                          <Tooltip
                            formatter={(value) => [`€${Number(value).toLocaleString()}`, '']}
                            labelFormatter={(label) => `Year ${label}`}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb'
                            }}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          <ReferenceLine
                            y={0}
                            stroke="#9ca3af"
                            strokeDasharray="5 5"
                            label={{ value: 'Breakeven', position: 'right', fill: '#6b7280' }}
                          />
                          <ReferenceLine
                            x={analysisData.analysis.withGrant.roiYears}
                            stroke="#f59e0b"
                            strokeDasharray="3 3"
                            label={{
                              value: `${analysisData.analysis.withGrant.roiYears}y`,
                              position: 'top',
                              fill: '#f59e0b',
                              fontWeight: 'bold'
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="withGrantSavings"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6 }}
                            name="With Grant (€0.105/kWh)"
                          />
                          <Line
                            type="monotone"
                            dataKey="withoutGrantSavings"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                            name="Without Grant (€0.15/kWh)"
                            strokeDasharray="5 5"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Side-by-Side Comparison */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
                    <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">
                      Financial Breakdown Comparison
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Metric Labels */}
                      <div className="text-xs sm:text-sm font-medium text-gray-600 space-y-3 sm:space-y-4">
                        <div className="h-8 sm:h-10 flex items-center">Installation Cost</div>
                        <div className="h-8 sm:h-10 flex items-center">Government Grant</div>
                        <div className="h-8 sm:h-10 flex items-center">Your Investment</div>
                        <div className="h-8 sm:h-10 flex items-center border-t pt-2 sm:pt-4">Feed-in Tariff</div>
                        <div className="h-8 sm:h-10 flex items-center">Annual Revenue</div>
                        <div className="h-8 sm:h-10 flex items-center">Breakeven Time</div>
                        <div className="h-10 sm:h-12 flex items-center text-base sm:text-lg font-bold">20-Year Total</div>
                      </div>

                      {/* WITH GRANT */}
                      <div className="bg-green-50 rounded-lg p-3 sm:p-4 border-2 border-green-500 space-y-3 sm:space-y-4">
                        <div className="text-center font-bold text-green-700 mb-2 text-sm sm:text-base">
                          ✓ WITH GRANT
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-base sm:text-xl">
                          €{analysisData.analysis.withGrant.installationCost.toLocaleString()}
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-base sm:text-xl text-green-600">
                          -€{analysisData.analysis.withGrant.grantAmount.toLocaleString()}
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-base sm:text-xl font-bold">
                          €{analysisData.analysis.withGrant.upfrontCost.toLocaleString()}
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center border-t pt-2 sm:pt-4 text-sm sm:text-lg">
                          €{analysisData.analysis.withGrant.feedInTariff}/kWh
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-sm sm:text-lg">
                          €{Math.round(analysisData.analysis.withGrant.yearlyRevenue).toLocaleString()}/yr
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-sm sm:text-lg">
                          {analysisData.analysis.withGrant.roiYears} years
                        </div>
                        <div className="h-10 sm:h-12 flex items-center justify-center text-xl sm:text-2xl font-bold text-green-600">
                          €{Math.round(analysisData.analysis.withGrant.twentyYearSavings).toLocaleString()}
                        </div>
                      </div>

                      {/* WITHOUT GRANT */}
                      <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-300 space-y-3 sm:space-y-4">
                        <div className="text-center font-bold text-blue-700 mb-2 text-sm sm:text-base">
                          WITHOUT GRANT
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-base sm:text-xl">
                          €{analysisData.analysis.withoutGrant.installationCost.toLocaleString()}
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-base sm:text-xl text-gray-400">
                          €0
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-base sm:text-xl font-bold">
                          €{analysisData.analysis.withoutGrant.upfrontCost.toLocaleString()}
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center border-t pt-2 sm:pt-4 text-sm sm:text-lg">
                          €{analysisData.analysis.withoutGrant.feedInTariff}/kWh
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-sm sm:text-lg">
                          €{Math.round(analysisData.analysis.withoutGrant.yearlyRevenue).toLocaleString()}/yr
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-sm sm:text-lg">
                          {analysisData.analysis.withoutGrant.roiYears} years
                        </div>
                        <div className="h-10 sm:h-12 flex items-center justify-center text-xl sm:text-2xl font-bold text-blue-600">
                          €{Math.round(analysisData.analysis.withoutGrant.twentyYearSavings).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Specifications (Compact) */}
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                    <h4 className="font-semibold text-gray-700 mb-3 text-sm sm:text-base">System Specifications</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-yellow-600" />
                        <span>{analysisData.analysis.panelsCount} Panels × 400W</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-600" />
                        <span>{analysisData.analysis.systemSize.toFixed(1)} kWp System</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span>{Math.round(analysisData.analysis.yearlyGeneration).toLocaleString()} kWh/year</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-gray-600" />
                        <span>{analysisData.analysis.roofArea} m² Roof</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-orange-600" />
                        <span>{analysisData.analysis.maxSunshineHours.toLocaleString()} hrs/year</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })()}

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
