import { createBrowserClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Create a Supabase client for the browser
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Export a singleton client for convenience
export const supabase = createClient()