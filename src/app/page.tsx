'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sun, MapPin, Calculator, Clock, Shield, Zap } from 'lucide-react'
import InteractiveMapInput from '@/components/address-input/InteractiveMapInput'
import { MALTA_CONFIG, APP_CONFIG } from '@/config/constants'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAddressSelect = (address: string, coordinates: { lat: number; lng: number }) => {
    setIsAnalyzing(true)

    // Check if user is authenticated
    if (!isAuthenticated && !authLoading) {
      console.log('[HOME] User not authenticated, redirecting to login')
      // Store the analysis params in localStorage for after login
      localStorage.setItem('pendingAnalysis', JSON.stringify({
        lat: coordinates.lat,
        lng: coordinates.lng,
        address
      }))
      router.push('/auth/login')
      return
    }

    // Navigate to analyze page
    window.location.href = `/analyze?lat=${coordinates.lat}&lng=${coordinates.lng}&address=${encodeURIComponent(address)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Solar Power for Malta & Gozo
                <span className="text-blue-600"> in 30 Seconds</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
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
                <h2 className="text-2xl font-semibold mb-2 text-gray-800">
                  Start Your Solar Journey
                </h2>
                <p className="text-gray-600">
                  Use your location or click on the map to select your property
                </p>
                <p className="text-sm text-gray-500 mt-2">
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
              className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left"
            >
              <div className="bg-white rounded-lg p-4 shadow-md">
                <div className="flex items-center mb-2">
                  <Calculator className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-semibold">Grant Calculator</span>
                </div>
                <p className="text-sm text-gray-600">
                  Up to €{MALTA_CONFIG.MAX_GRANT_AMOUNT} government grant
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md">
                <div className="flex items-center mb-2">
                  <Clock className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-semibold">3-Hour Quote</span>
                </div>
                <p className="text-sm text-gray-600">
                  Professional quote guaranteed
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md">
                <div className="flex items-center mb-2">
                  <Zap className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="font-semibold">Feed-in Tariff</span>
                </div>
                <p className="text-sm text-gray-600">
                  {MALTA_CONFIG.TARIFF_GUARANTEE_YEARS} years guaranteed rates
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Ghawdex Engineering?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sun className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-600">
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
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% Malta Coverage</h3>
              <p className="text-gray-600">
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
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">20-Year Guarantee</h3>
              <p className="text-gray-600">
                Government-backed feed-in tariffs for 20 years with professional
                installation and comprehensive warranty coverage.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">
                  Compare Your Options
                </h2>
                <p className="mb-6">
                  See the difference between installing with and without the government grant
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
                    <strong>With Grant:</strong> {MALTA_CONFIG.GRANT_TARIFF}€/kWh for 20 years
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
                    <strong>Without Grant:</strong> {MALTA_CONFIG.NO_GRANT_TARIFF}€/kWh for 20 years
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
                    Average ROI: 6-8 years
                  </li>
                </ul>
              </div>
              <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4">Average Maltese Home</h3>
                <div className="space-y-2">
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
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Go Solar?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of families in Malta & Gozo saving with solar energy
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Get Your Free Analysis Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">© 2024 Ghawdex Engineering. All rights reserved.</p>
          <p className="text-gray-400">
            Malta's premier AI-based solar and smart energy solutions provider
          </p>
        </div>
      </footer>
    </div>
  )
}