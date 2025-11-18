'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabaseAuth, onAuthStateChange } from '@/lib/auth/client'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      try {
        const {
          data: { session }
        } = await supabaseAuth.auth.getSession()
        setUser(session?.user || null)
      } catch (error) {
        console.error('[AUTH] Error checking session:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Subscribe to auth changes
    const subscription = onAuthStateChange((authUser) => {
      setUser(authUser)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
