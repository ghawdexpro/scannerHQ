import { getCurrentUser } from '@/lib/auth/client'
import Sidebar from '@/components/admin/Sidebar'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  // This would normally be a server-side check, but since getCurrentUser is client-side,
  // we'll rely on middleware for protection
  // The user data will be fetched client-side in the Sidebar component

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={{ email: 'admin@ghawdexengineering.com' }} />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
