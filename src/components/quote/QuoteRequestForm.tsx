'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Loader2, CheckCircle, Home, Euro, Calendar, FileText } from 'lucide-react'

interface QuoteRequestFormProps {
  analysisId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function QuoteRequestForm({ analysisId, onSuccess, onCancel }: QuoteRequestFormProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    roofType: '',
    propertyType: 'residential',
    budget: '',
    timeline: '',
    electricityBill: '',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysisId,
          ...formData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate quote')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-lg p-8 text-center"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quote Request Sent!</h2>
        <p className="text-gray-600 mb-4">
          We'll email you a detailed quote within 3 hours.
        </p>
        <p className="text-sm text-gray-500">
          Check your email for a comprehensive PDF with both grant scenarios.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-8"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Detailed Quote</h2>
        <p className="text-gray-600">
          Help us prepare an accurate quote by providing a few more details about your property.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Roof Type */}
        <div>
          <label htmlFor="roofType" className="block text-sm font-semibold text-gray-700 mb-2">
            <Home className="w-4 h-4 inline mr-2" />
            Roof Type *
          </label>
          <select
            id="roofType"
            name="roofType"
            value={formData.roofType}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="">Select roof type</option>
            <option value="flat">Flat Roof</option>
            <option value="pitched">Pitched/Sloped Roof</option>
            <option value="mixed">Mixed (Flat + Pitched)</option>
          </select>
        </div>

        {/* Property Type */}
        <div>
          <label htmlFor="propertyType" className="block text-sm font-semibold text-gray-700 mb-2">
            Property Type *
          </label>
          <select
            id="propertyType"
            name="propertyType"
            value={formData.propertyType}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
          </select>
        </div>

        {/* Budget Range */}
        <div>
          <label htmlFor="budget" className="block text-sm font-semibold text-gray-700 mb-2">
            <Euro className="w-4 h-4 inline mr-2" />
            Budget Range
          </label>
          <select
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="">Select budget range</option>
            <option value="under-5000">Under €5,000</option>
            <option value="5000-10000">€5,000 - €10,000</option>
            <option value="10000-15000">€10,000 - €15,000</option>
            <option value="15000-20000">€15,000 - €20,000</option>
            <option value="over-20000">Over €20,000</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>

        {/* Installation Timeline */}
        <div>
          <label htmlFor="timeline" className="block text-sm font-semibold text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            When would you like to install?
          </label>
          <select
            id="timeline"
            name="timeline"
            value={formData.timeline}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="">Select timeline</option>
            <option value="asap">As soon as possible</option>
            <option value="1-3-months">Within 1-3 months</option>
            <option value="3-6-months">Within 3-6 months</option>
            <option value="6-12-months">Within 6-12 months</option>
            <option value="exploring">Just exploring options</option>
          </select>
        </div>

        {/* Monthly Electricity Bill */}
        <div>
          <label htmlFor="electricityBill" className="block text-sm font-semibold text-gray-700 mb-2">
            Average Monthly Electricity Bill
          </label>
          <select
            id="electricityBill"
            name="electricityBill"
            value={formData.electricityBill}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="">Select range</option>
            <option value="under-50">Under €50</option>
            <option value="50-100">€50 - €100</option>
            <option value="100-150">€100 - €150</option>
            <option value="150-200">€150 - €200</option>
            <option value="over-200">Over €200</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            This helps us optimize system size for your actual consumption
          </p>
        </div>

        {/* Additional Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-2" />
            Additional Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            placeholder="Any specific requirements, concerns, or questions?"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !formData.roofType}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Quote...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Get Free Quote
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-center text-gray-500">
          No payment required. You'll receive a detailed PDF quote via email within 3 hours.
        </p>
      </form>
    </motion.div>
  )
}
