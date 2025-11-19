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

  // Combine both scenarios for dual-line chart
  const combinedProjections = useMemo(() => {
    if (!analysisData?.analysis?.withGrant?.projections || !analysisData?.analysis?.withoutGrant?.projections) {
      return []
    }
    return analysisData.analysis.withGrant.projections.map((item, index) => ({
      year: item.year,
      withGrantSavings: item.cumulativeSavings,
      withoutGrantSavings: analysisData.analysis.withoutGrant.projections[index]?.cumulativeSavings || 0
    }))
  }, [analysisData])

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
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Invalid Parameters</h1>
          <p className="text-gray-400 mb-6">Please start from the home page to analyze a location.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-full font-semibold hover:from-red-500 hover:to-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] border border-red-500/50"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-16">
        {/* Progress Indicator */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 text-sm text-gray-400">
            <span className="text-green-500">✓ Step 1: Location</span>
            <span className="text-gray-600">→</span>
            <span className="text-red-500 font-semibold">Step 2: Analysis</span>
            <span className="text-gray-600">→</span>
            <span>Step 3: Quote</span>
          </div>
        </div>

        {/* Hero Section - "Your Roof Will PAY YOU" */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-red-900/40 via-orange-900/30 to-amber-900/40 border border-red-500/40 rounded-3xl p-8 sm:p-12 md:p-16 shadow-[0_0_60px_rgba(239,68,68,0.3)] backdrop-blur-sm max-w-5xl mx-auto"
          >
            <div className="mb-4">
              <p className="text-red-400 text-sm sm:text-base font-semibold uppercase tracking-wider mb-2">
                Government-Backed Income Opportunity
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 leading-tight">
                YOUR ROOF WILL <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-amber-500">PAY YOU</span>
              </h1>
            </div>

            {analysisData && (
              <>
                <div className="mb-6">
                  <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500 mb-2 leading-none">
                    €{Math.round(analysisData.analysis.withGrant.twentyYearSavings).toLocaleString()}
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl text-white font-semibold mb-2">
                    OVER 20 YEARS
                  </p>
                  <p className="text-base sm:text-lg md:text-xl text-gray-300">
                    That's <span className="text-amber-400 font-bold">€{Math.round(analysisData.analysis.withGrant.twentyYearSavings / 20 / 12).toLocaleString()}</span> in passive income every month
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
                  <div className="bg-gray-900/60 border border-green-500/40 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="font-semibold text-sm sm:text-base">Break Even</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white">2 Years</p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">Then pure profit!</p>
                  </div>

                  <div className="bg-gray-900/60 border border-amber-500/40 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-amber-400 mb-2">
                      <DollarSign className="w-5 h-5 flex-shrink-0" />
                      <span className="font-semibold text-sm sm:text-base">Government Grant</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white">€2,400</p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">Included!</p>
                  </div>

                  <div className="bg-gray-900/60 border border-red-500/40 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <TrendingUp className="w-5 h-5 flex-shrink-0" />
                      <span className="font-semibold text-sm sm:text-base">ROI</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-white">540%</p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">Over 20 years</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400">
                  <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="break-words">{address}</p>
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Analysis Error State */}
        {analysisError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 flex gap-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white mb-2">Analysis Failed</h3>
                <p className="text-gray-300 mb-4">{analysisError}</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg font-semibold hover:from-red-500 hover:to-red-600 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-red-500/50"
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
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg p-12 text-center backdrop-blur-sm">
              <Loader2 className="w-16 h-16 text-red-500 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-2">
                Analyzing Your Property
              </h2>
              <p className="text-gray-400">
                We're calculating the solar potential for your location...
              </p>
              <div className="mt-6 flex justify-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce shadow-[0_0_8px_rgba(239,68,68,0.6)]" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce shadow-[0_0_8px_rgba(245,158,11,0.6)]" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce shadow-[0_0_8px_rgba(249,115,22,0.6)]" style={{ animationDelay: '0.4s' }}></div>
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
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${
                analysisData.analysisType === 'google_solar'
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
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
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg p-4 sm:p-6 hover:border-yellow-500/50 transition-all">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="font-semibold text-xs sm:text-sm md:text-base text-gray-300">System Size</h3>
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {analysisData.analysis.systemSize.toFixed(1)} kW
                </p>
                <p className="text-xs sm:text-sm text-gray-400 mt-2">
                  {analysisData.analysis.panelsCount} panels
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg p-4 sm:p-6 hover:border-orange-500/50 transition-all">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="font-semibold text-xs sm:text-sm md:text-base text-gray-300">Annual Generation</h3>
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {Math.round(analysisData.analysis.yearlyGeneration).toLocaleString()} kWh
                </p>
                <p className="text-xs sm:text-sm text-gray-400 mt-2">per year</p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg p-4 sm:p-6 hover:border-amber-500/50 transition-all">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="font-semibold text-xs sm:text-sm md:text-base text-gray-300">Roof Area</h3>
                  <Home className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {analysisData.analysis.roofArea.toFixed(0)} m²
                </p>
                <p className="text-xs sm:text-sm text-gray-400 mt-2">usable area</p>
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
                <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
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
                    <div className="w-full h-48 sm:h-64 md:h-96 flex items-center justify-center bg-gray-900">
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-6xl mx-auto mb-12"
            >
                  {/* Income Metrics */}
                  <div className="bg-gradient-to-br from-red-900/30 via-orange-900/20 to-amber-900/30 border border-red-500/30 rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.2)] p-6 sm:p-8 mb-8 backdrop-blur-sm">
                    <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-2">
                      YOUR 20-YEAR INCOME STREAM
                    </h2>
                    <p className="text-center text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">
                      Government pays you for every kWh you generate
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                      {/* Total 20-Year Income */}
                      <div className="text-center bg-gray-800/80 backdrop-blur-sm border border-green-500/40 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-green-500/30 transition-all">
                        <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mx-auto mb-3" />
                        <p className="text-3xl sm:text-4xl font-bold text-green-500 mb-2">
                          €{Math.round(analysisData.analysis.withGrant.twentyYearSavings).toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-300">Total Income</p>
                        <p className="text-xs text-gray-500 mt-1">over 20 years</p>
                      </div>

                      {/* Pure Profit Starts */}
                      <div className="text-center bg-gray-800/80 backdrop-blur-sm border border-amber-500/30 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-amber-500/30 transition-all">
                        <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 mx-auto mb-3" />
                        <p className="text-3xl sm:text-4xl font-bold text-amber-500 mb-2">
                          Year {analysisData.analysis.withGrant.roiYears}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-300">Pure Profit Starts</p>
                        <p className="text-xs text-gray-500 mt-1">Investment recovered</p>
                      </div>

                      {/* Government Grant */}
                      <div className="text-center bg-gray-800/80 backdrop-blur-sm border border-amber-500/30 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-amber-500/30 transition-all">
                        <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 mx-auto mb-3" />
                        <p className="text-3xl sm:text-4xl font-bold text-amber-500 mb-2">
                          €{analysisData.analysis.withGrant.grantAmount.toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-300">Government Grant</p>
                        <p className="text-xs text-gray-500 mt-1">30% of installation cost</p>
                      </div>
                    </div>

                    {/* Monthly Averages */}
                    <div className="text-center text-sm text-gray-400 bg-black/30 border border-gray-700 rounded-lg p-3 sm:p-4">
                      <span className="font-semibold text-red-400">
                        €{Math.round(analysisData.analysis.withGrant.twentyYearSavings / 20 / 12)}/month
                      </span>
                      {' '}with grant
                      <span className="mx-2">|</span>
                      <span className="font-semibold text-amber-400">
                        €{Math.round(analysisData.analysis.withoutGrant.twentyYearSavings / 20 / 12)}/month
                      </span>
                      {' '}without grant
                    </div>
                  </div>

                  {/* Income Timeline Chart */}
                  {combinedProjections.length > 0 && (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg p-6 sm:p-8 mb-8 backdrop-blur-sm">
                      <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white">
                        Your Income Growth Over 20 Years
                      </h3>
                      <p className="text-sm text-gray-400 mb-4 sm:mb-6">
                        Watch your passive income accumulate month after month
                      </p>
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
                            stroke="#DC2626"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6 }}
                            name="With Grant (€0.105/kWh)"
                          />
                          <Line
                            type="monotone"
                            dataKey="withoutGrantSavings"
                            stroke="#F59E0B"
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
                  <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg p-6 sm:p-8 mb-8 backdrop-blur-sm">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white">
                      Choose Your Income Strategy
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400 mb-6">
                      Both options generate excellent returns - choose based on your situation
                    </p>

                    {/* Strategy Comparison Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* WITH GRANT - Lower Risk Strategy */}
                      <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-6 space-y-4">
                        <div className="text-center mb-4">
                          <h4 className="text-lg font-bold text-red-400 mb-2">Lower Risk Strategy</h4>
                          <p className="text-xs text-gray-400">Start cheaper, earn sooner</p>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Your Investment:</span>
                            <span className="text-xl font-bold text-white">€{analysisData.analysis.withGrant.upfrontCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-green-400">
                            <span>Government Grant:</span>
                            <span className="font-semibold">-€{analysisData.analysis.withGrant.grantAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                            <span className="text-gray-400">Income Rate:</span>
                            <span className="text-lg font-bold text-red-400">€{analysisData.analysis.withGrant.feedInTariff}/kWh</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Annual Income:</span>
                            <span className="font-semibold text-white">€{Math.round(analysisData.analysis.withGrant.yearlyRevenue).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Breakeven:</span>
                            <span className="font-semibold text-white">{analysisData.analysis.withGrant.roiYears} years</span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                            <span className="text-gray-300 font-semibold">20-Year Total:</span>
                            <span className="text-2xl font-bold text-red-400">€{Math.round(analysisData.analysis.withGrant.twentyYearSavings).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="bg-gray-900/60 rounded-lg p-3 mt-4">
                          <p className="text-xs text-gray-400 text-center">
                            ✓ Best if you want lower upfront cost<br/>
                            ✓ Faster return on investment
                          </p>
                        </div>
                      </div>

                      {/* WITHOUT GRANT - Maximum Income Strategy */}
                      <div className="bg-amber-900/20 border border-amber-500/40 rounded-xl p-6 space-y-4">
                        <div className="text-center mb-4">
                          <h4 className="text-lg font-bold text-amber-400 mb-2">Maximum Income Strategy</h4>
                          <p className="text-xs text-gray-400">Invest more, earn more</p>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Your Investment:</span>
                            <span className="text-xl font-bold text-white">€{analysisData.analysis.withoutGrant.upfrontCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-600">
                            <span>Government Grant:</span>
                            <span className="font-semibold">€0</span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                            <span className="text-gray-400">Income Rate:</span>
                            <span className="text-lg font-bold text-amber-400">€{analysisData.analysis.withoutGrant.feedInTariff}/kWh</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Annual Income:</span>
                            <span className="font-semibold text-white">€{Math.round(analysisData.analysis.withoutGrant.yearlyRevenue).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Breakeven:</span>
                            <span className="font-semibold text-white">{analysisData.analysis.withoutGrant.roiYears} years</span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                            <span className="text-gray-300 font-semibold">20-Year Total:</span>
                            <span className="text-2xl font-bold text-amber-400">€{Math.round(analysisData.analysis.withoutGrant.twentyYearSavings).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="bg-gray-900/60 rounded-lg p-3 mt-4">
                          <p className="text-xs text-gray-400 text-center">
                            ✓ Best if you can afford upfront cost<br/>
                            ✓ 43% higher income rate (€0.15 vs €0.105)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Comparison Table - Keep existing for those who want details */}
                    <details className="mt-6">
                      <summary className="text-sm text-gray-400 cursor-pointer hover:text-white transition-colors">
                        View detailed comparison table →
                      </summary>
                    <div className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Metric Labels */}
                      <div className="text-xs sm:text-sm font-medium text-gray-400 space-y-3 sm:space-y-4">
                        <div className="h-8 sm:h-10 flex items-center">Installation Cost</div>
                        <div className="h-8 sm:h-10 flex items-center">Government Grant</div>
                        <div className="h-8 sm:h-10 flex items-center">Your Investment</div>
                        <div className="h-8 sm:h-10 flex items-center border-t pt-2 sm:pt-4">Feed-in Tariff</div>
                        <div className="h-8 sm:h-10 flex items-center">Annual Revenue</div>
                        <div className="h-8 sm:h-10 flex items-center">Breakeven Time</div>
                        <div className="h-10 sm:h-12 flex items-center text-base sm:text-lg font-bold">20-Year Total</div>
                      </div>

                      {/* WITH GRANT */}
                      <div className="bg-red-900/20 rounded-lg p-3 sm:p-4 border-2 border-red-500/50 space-y-3 sm:space-y-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <div className="text-center font-bold text-red-400 mb-2 text-sm sm:text-base">
                          ✓ WITH GRANT
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-base sm:text-xl text-white">
                          €{analysisData.analysis.withGrant.installationCost.toLocaleString()}
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-base sm:text-xl text-red-400">
                          -€{analysisData.analysis.withGrant.grantAmount.toLocaleString()}
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-base sm:text-xl font-bold text-white">
                          €{analysisData.analysis.withGrant.upfrontCost.toLocaleString()}
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center border-t border-gray-700 pt-2 sm:pt-4 text-sm sm:text-lg text-gray-300">
                          €{analysisData.analysis.withGrant.feedInTariff}/kWh
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-sm sm:text-lg text-gray-300">
                          €{Math.round(analysisData.analysis.withGrant.yearlyRevenue).toLocaleString()}/yr
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-sm sm:text-lg text-gray-300">
                          {analysisData.analysis.withGrant.roiYears} years
                        </div>
                        <div className="h-10 sm:h-12 flex items-center justify-center text-xl sm:text-2xl font-bold text-red-400">
                          €{Math.round(analysisData.analysis.withGrant.twentyYearSavings).toLocaleString()}
                        </div>
                      </div>

                      {/* WITHOUT GRANT */}
                      <div className="bg-amber-900/20 rounded-lg p-3 sm:p-4 border border-amber-500/40 space-y-3 sm:space-y-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                        <div className="text-center font-bold text-amber-400 mb-2 text-sm sm:text-base">
                          WITHOUT GRANT
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-base sm:text-xl text-white">
                          €{analysisData.analysis.withoutGrant.installationCost.toLocaleString()}
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-base sm:text-xl text-gray-600">
                          €0
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-base sm:text-xl font-bold text-white">
                          €{analysisData.analysis.withoutGrant.upfrontCost.toLocaleString()}
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center border-t border-gray-700 pt-2 sm:pt-4 text-sm sm:text-lg text-gray-300">
                          €{analysisData.analysis.withoutGrant.feedInTariff}/kWh
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-sm sm:text-lg text-gray-300">
                          €{Math.round(analysisData.analysis.withoutGrant.yearlyRevenue).toLocaleString()}/yr
                        </div>
                        <div className="h-8 sm:h-10 flex items-center justify-center text-sm sm:text-lg text-gray-300">
                          {analysisData.analysis.withoutGrant.roiYears} years
                        </div>
                        <div className="h-10 sm:h-12 flex items-center justify-center text-xl sm:text-2xl font-bold text-amber-400">
                          €{Math.round(analysisData.analysis.withoutGrant.twentyYearSavings).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                    </details>
                  </div>

                  {/* System Specifications (Compact) */}
                  <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 sm:p-6">
                    <h4 className="font-semibold text-white mb-3 text-sm sm:text-base">System Specifications</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-yellow-500" />
                        <span>{analysisData.analysis.panelsCount} Panels × 400W</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-red-500" />
                        <span>{analysisData.analysis.systemSize.toFixed(1)} kWp System</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-amber-500" />
                        <span>{Math.round(analysisData.analysis.yearlyGeneration).toLocaleString()} kWh/year</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-orange-500" />
                        <span>{analysisData.analysis.roofArea} m² Roof</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span>{analysisData.analysis.maxSunshineHours.toLocaleString()} hrs/year</span>
                      </div>
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
                    className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-full font-bold text-lg sm:text-xl hover:from-red-500 hover:to-red-600 transition-all shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)] border border-red-500/50 active:scale-95"
                  >
                    <DollarSign className="w-6 h-6 inline mr-2" />
                    Claim My Income Stream Now
                  </button>
                  <div className="mt-6 space-y-2">
                    <p className="text-white font-semibold">
                      Professional quote delivered in 3 hours
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        No payment required
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        No obligation
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Start earning in 3 months
                      </span>
                    </div>
                  </div>
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
