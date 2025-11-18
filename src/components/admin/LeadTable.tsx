'use client'

import { useState } from 'react'
import { Clock, Mail, Phone, MapPin, ChevronRight } from 'lucide-react'

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

interface LeadTableProps {
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
  onStatusChange: (leadId: string, newStatus: string) => void
}

export default function LeadTable({ leads, onLeadClick, onStatusChange }: LeadTableProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700 border-blue-200',
      contacted: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      qualified: 'bg-purple-100 text-purple-700 border-purple-200',
      converted: 'bg-green-100 text-green-700 border-green-200',
      lost: 'bg-red-100 text-red-700 border-red-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60)) // minutes

    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    return `${Math.floor(diff / 1440)}d ago`
  }

  const isOverdue = (lead: Lead) => {
    if (lead.status !== 'new') return false
    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000
    return new Date(lead.created_at).getTime() < threeHoursAgo
  }

  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-500 text-lg">No leads found</p>
        <p className="text-gray-400 text-sm mt-2">Leads will appear here as they come in</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                  isOverdue(lead) ? 'bg-red-50' : ''
                }`}
                onClick={() => onLeadClick(lead)}
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{lead.name}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3" />
                      {lead.email}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" />
                      {lead.phone}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900 flex items-start gap-1">
                    <MapPin className="w-3 h-3 mt-1 flex-shrink-0" />
                    <span>{lead.address}</span>
                  </p>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={lead.status}
                    onChange={(e) => {
                      e.stopPropagation()
                      onStatusChange(lead.id, e.target.value)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      lead.status
                    )} cursor-pointer`}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                  {isOverdue(lead) && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Overdue
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm text-gray-900">{getTimeAgo(lead.created_at)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(lead.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <button
                    onClick={() => onLeadClick(lead)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
