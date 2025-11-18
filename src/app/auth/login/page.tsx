'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Phone, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { signUpWithPhone } from '@/lib/auth/client'
import { sanitizePhone, isValidMaltaPhone } from '@/lib/utils/validation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizePhone(e.target.value)
    setPhone(value)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate phone
      if (!phone || phone.length < 8) {
        setError('Please enter a valid phone number')
        setLoading(false)
        return
      }

      if (!isValidMaltaPhone(phone)) {
        setError('Please enter a valid Malta phone number (+356 or 8 digits)')
        setLoading(false)
        return
      }

      // Format phone with +356 if not already
      const formattedPhone = phone.startsWith('+356') ? phone : `+356${phone}`

      console.log('[LOGIN] Attempting phone signup with:', formattedPhone)

      const result = await signUpWithPhone(formattedPhone)

      if (result.success) {
        console.log('[LOGIN] OTP sent successfully')
        setSuccess(true)

        // Redirect to OTP verification page
        setTimeout(() => {
          router.push(`/auth/verify?phone=${encodeURIComponent(formattedPhone)}`)
        }, 1500)
      }
    } catch (err: any) {
      console.error('[LOGIN] Error:', err)
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Welcome to Solar Scan
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Enter your phone number to analyze your property
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-xs sm:text-sm">{error}</p>
            </motion.div>
          )}

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 text-xs sm:text-sm">
                OTP sent! Redirecting to verification...
              </p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="phone" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm sm:text-base">
                  +356
                </span>
                <input
                  id="phone"
                  type="tel"
                  placeholder="9999 9999"
                  value={phone}
                  onChange={handlePhoneChange}
                  disabled={loading || success}
                  inputMode="numeric"
                  pattern="[0-9 ]*"
                  maxLength="12"
                  autocomplete="tel"
                  className="w-full pl-14 sm:pl-16 pr-4 py-3 sm:py-4 border-2 border-gray-300 rounded-lg font-mono text-base sm:text-lg focus:border-blue-500 focus:outline-none transition-colors disabled:bg-gray-100 min-h-12"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Enter your 8-digit Malta phone number
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || success || !phone}
              className="w-full bg-blue-600 text-white py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-12"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="hidden sm:inline">Sending OTP...</span>
                  <span className="sm:hidden">Sending...</span>
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5" />
                  <span className="hidden sm:inline">Send OTP Code</span>
                  <span className="sm:hidden">Send Code</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm">
              We'll send you a code via SMS to verify your number.{' '}
              <br />
              Standard rates may apply.
            </p>
          </div>

          {/* Help Links */}
          <div className="mt-6 flex gap-4 text-sm justify-center">
            <Link href="/" className="text-blue-600 hover:underline">
              Back to Home
            </Link>
          </div>
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800"
        >
          <p className="font-semibold mb-2">Why do we need your phone?</p>
          <ul className="space-y-1 text-xs">
            <li>✓ Verify you're a real person</li>
            <li>✓ Send your quote via SMS</li>
            <li>✓ Contact you within 3 hours with details</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  )
}
