import { createClient } from '@supabase/supabase-js'

// Create Supabase client for auth
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey)

// Email auth functions
export async function signUpWithEmail(email: string) {
  try {
    const { data, error } = await supabaseAuth.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/verify`
      }
    })

    if (error) {
      console.error('[AUTH] Email signup error:', error)
      throw error
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('[AUTH] Unexpected error in signup:', error)
    throw error
  }
}

export async function verifyOtp(email: string, token: string) {
  try {
    const { data, error } = await supabaseAuth.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })

    if (error) {
      console.error('[AUTH] OTP verification error:', error)
      throw error
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('[AUTH] Unexpected error in verification:', error)
    throw error
  }
}

export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error
    } = await supabaseAuth.auth.getUser()

    if (error) {
      console.error('[AUTH] Get user error:', error)
      return null
    }

    return user
  } catch (error: any) {
    console.error('[AUTH] Unexpected error getting user:', error)
    return null
  }
}

export async function getSession() {
  try {
    const {
      data: { session },
      error
    } = await supabaseAuth.auth.getSession()

    if (error) {
      console.error('[AUTH] Get session error:', error)
      return null
    }

    return session
  } catch (error: any) {
    console.error('[AUTH] Unexpected error getting session:', error)
    return null
  }
}

export async function signOut() {
  try {
    const { error } = await supabaseAuth.auth.signOut()

    if (error) {
      console.error('[AUTH] Sign out error:', error)
      throw error
    }

    return { success: true }
  } catch (error: any) {
    console.error('[AUTH] Unexpected error in sign out:', error)
    throw error
  }
}

// Phone auth functions
export async function signUpWithPhone(phone: string) {
  try {
    const { data, error } = await supabaseAuth.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: true
      }
    })

    if (error) {
      console.error('[AUTH] Phone signup error:', error)
      throw error
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('[AUTH] Unexpected error in phone signup:', error)
    throw error
  }
}

export async function verifyPhoneOtp(phone: string, token: string) {
  try {
    const { data, error } = await supabaseAuth.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    })

    if (error) {
      console.error('[AUTH] Phone OTP verification error:', error)
      throw error
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('[AUTH] Unexpected error in phone verification:', error)
    throw error
  }
}

// Admin auth functions (email/password)
export async function signInWithPassword(email: string, password: string) {
  try {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('[AUTH] Admin signin error:', error)
      throw error
    }

    // Check if user has admin role
    if (!data.user?.user_metadata?.role || data.user.user_metadata.role !== 'admin') {
      await supabaseAuth.auth.signOut()
      throw new Error('Unauthorized: Admin access required')
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('[AUTH] Unexpected error in admin signin:', error)
    throw error
  }
}

export async function createAdminUser(email: string, password: string) {
  try {
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'admin'
        }
      }
    })

    if (error) {
      console.error('[AUTH] Admin user creation error:', error)
      throw error
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('[AUTH] Unexpected error creating admin user:', error)
    throw error
  }
}

// Subscribe to auth changes
export function onAuthStateChange(callback: (user: any) => void) {
  const {
    data: { subscription }
  } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null)
  })

  return subscription
}
