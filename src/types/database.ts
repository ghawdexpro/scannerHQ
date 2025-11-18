// Database types will be generated from Supabase
// Run: npx supabase gen types typescript --project-id your-project-id > src/types/database.ts

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string
          phone: string
          address: string
          location_lat: number
          location_lng: number
          notes?: string
        }
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }
      analyses: {
        Row: {
          id: string
          created_at: string
          customer_id: string
          address: string
          location_lat: number
          location_lng: number
          roof_area: number
          usable_area: number
          panel_count: number
          system_size: number
          yearly_generation: number
          analysis_type: 'google_solar' | 'ai_fallback'
          confidence_score: number
          roof_image_url?: string
          processed_image_url?: string
          raw_data: Record<string, any>
        }
        Insert: Omit<Database['public']['Tables']['analyses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['analyses']['Insert']>
      }
      quotes: {
        Row: {
          id: string
          created_at: string
          analysis_id: string
          customer_id: string
          system_size: number
          panel_count: number
          installation_cost: number
          with_grant: boolean
          grant_amount: number
          upfront_cost: number
          feed_in_tariff: number
          yearly_generation: number
          yearly_revenue: number
          roi_years: number
          twenty_year_savings: number
          carbon_offset: number
          status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected'
          sent_at?: string
          viewed_at?: string
          expires_at: string
          pdf_url?: string
          metadata?: Record<string, any>
        }
        Insert: Omit<Database['public']['Tables']['quotes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['quotes']['Insert']>
      }
      leads: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string
          phone: string
          address?: string
          source: 'website' | 'referral' | 'advertisement' | 'other'
          status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
          notes?: string
          assigned_to?: string
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}