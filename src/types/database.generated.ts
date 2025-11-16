export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          address: string
          analysis_type: string
          confidence_score: number | null
          created_at: string
          customer_id: string | null
          id: string
          location_lat: number
          location_lng: number
          panel_count: number | null
          processed_image_url: string | null
          raw_data: Json | null
          roof_area: number | null
          roof_image_url: string | null
          system_size: number | null
          usable_area: number | null
          yearly_generation: number | null
        }
        Insert: {
          address: string
          analysis_type: string
          confidence_score?: number | null
          created_at?: string
          customer_id?: string | null
          id?: string
          location_lat: number
          location_lng: number
          panel_count?: number | null
          processed_image_url?: string | null
          raw_data?: Json | null
          roof_area?: number | null
          roof_image_url?: string | null
          system_size?: number | null
          usable_area?: number | null
          yearly_generation?: number | null
        }
        Update: {
          address?: string
          analysis_type?: string
          confidence_score?: number | null
          created_at?: string
          customer_id?: string | null
          id?: string
          location_lat?: number
          location_lng?: number
          panel_count?: number | null
          processed_image_url?: string | null
          raw_data?: Json | null
          roof_area?: number | null
          roof_image_url?: string | null
          system_size?: number | null
          usable_area?: number | null
          yearly_generation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analyses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string
          id: string
          location_lat: number | null
          location_lng: number | null
          name: string
          notes: string | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          name: string
          notes?: string | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string | null
          assigned_to: string | null
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string
          source: string | null
          status: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          source?: string | null
          status?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          source?: string | null
          status?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          analysis_id: string | null
          carbon_offset: number | null
          created_at: string
          customer_id: string | null
          expires_at: string | null
          feed_in_tariff: number
          grant_amount: number | null
          id: string
          installation_cost: number
          panel_count: number
          pdf_url: string | null
          roi_years: number | null
          sent_at: string | null
          status: string | null
          system_size: number
          twenty_year_savings: number | null
          upfront_cost: number
          viewed_at: string | null
          with_grant: boolean | null
          yearly_generation: number
          yearly_revenue: number
        }
        Insert: {
          analysis_id?: string | null
          carbon_offset?: number | null
          created_at?: string
          customer_id?: string | null
          expires_at?: string | null
          feed_in_tariff: number
          grant_amount?: number | null
          id?: string
          installation_cost: number
          panel_count: number
          pdf_url?: string | null
          roi_years?: number | null
          sent_at?: string | null
          status?: string | null
          system_size: number
          twenty_year_savings?: number | null
          upfront_cost: number
          viewed_at?: string | null
          with_grant?: boolean | null
          yearly_generation: number
          yearly_revenue: number
        }
        Update: {
          analysis_id?: string | null
          carbon_offset?: number | null
          created_at?: string
          customer_id?: string | null
          expires_at?: string | null
          feed_in_tariff?: number
          grant_amount?: number | null
          id?: string
          installation_cost?: number
          panel_count?: number
          pdf_url?: string | null
          roi_years?: number | null
          sent_at?: string | null
          status?: string | null
          system_size?: number
          twenty_year_savings?: number | null
          upfront_cost?: number
          viewed_at?: string | null
          with_grant?: boolean | null
          yearly_generation?: number
          yearly_revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      yearly_projections: {
        Row: {
          cumulative_savings: number
          degradation_factor: number
          generation: number
          id: string
          quote_id: string | null
          revenue: number
          year: number
        }
        Insert: {
          cumulative_savings: number
          degradation_factor: number
          generation: number
          id?: string
          quote_id?: string | null
          revenue: number
          year: number
        }
        Update: {
          cumulative_savings?: number
          degradation_factor?: number
          generation?: number
          id?: string
          quote_id?: string | null
          revenue?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "yearly_projections_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
