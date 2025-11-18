'use client'

import { Suspense, useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, MapPin, Sun, Zap, Calculator, TrendingUp, Home, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

// Malta solar configuration constants
const MALTA_CONFIG = {
  KWH_PER_KW_YEAR: 1560, // Annual kWh production per kW in Malta
  FEED_IN_TARIFF: 0.15, // €0.15 per kWh
  DEGRADATION_RATE: 0.005, // 0.5% per year
  YEARS: 20
}

// Pricing configuration
const PRICING_CONFIG = {
  ORIGINAL_PRICE_PER_KWP: 500, // €500 per kWp (original price)
  PRICE_PER_KWP: 350, // €350 per kWp (Black Friday discount)
  FIXED_COST: 1500 // €1,500 for documents and installation
}

// Calculate annual production for a given system size
const calculateAnnualProduction = (systemSizeKW: number): number => {
  return systemSizeKW * MALTA_CONFIG.KWH_PER_KW_YEAR
}

// Calculate yearly income from production
const calculateYearlyIncome = (productionKWh: number): number => {
  return productionKWh * MALTA_CONFIG.FEED_IN_TARIFF
}

// Calculate total system cost
const calculateSystemCost = (systemSizeKW: number): number => {
  return (systemSizeKW * PRICING_CONFIG.PRICE_PER_KWP) + PRICING_CONFIG.FIXED_COST
}

// Calculate 20-year income projection with degradation
const calculate20YearIncome = (systemSizeKW: number) => {
  const baseProduction = calculateAnnualProduction(systemSizeKW)
  let cumulativeIncome = 0

  return Array.from({ length: MALTA_CONFIG.YEARS + 1 }, (_, index) => {
    if (index === 0) {
      return { year: 0, income: 0, cumulative: 0 }
    }

    // Calculate production for this year with degradation
    const yearProduction = baseProduction * Math.pow(1 - MALTA_CONFIG.DEGRADATION_RATE, index - 1)
    const yearIncome = calculateYearlyIncome(yearProduction)
    cumulativeIncome += yearIncome

    return {
      year: index,
      income: Math.round(yearIncome),
      cumulative: Math.round(cumulativeIncome)
    }
  })
}

function AnalyzeContent() {
  const searchParams = useSearchParams()
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [analysisComplete, setAnalysisComplete] = useState(false)

  const address = searchParams.get('address')
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  // Calculate projections for both scenarios
  const minSystemSize = 6 // kW (midpoint of 5-8 kW)
  const optimalSystemSize = 15 // kW

  const minSystemData = useMemo(() => calculate20YearIncome(minSystemSize), [minSystemSize])
  const optimalSystemData = useMemo(() => calculate20YearIncome(optimalSystemSize), [optimalSystemSize])

  // Calculate system costs
  const minSystemCost = calculateSystemCost(minSystemSize)
  const optimalSystemCost = calculateSystemCost(optimalSystemSize)

  // Combine data for chart - showing net profit (income - installation cost)
  const chartData = useMemo(() => {
    return minSystemData.map((minData, index) => ({
      year: minData.year,
      minimum: minData.cumulative - minSystemCost, // Net profit
      optimal: optimalSystemData[index].cumulative - optimalSystemCost // Net profit
    }))
  }, [minSystemData, optimalSystemData, minSystemCost, optimalSystemCost])

  useEffect(() => {
    // Simulate analysis process
    const timer = setTimeout(() => {
      setIsAnalyzing(false)
      setAnalysisComplete(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

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
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Solar Analysis Results
            </h1>
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <MapPin className="w-5 h-5" />
              <p>{address}</p>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Coordinates: {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
            </p>
          </motion.div>
        </div>

        {/* Analysis Loading */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Analyzing Your Property
              </h2>
              <p className="text-gray-600 mb-8">
                Our AI is processing satellite imagery and calculating solar potential...
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-left bg-blue-50 rounded-lg p-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sun className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Analyzing roof area</p>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                      <div className="bg-blue-600 h-2 rounded-full w-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left bg-green-50 rounded-lg p-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Calculating energy production</p>
                    <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                      <div className="bg-green-600 h-2 rounded-full w-2/3 animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left bg-purple-50 rounded-lg p-4">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Computing 20-year projections</p>
                    <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                      <div className="bg-purple-600 h-2 rounded-full w-1/3 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Analysis Complete */}
        {analysisComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sun className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Analysis Complete!
                </h2>
                <p className="text-gray-600">
                  Your property has excellent solar potential
                </p>
              </div>

              {/* System Size Comparison */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  Choose Your System Size
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Minimum System */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <Sun className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Minimum System</h4>
                        <p className="text-sm text-gray-600">5-8 kW Range</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">System Size:</span>
                        <span className="font-bold text-gray-900">{minSystemSize} kW</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Annual Production:</span>
                        <span className="font-bold text-gray-900">{calculateAnnualProduction(minSystemSize).toLocaleString()} kWh</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Yearly Income:</span>
                        <span className="font-bold text-green-600">€{minSystemData[1].income.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-blue-300 pt-3 mt-3">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-semibold text-gray-900">20-Year Total:</span>
                          <span className="font-bold text-2xl text-blue-600">€{minSystemData[20].cumulative.toLocaleString()}</span>
                        </div>

                        {/* System Cost - Highlighted with Black Friday Discount */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-3 -mx-1 relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-bl-lg">
                            BLACK FRIDAY
                          </div>
                          <div className="flex justify-between items-center mt-6">
                            <span className="font-semibold">Our Price:</span>
                            <div className="text-right">
                              <div className="text-xs text-blue-200 line-through">
                                €{((minSystemSize * PRICING_CONFIG.ORIGINAL_PRICE_PER_KWP) + PRICING_CONFIG.FIXED_COST).toLocaleString()}
                              </div>
                              <span className="font-bold text-xl text-yellow-300">€{calculateSystemCost(minSystemSize).toLocaleString()}</span>
                            </div>
                          </div>
                          <p className="text-xs text-blue-100 mt-1">
                            <span className="line-through">€{PRICING_CONFIG.ORIGINAL_PRICE_PER_KWP}/kWp</span> <span className="text-yellow-300 font-bold">€{PRICING_CONFIG.PRICE_PER_KWP}/kWp</span> + €{PRICING_CONFIG.FIXED_COST} installation
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Optimal System */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-300 relative overflow-hidden">
                    <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      RECOMMENDED
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Optimal System</h4>
                        <p className="text-sm text-gray-600">Maximum ROI</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">System Size:</span>
                        <span className="font-bold text-gray-900">{optimalSystemSize} kW</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Annual Production:</span>
                        <span className="font-bold text-gray-900">{calculateAnnualProduction(optimalSystemSize).toLocaleString()} kWh</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Yearly Income:</span>
                        <span className="font-bold text-green-600">€{optimalSystemData[1].income.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-purple-300 pt-3 mt-3">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-semibold text-gray-900">20-Year Total:</span>
                          <span className="font-bold text-2xl text-purple-600">€{optimalSystemData[20].cumulative.toLocaleString()}</span>
                        </div>

                        {/* System Cost - Highlighted with Black Friday Discount */}
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg p-3 -mx-1 relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-bl-lg">
                            BLACK FRIDAY
                          </div>
                          <div className="flex justify-between items-center mt-6">
                            <span className="font-semibold">Our Price:</span>
                            <div className="text-right">
                              <div className="text-xs text-purple-200 line-through">
                                €{((optimalSystemSize * PRICING_CONFIG.ORIGINAL_PRICE_PER_KWP) + PRICING_CONFIG.FIXED_COST).toLocaleString()}
                              </div>
                              <span className="font-bold text-xl text-yellow-300">€{calculateSystemCost(optimalSystemSize).toLocaleString()}</span>
                            </div>
                          </div>
                          <p className="text-xs text-purple-100 mt-1">
                            <span className="line-through">€{PRICING_CONFIG.ORIGINAL_PRICE_PER_KWP}/kWp</span> <span className="text-yellow-300 font-bold">€{PRICING_CONFIG.PRICE_PER_KWP}/kWp</span> + €{PRICING_CONFIG.FIXED_COST} installation
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 20-Year Net Profit & Break-Even Chart */}
              <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    20-Year Net Profit & Break-Even Analysis
                  </h3>
                  <p className="text-gray-600">
                    Net profit after installation cost. Line crosses zero at break-even point. (€0.15/kWh feed-in tariff, 0.5% annual degradation)
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

                    {/* Break-even line at y=0 */}
                    <ReferenceLine
                      y={0}
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      label={{
                        value: 'Break-Even',
                        position: 'insideTopRight',
                        fill: '#ef4444',
                        fontWeight: 'bold'
                      }}
                    />

                    <XAxis
                      dataKey="year"
                      label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                      stroke="#6b7280"
                    />
                    <YAxis
                      label={{ value: 'Net Profit (€)', angle: -90, position: 'insideLeft' }}
                      stroke="#6b7280"
                      tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        value >= 0
                          ? `€${value.toLocaleString()} profit`
                          : `-€${Math.abs(value).toLocaleString()} (investment)`,
                        ''
                      ]}
                      labelFormatter={(label) => `Year ${label}`}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value) => value === 'minimum' ? 'Minimum System (6 kW)' : 'Optimal System (15 kW)'}
                    />
                    <Line
                      type="monotone"
                      dataKey="minimum"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={false}
                      animationDuration={2000}
                      animationEasing="ease-in-out"
                    />
                    <Line
                      type="monotone"
                      dataKey="optimal"
                      stroke="#7c3aed"
                      strokeWidth={3}
                      dot={false}
                      animationDuration={2000}
                      animationEasing="ease-in-out"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Property Satellite View */}
              {lat && lng && (
                <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Your Property
                    </h3>
                    <p className="text-gray-600">
                      Satellite view of your selected location
                    </p>
                    {address && (
                      <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {address}
                      </p>
                    )}
                  </div>
                  <div className="relative rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=800x400&maptype=satellite&markers=color:red%7C${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                      alt="Property satellite view"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}

              {/* Feed-in Tariff Info */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white mb-8">
                <div className="flex items-start gap-4">
                  <DollarSign className="w-8 h-8 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Feed-in Tariff Guarantee</h3>
                    <p className="text-green-100 mb-4">
                      Malta government guarantees €0.15 per kWh for 20 years
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                        <p className="text-sm text-green-100 mb-1">Rate per kWh</p>
                        <p className="text-2xl font-bold">€0.15</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                        <p className="text-sm text-green-100 mb-1">Guarantee Period</p>
                        <p className="text-2xl font-bold">20 Years</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <p className="text-lg text-gray-600 mb-6">
                  Get your detailed quote within 3 hours
                </p>
                <button className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Request Detailed Quote
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  100% Free • No obligation • Professional installation included
                </p>
              </div>
            </div>

            {/* Back to Home */}
            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      }
    >
      <AnalyzeContent />
    </Suspense>
  )
}
