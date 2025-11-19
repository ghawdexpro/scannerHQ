'use client'

// TODO: REPLACE THIS EMAIL OTP LOGIN WITH GOOGLE AND APPLE OAUTH
// Current implementation uses email magic links which has poor UX
// Replace with OAuth buttons for Google Sign-In and Apple Sign-In
// See: https://supabase.com/docs/guides/auth/social-login
// Note: Authentication is currently DISABLED in middleware for development

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { signUpWithEmail } from '@/lib/auth/client'
import { sanitizeEmail, isValidEmail } from '@/lib/utils/validation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeEmail(e.target.value)
    setEmail(value)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate email
      if (!email || !isValidEmail(email)) {
        setError('Please enter a valid email address')
        setLoading(false)
        return
      }

      console.log('[LOGIN] Attempting email signup with:', email)

      const result = await signUpWithEmail(email)

      if (result.success) {
        console.log('[LOGIN] OTP email sent successfully')
        setSuccess(true)

        // Redirect to OTP verification page
        setTimeout(() => {
          router.push(`/auth/verify?email=${encodeURIComponent(email)}`)
        }, 1500)
      }
    } catch (err: any) {
      console.error('[LOGIN] Error:', err)
      setError(err.message || 'Failed to send verification email. Please try again.')
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
              <Mail className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Welcome to Solar Scan
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Enter your email to analyze your property
            </p>
          </div>

          {/* Dev Notice - Authentication Temporarily Disabled */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3"
          >
            <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-yellow-800">
              <p className="font-semibold mb-1">Development Mode</p>
              <p>Authentication is temporarily disabled. All pages are accessible without login. Google & Apple OAuth coming soon.</p>
            </div>
          </motion.div>

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
                Verification link sent! Redirecting...
              </p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={loading || success}
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-300 rounded-lg text-base sm:text-lg focus:border-blue-500 focus:outline-none transition-colors disabled:bg-gray-100 min-h-12"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                We'll send a verification link to your email
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || success || !email}
              className="w-full bg-blue-600 text-white py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-12"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="hidden sm:inline">Sending email...</span>
                  <span className="sm:hidden">Sending...</span>
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  <span className="hidden sm:inline">Send Verification Link</span>
                  <span className="sm:hidden">Send Link</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm">
              We'll send you a secure verification link to confirm your email address.
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
          <p className="font-semibold mb-2">Why do we need your email?</p>
          <ul className="space-y-1 text-xs">
            <li>✓ Verify you're a real person</li>
            <li>✓ Send your analysis and quote</li>
            <li>✓ Contact you with important updates</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  )
}
