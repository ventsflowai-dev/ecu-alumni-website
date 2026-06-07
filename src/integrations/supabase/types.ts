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
      announcements: {
        Row: {
          created_at: string
          id: string
          message: string
          status: Database["public"]["Enums"]["post_status"]
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          status?: Database["public"]["Enums"]["post_status"]
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          status: Database["public"]["Enums"]["message_status"]
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string | null
        }
        Relationships: []
      }
      donation_campaigns: {
        Row: {
          amount_raised: number
          created_at: string
          description: string | null
          featured_image_url: string | null
          id: string
          slug: string
          status: Database["public"]["Enums"]["campaign_status"]
          suggested_amounts: number[] | null
          target_amount: number | null
          title: string
          updated_at: string
        }
        Insert: {
          amount_raised?: number
          created_at?: string
          description?: string | null
          featured_image_url?: string | null
          id?: string
          slug: string
          status?: Database["public"]["Enums"]["campaign_status"]
          suggested_amounts?: number[] | null
          target_amount?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          amount_raised?: number
          created_at?: string
          description?: string | null
          featured_image_url?: string | null
          id?: string
          slug?: string
          status?: Database["public"]["Enums"]["campaign_status"]
          suggested_amounts?: number[] | null
          target_amount?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          campaign_id: string | null
          created_at: string
          currency: string
          donor_email: string
          donor_message: string | null
          donor_name: string
          donor_phone: string | null
          flutterwave_transaction_id: string | null
          id: string
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          receipt_number: string | null
          receipt_pdf_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          created_at?: string
          currency?: string
          donor_email: string
          donor_message?: string | null
          donor_name: string
          donor_phone?: string | null
          flutterwave_transaction_id?: string | null
          id?: string
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          receipt_number?: string | null
          receipt_pdf_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          created_at?: string
          currency?: string
          donor_email?: string
          donor_message?: string | null
          donor_name?: string
          donor_phone?: string | null
          flutterwave_transaction_id?: string | null
          id?: string
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          receipt_number?: string | null
          receipt_pdf_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "donation_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          event_date: string | null
          event_status: Database["public"]["Enums"]["event_timing"]
          event_time: string | null
          featured_image_url: string | null
          full_description: string | null
          id: string
          location: string | null
          registration_link: string | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_date?: string | null
          event_status?: Database["public"]["Enums"]["event_timing"]
          event_time?: string | null
          featured_image_url?: string | null
          full_description?: string | null
          id?: string
          location?: string | null
          registration_link?: string | null
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_date?: string | null
          event_status?: Database["public"]["Enums"]["event_timing"]
          event_time?: string | null
          featured_image_url?: string | null
          full_description?: string | null
          id?: string
          location?: string | null
          registration_link?: string | null
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_events: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          event_date: string | null
          id: string
          location: string | null
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          location?: string | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          location?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          caption: string | null
          created_at: string
          gallery_event_id: string
          id: string
          image_url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          gallery_event_id: string
          id?: string
          image_url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          gallery_event_id?: string
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_gallery_event_id_fkey"
            columns: ["gallery_event_id"]
            isOneToOne: false
            referencedRelation: "gallery_events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          current_city: string | null
          current_country: string | null
          department: string | null
          directory_consent: boolean
          email: string
          faculty: string | null
          full_name: string
          graduation_year: number | null
          id: string
          phone: string | null
          profession: string | null
          profile_photo_url: string | null
          show_email_publicly: boolean
          show_phone_publicly: boolean
          social_links: Json | null
          status: Database["public"]["Enums"]["profile_status"]
          subgroups: string | null
          updated_at: string
          user_id: string
          workplace: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          current_city?: string | null
          current_country?: string | null
          department?: string | null
          directory_consent?: boolean
          email?: string
          faculty?: string | null
          full_name?: string
          graduation_year?: number | null
          id?: string
          phone?: string | null
          profession?: string | null
          profile_photo_url?: string | null
          show_email_publicly?: boolean
          show_phone_publicly?: boolean
          social_links?: Json | null
          status?: Database["public"]["Enums"]["profile_status"]
          subgroups?: string | null
          updated_at?: string
          user_id: string
          workplace?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          current_city?: string | null
          current_country?: string | null
          department?: string | null
          directory_consent?: boolean
          email?: string
          faculty?: string | null
          full_name?: string
          graduation_year?: number | null
          id?: string
          phone?: string | null
          profession?: string | null
          profile_photo_url?: string | null
          show_email_publicly?: boolean
          show_phone_publicly?: boolean
          social_links?: Json | null
          status?: Database["public"]["Enums"]["profile_status"]
          subgroups?: string | null
          updated_at?: string
          user_id?: string
          workplace?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_profile_status: {
        Args: {
          _status: Database["public"]["Enums"]["profile_status"]
          _user_id: string
        }
        Returns: undefined
      }
      set_user_admin: {
        Args: { _make_admin: boolean; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "member"
      campaign_status: "active" | "inactive"
      event_timing: "upcoming" | "past"
      message_status: "unread" | "read"
      payment_status: "pending" | "successful" | "failed"
      post_status: "draft" | "published"
      profile_status: "pending" | "approved" | "suspended"
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
  public: {
    Enums: {
      app_role: ["admin", "member"],
      campaign_status: ["active", "inactive"],
      event_timing: ["upcoming", "past"],
      message_status: ["unread", "read"],
      payment_status: ["pending", "successful", "failed"],
      post_status: ["draft", "published"],
      profile_status: ["pending", "approved", "suspended"],
    },
  },
} as const
