'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sun, MapPin, Calculator, Clock, Shield, Zap } from 'lucide-react'
import InteractiveMapInput from '@/components/address-input/InteractiveMapInput'
import { MALTA_CONFIG, APP_CONFIG } from '@/config/constants'
import { useAuth } from '@/context/AuthContext'
import { trackAnalysisRequest } from '@/lib/analytics/tracking'
import { useScrollTracking } from '@/hooks/useScrollTracking'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Track scroll depth
  useScrollTracking()

  const handleAddressSelect = (address: string, coordinates: { lat: number; lng: number }) => {
    setIsAnalyzing(true)

    // Track analysis request
    trackAnalysisRequest(address)

    // Navigate to analyzing page with animated visualization
    window.location.href = `/analyzing?lat=${coordinates.lat}&lng=${coordinates.lng}&address=${encodeURIComponent(address)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      {/* Hero Section */}
      <section className="relative">
        <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
                Solar Power for Malta & Gozo
                <span className="text-red-500"> in 30 Seconds</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8">
                Get instant solar analysis, government grant calculations, and a professional quote within 3 hours.
                Powered by AI and Google Solar technology.
              </p>
            </motion.div>

            {/* Interactive Map Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold mb-2 text-white">
                  Start Your Solar Journey
                </h2>
                <p className="text-gray-300">
                  Use your location or click on the map to select your property
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  100% Free • No commitment • Results in seconds
                </p>
              </div>
              <InteractiveMapInput
                onAddressSelect={handleAddressSelect}
                isLoading={isAnalyzing}
              />
            </motion.div>

            {/* Key Benefits */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-left mt-8"
            >
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 sm:p-6 shadow-lg hover:shadow-red-500/20 hover:border-red-500/50 transition-all">
                <div className="flex items-start mb-2">
                  <Calculator className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-1" />
                  <span className="font-semibold text-sm sm:text-base text-white">Grant Calculator</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 ml-9">
                  Up to €{MALTA_CONFIG.MAX_GRANT_AMOUNT} government grant
                </p>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 sm:p-6 shadow-lg hover:shadow-amber-500/20 hover:border-amber-500/50 transition-all">
                <div className="flex items-start mb-2">
                  <Clock className="w-6 h-6 text-amber-500 mr-3 flex-shrink-0 mt-1" />
                  <span className="font-semibold text-sm sm:text-base text-white">3-Hour Quote</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 ml-9">
                  Professional quote guaranteed
                </p>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 sm:p-6 shadow-lg hover:shadow-yellow-500/20 hover:border-yellow-500/50 transition-all sm:col-span-2 lg:col-span-1">
                <div className="flex items-start mb-2">
                  <Zap className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-1" />
                  <span className="font-semibold text-sm sm:text-base text-white">Feed-in Tariff</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 ml-9">
                  {MALTA_CONFIG.TARIFF_GUARANTEE_YEARS} years guaranteed rates
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-black/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 text-white">
            Why Choose Ghawdex Engineering?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                <Sun className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">AI-Powered Analysis</h3>
              <p className="text-gray-400">
                Advanced AI technology analyzes your roof from satellite imagery,
                even in areas where Google Solar isn't available like Gozo.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <MapPin className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">100% Malta Coverage</h3>
              <p className="text-sm sm:text-base text-gray-400">
                Complete coverage of Malta and Gozo with specialized local knowledge
                and understanding of Malta's unique solar conditions.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-500/20 border border-orange-500/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-orange-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">20-Year Guarantee</h3>
              <p className="text-sm sm:text-base text-gray-400">
                Government-backed feed-in tariffs for 20 years with professional
                installation and comprehensive warranty coverage.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-red-600/90 via-orange-600/90 to-amber-600/90 rounded-2xl p-6 sm:p-8 md:p-12 text-white border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.3)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                  Compare Your Options
                </h2>
                <p className="text-sm sm:text-base mb-4 sm:mb-6">
                  See the difference between installing with and without the government grant
                </p>
                <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3 flex-shrink-0"></span>
                    <strong>With Grant:</strong> <span className="ml-2">{MALTA_CONFIG.GRANT_TARIFF}€/kWh for 20 years</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3 flex-shrink-0"></span>
                    <strong>Without Grant:</strong> <span className="ml-2">{MALTA_CONFIG.NO_GRANT_TARIFF}€/kWh for 20 years</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3 flex-shrink-0"></span>
                    Average ROI: 6-8 years
                  </li>
                </ul>
              </div>
              <div className="bg-black/30 border border-white/20 rounded-lg p-4 sm:p-6 backdrop-blur-sm">
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Average Maltese Home</h3>
                <div className="space-y-2 text-sm sm:text-base">
                  <div className="flex justify-between">
                    <span>System Size:</span>
                    <strong>5 kW</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual Generation:</span>
                    <strong>7,800 kWh</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>20-Year Savings:</span>
                    <strong>€15,000+</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>CO₂ Offset:</span>
                    <strong>3.2 tons/year</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-black/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-white">
            Ready to Go Solar?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8">
            Join hundreds of families in Malta & Gozo saving with solar energy
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:from-red-500 hover:to-red-600 transition-all active:scale-95 min-h-12 min-w-44 shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)] border border-red-500/50"
          >
            Get Your Free Analysis Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="mb-2 text-sm sm:text-base">© 2024 Ghawdex Engineering. All rights reserved.</p>
          <p className="text-xs sm:text-sm text-gray-400">
            Malta's premier AI-based solar and smart energy solutions provider
          </p>
        </div>
      </footer>
    </div>
  )
}