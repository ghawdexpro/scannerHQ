'use client'

import { useEffect, useState } from 'react'
import { FileText, Download, RefreshCw, Eye, Check, X } from 'lucide-react'

interface Quote {
  id: string
  system_size: number
  upfront_cost: number
  with_grant: boolean
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected'
  created_at: string
  expires_at: string
  analyses?: {
    address: string
    system_size: number
    panel_count: number
    analysis_type: string
  }
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchQuotes()
  }, [filter])

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      let url = '/api/admin/quotes?limit=100'
      if (filter !== 'all') {
        url += `&status=${filter}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch quotes')

      const data = await response.json()
      setQuotes(data.quotes || [])
    } catch (err) {
      console.error('Failed to fetch quotes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (quoteId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update quote')
      await fetchQuotes()
    } catch (err) {
      console.error('Failed to update quote:', err)
      alert('Failed to update quote status')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      viewed: 'bg-purple-100 text-purple-700',
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const stats = {
    total: quotes.length,
    sent: quotes.filter((q) => q.status === 'sent').length,
    viewed: quotes.filter((q) => q.status === 'viewed').length,
    accepted: quotes.filter((q) => q.status === 'accepted').length,
    rejected: quotes.filter((q) => q.status === 'rejected').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
          <p className="text-gray-600 mt-1">Manage and track all generated quotes</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchQuotes}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Sent', value: stats.sent },
          { label: 'Viewed', value: stats.viewed },
          { label: 'Accepted', value: stats.accepted },
          { label: 'Rejected', value: stats.rejected }
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Quotes</option>
          <option value="sent">Sent</option>
          <option value="viewed">Viewed</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <p className="text-gray-500 mt-4">Loading quotes...</p>
        </div>
      ) : quotes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No quotes found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  System
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {quote.analyses?.address || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {quote.with_grant ? 'With Grant' : 'Without Grant'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{quote.system_size.toFixed(1)} kW</p>
                    <p className="text-xs text-gray-500">
                      {quote.analyses?.panel_count || 0} panels
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      €{quote.upfront_cost.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={quote.status}
                      onChange={(e) => handleStatusUpdate(quote.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        quote.status
                      )}`}
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="viewed">Viewed</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(quote.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
