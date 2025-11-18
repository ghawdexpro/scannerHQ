'use client'

import { useEffect, useState } from 'react'
import { Users, FileText, Clock, TrendingUp, AlertCircle } from 'lucide-react'

interface MetricsData {
  leads: {
    total: number
    new: number
    contacted: number
    qualified: number
    converted: number
    lost: number
  }
  quotes: {
    total: number
    sent: number
    viewed: number
    accepted: number
    rejected: number
  }
  overdue: number
  revenue: {
    potential: number
    closed: number
  }
}

export default function DashboardMetrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/metrics')
      if (!response.ok) throw new Error('Failed to fetch metrics')

      const data = await response.json()
      setMetrics(data)
    } catch (err: any) {
      console.error('Failed to fetch metrics:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
        <p>Failed to load metrics: {error || 'Unknown error'}</p>
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Leads',
      value: metrics.leads.total,
      subtitle: `${metrics.leads.new} new`,
      icon: Users,
      color: 'blue',
      trend: metrics.leads.new > 0 ? '+' + metrics.leads.new : '0'
    },
    {
      title: 'Active Quotes',
      value: metrics.quotes.total - metrics.quotes.accepted - metrics.quotes.rejected,
      subtitle: `${metrics.quotes.sent} sent`,
      icon: FileText,
      color: 'green',
      trend: `${Math.round((metrics.quotes.accepted / (metrics.quotes.total || 1)) * 100)}% accepted`
    },
    {
      title: 'Overdue Leads',
      value: metrics.overdue,
      subtitle: '>3 hours old',
      icon: AlertCircle,
      color: metrics.overdue > 0 ? 'red' : 'gray',
      trend: metrics.overdue > 0 ? 'Action required!' : 'All caught up'
    },
    {
      title: 'Potential Revenue',
      value: `€${Math.round(metrics.revenue.potential / 1000)}k`,
      subtitle: `€${Math.round(metrics.revenue.closed / 1000)}k closed`,
      icon: TrendingUp,
      color: 'purple',
      trend: `${Math.round((metrics.revenue.closed / (metrics.revenue.potential || 1)) * 100)}% conversion`
    }
  ]

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
    purple: 'bg-purple-100 text-purple-600'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon
        const colorClass = colorClasses[card.color as keyof typeof colorClasses]

        return (
          <div
            key={card.title}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${colorClass}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-2">{card.subtitle}</p>
            <p className="text-xs font-medium text-gray-400">{card.trend}</p>
          </div>
        )
      })}
    </div>
  )
}
