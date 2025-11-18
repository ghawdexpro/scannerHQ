'use client'

import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Conversion rates, trends, and insights</p>
      </div>

      {/* Coming Soon Placeholder */}
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard Coming Soon</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Detailed conversion funnels, revenue projections, and performance metrics will be available here.
        </p>
      </div>

      {/* Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6">
          <Users className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversion Funnel</h3>
          <p className="text-sm text-gray-600">
            Track lead progression from inquiry to conversion
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6">
          <DollarSign className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue Analytics</h3>
          <p className="text-sm text-gray-600">
            Monitor pipeline value and closed deals over time
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6">
          <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Trends</h3>
          <p className="text-sm text-gray-600">
            Analyze response times, quote acceptance rates, and more
          </p>
        </div>
      </div>
    </div>
  )
}
