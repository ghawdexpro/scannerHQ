'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { verifyOtp } from '@/lib/auth/client'
import Link from 'next/link'

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone')

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  if (!phone) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Request</h1>
          <p className="text-gray-600 mb-6">Please go back and enter your phone number.</p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(value)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (code.length !== 6) {
        setError('Please enter a 6-digit code')
        setLoading(false)
        return
      }

      console.log('[VERIFY] Verifying OTP with phone:', phone)

      const result = await verifyOtp(phone, code)

      if (result.success) {
        console.log('[VERIFY] OTP verified successfully')
        setSuccess(true)

        // Redirect to home page
        setTimeout(() => {
          router.push('/')
        }, 1500)
      }
    } catch (err: any) {
      console.error('[VERIFY] Error:', err)
      setError(err.message || 'Invalid code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Code</h1>
            <p className="text-gray-600">
              We sent a 6-digit code to
              <br />
              <span className="font-semibold">{phone}</span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 text-sm">
                Verified! Redirecting to analysis...
              </p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
                Enter 6-Digit Code
              </label>
              <input
                id="code"
                type="text"
                placeholder="000000"
                value={code}
                onChange={handleCodeChange}
                disabled={loading || success || timeLeft === 0}
                maxLength={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-mono text-3xl tracking-widest text-center focus:border-blue-500 focus:outline-none transition-colors disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-600 mt-2">
                Check your SMS messages for the code
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || success || code.length !== 6 || timeLeft === 0}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Verify Code
                </>
              )}
            </button>
          </form>

          {/* Timer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className={`text-center text-sm ${
              timeLeft < 60 ? 'text-red-600 font-semibold' : 'text-gray-600'
            }`}>
              {timeLeft > 0 ? (
                <>
                  Code expires in <span className="font-mono">{formatTime(timeLeft)}</span>
                </>
              ) : (
                <>
                  <p className="text-red-600 font-semibold mb-2">Code expired</p>
                  <Link
                    href="/auth/login"
                    className="text-blue-600 hover:underline"
                  >
                    Request a new code
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Help Links */}
          <div className="mt-6 flex gap-4 text-sm justify-center">
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              ← Change Phone Number
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
          <p className="font-semibold mb-2">Didn't get the code?</p>
          <ul className="space-y-1 text-xs">
            <li>✓ Check your spam/junk folder</li>
            <li>✓ Make sure your number is correct</li>
            <li>✓ Wait a moment and try again</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  )
}
