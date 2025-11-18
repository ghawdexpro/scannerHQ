'use client'

import { useEffect, useState } from 'react'
import DashboardMetrics from '@/components/admin/DashboardMetrics'
import { Clock, TrendingUp, Users } from 'lucide-react'

interface RecentLead {
  id: string
  name: string
  email: string
  status: string
  created_at: string
  address: string
}

export default function DashboardPage() {
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentLeads()
  }, [])

  const fetchRecentLeads = async () => {
    try {
      const response = await fetch('/api/admin/leads?limit=5&sort=desc')
      if (response.ok) {
        const data = await response.json()
        setRecentLeads(data.leads || [])
      }
    } catch (err) {
      console.error('Failed to fetch recent leads:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700',
      contacted: 'bg-yellow-100 text-yellow-700',
      qualified: 'bg-purple-100 text-purple-700',
      converted: 'bg-green-100 text-green-700',
      lost: 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60)) // minutes

    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    return `${Math.floor(diff / 1440)}d ago`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to the Ghawdex Engineering admin portal</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last updated</p>
          <p className="text-sm font-medium text-gray-900">
            {new Date().toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <DashboardMetrics />

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Recent Leads
            </h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentLeads.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No leads yet</p>
            ) : (
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{lead.name}</p>
                      <p className="text-sm text-gray-600">{lead.address}</p>
                      <p className="text-xs text-gray-500 mt-1">{lead.email}</p>
                    </div>
                    <div className="text-right ml-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          lead.status
                        )}`}
                      >
                        {lead.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(lead.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 text-center">
              <a
                href="/admin/leads"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View all leads →
              </a>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Quick Actions
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <a
              href="/admin/leads?status=new"
              className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <p className="font-medium text-blue-900">Review New Leads</p>
              <p className="text-sm text-blue-700">Respond to recent inquiries</p>
            </a>
            <a
              href="/admin/leads?overdue=true"
              className="block p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <p className="font-medium text-red-900">Overdue Leads</p>
              <p className="text-sm text-red-700">Leads pending &gt;3 hours</p>
            </a>
            <a
              href="/admin/quotes?status=sent"
              className="block p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <p className="font-medium text-green-900">Follow Up Quotes</p>
              <p className="text-sm text-green-700">Check quote responses</p>
            </a>
            <a
              href="/admin/analytics"
              className="block p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <p className="font-medium text-purple-900">View Analytics</p>
              <p className="text-sm text-purple-700">Conversion rates & trends</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
