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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          cancelled_at: string | null
          chalet_id: string
          confirmed_at: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          expires_at: string
          id: string
          nights: number
          notes: string
          payment_reference: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
        }
        Insert: {
          booking_date: string
          booking_time: string
          cancelled_at?: string | null
          chalet_id: string
          confirmed_at?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          expires_at?: string
          id?: string
          nights?: number
          notes?: string
          payment_reference?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
        }
        Update: {
          booking_date?: string
          booking_time?: string
          cancelled_at?: string | null
          chalet_id?: string
          confirmed_at?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          expires_at?: string
          id?: string
          nights?: number
          notes?: string
          payment_reference?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_chalet_id_fkey"
            columns: ["chalet_id"]
            isOneToOne: false
            referencedRelation: "chalets"
            referencedColumns: ["id"]
          },
        ]
      }
      chalet_reviews: {
        Row: {
          chalet_id: string
          comment: string
          created_at: string
          guest_name: string
          id: string
          rating: number
          status: string
        }
        Insert: {
          chalet_id: string
          comment: string
          created_at?: string
          guest_name: string
          id?: string
          rating: number
          status?: string
        }
        Update: {
          chalet_id?: string
          comment?: string
          created_at?: string
          guest_name?: string
          id?: string
          rating?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chalet_reviews_chalet_id_fkey"
            columns: ["chalet_id"]
            isOneToOne: false
            referencedRelation: "chalets"
            referencedColumns: ["id"]
          },
        ]
      }
      chalets: {
        Row: {
          active: boolean
          capacity: number
          created_at: string
          description: string
          id: string
          image_url: string
          name: string
          price: number
          sort_order: number
          whatsapp: string
        }
        Insert: {
          active?: boolean
          capacity?: number
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          name: string
          price?: number
          sort_order?: number
          whatsapp?: string
        }
        Update: {
          active?: boolean
          capacity?: number
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          name?: string
          price?: number
          sort_order?: number
          whatsapp?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string
          email: string
          id: string
          name: string
          phone: string
          pix_key: string
          tagline: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          address?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          pix_key?: string
          tagline?: string
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          address?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          pix_key?: string
          tagline?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_admin: { Args: never; Returns: boolean }
      expire_pending_bookings: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      rented_chalet_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      app_role: "admin"
      booking_status: "pendente" | "confirmado" | "cancelado" | "finalizado"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
      booking_status: ["pendente", "confirmado", "cancelado", "finalizado"],
    },
  },
} as const
