'use client'

import { useEffect, useState } from 'react'
import LeadTable from '@/components/admin/LeadTable'
import { Search, Filter, Download, RefreshCw } from 'lucide-react'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  address: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  created_at: string
  notes?: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  useEffect(() => {
    fetchLeads()
  }, [filter])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      let url = '/api/admin/leads?limit=100'
      if (filter !== 'all') {
        if (filter === 'overdue') {
          url += '&overdue=true'
        } else {
          url += `&status=${filter}`
        }
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch leads')

      const data = await response.json()
      setLeads(data.leads || [])
    } catch (err) {
      console.error('Failed to fetch leads:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update lead')

      // Refresh leads
      await fetchLeads()
    } catch (err) {
      console.error('Failed to update lead:', err)
      alert('Failed to update lead status')
    }
  }

  const filteredLeads = leads.filter((lead) =>
    searchTerm
      ? lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.address.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  )

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    qualified: leads.filter((l) => l.status === 'qualified').length,
    converted: leads.filter((l) => l.status === 'converted').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">Manage and track all customer leads</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchLeads}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'gray' },
          { label: 'New', value: stats.new, color: 'blue' },
          { label: 'Contacted', value: stats.contacted, color: 'yellow' },
          { label: 'Qualified', value: stats.qualified, color: 'purple' },
          { label: 'Converted', value: stats.converted, color: 'green' }
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads by name, email, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Leads</option>
              <option value="new">New Only</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
              <option value="overdue">Overdue (&gt;3 hours)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <p className="text-gray-500 mt-4">Loading leads...</p>
        </div>
      ) : (
        <LeadTable
          leads={filteredLeads}
          onLeadClick={(lead) => setSelectedLead(lead)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
