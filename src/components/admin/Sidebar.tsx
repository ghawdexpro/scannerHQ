'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  LogOut,
  Sun
} from 'lucide-react'
import { signOut } from '@/lib/auth/client'
import { useState } from 'react'

interface SidebarProps {
  user: {
    email?: string
    name?: string
  }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Leads',
      href: '/admin/leads',
      icon: Users
    },
    {
      name: 'Quotes',
      href: '/admin/quotes',
      icon: FileText
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3
    }
  ]

  const handleSignOut = async () => {
    try {
      setLoading(true)
      await signOut()
      router.push('/admin/login')
    } catch (error) {
      console.error('Signout error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Sun className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Ghawdex</h1>
            <p className="text-xs text-gray-400">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <a
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </a>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-800">
        <div className="mb-3 px-4 py-2 bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-400">Signed in as</p>
          <p className="text-sm font-medium truncate">{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{loading ? 'Signing out...' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  )
}
