export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_usage_logs: {
        Row: {
          analysis_type: string | null
          id: string
          image_url: string | null
          prompt: string | null
          response: string | null
          symbol: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          analysis_type?: string | null
          id?: string
          image_url?: string | null
          prompt?: string | null
          response?: string | null
          symbol?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_type?: string | null
          id?: string
          image_url?: string | null
          prompt?: string | null
          response?: string | null
          symbol?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      market_data_cache: {
        Row: {
          created_at: string | null
          data: Json
          data_type: string
          expires_at: string
          id: string
          symbol: string
          timeframe: string | null
        }
        Insert: {
          created_at?: string | null
          data: Json
          data_type: string
          expires_at: string
          id?: string
          symbol: string
          timeframe?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          data_type?: string
          expires_at?: string
          id?: string
          symbol?: string
          timeframe?: string | null
        }
        Relationships: []
      }
      nse_stocks: {
        Row: {
          company_name: string
          created_at: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          market_cap: number | null
          sector: string | null
          symbol: string
          updated_at: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          market_cap?: number | null
          sector?: string | null
          symbol: string
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          market_cap?: number | null
          sector?: string | null
          symbol?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stock_master: {
        Row: {
          active: boolean | null
          created_at: string | null
          exchange: string
          id: string
          industry: string | null
          isin: string | null
          last_updated: string | null
          market_cap: number | null
          name: string
          sector: string | null
          symbol: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          exchange: string
          id?: string
          industry?: string | null
          isin?: string | null
          last_updated?: string | null
          market_cap?: number | null
          name: string
          sector?: string | null
          symbol: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          exchange?: string
          id?: string
          industry?: string | null
          isin?: string | null
          last_updated?: string | null
          market_cap?: number | null
          name?: string
          sector?: string | null
          symbol?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          amount: number
          brokerage: number
          created_at: string
          exchange: string
          executed_at: string
          expiry_date: string | null
          id: string
          instrument_type: string
          net_amount: number
          option_type: string | null
          order_id: string
          pnl: number | null
          price: number
          quantity: number
          status: string
          strike_price: number | null
          symbol: string
          taxes: number
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          brokerage?: number
          created_at?: string
          exchange: string
          executed_at: string
          expiry_date?: string | null
          id?: string
          instrument_type: string
          net_amount: number
          option_type?: string | null
          order_id: string
          pnl?: number | null
          price: number
          quantity: number
          status?: string
          strike_price?: number | null
          symbol: string
          taxes?: number
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          brokerage?: number
          created_at?: string
          exchange?: string
          executed_at?: string
          expiry_date?: string | null
          id?: string
          instrument_type?: string
          net_amount?: number
          option_type?: string | null
          order_id?: string
          pnl?: number | null
          price?: number
          quantity?: number
          status?: string
          strike_price?: number | null
          symbol?: string
          taxes?: number
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_watchlists: {
        Row: {
          created_at: string | null
          id: string
          name: string
          symbols: string[]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string
          symbols?: string[]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          symbols?: string[]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      wishlist_stocks: {
        Row: {
          added_at: string | null
          id: string
          position: number | null
          stock_symbol: string
          wishlist_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          position?: number | null
          stock_symbol: string
          wishlist_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          position?: number | null
          stock_symbol?: string
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_stocks_stock_symbol_fkey"
            columns: ["stock_symbol"]
            isOneToOne: false
            referencedRelation: "stock_master"
            referencedColumns: ["symbol"]
          },
          {
            foreignKeyName: "wishlist_stocks_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
