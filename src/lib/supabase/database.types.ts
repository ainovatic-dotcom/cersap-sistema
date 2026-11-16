// ARCHIVO GENERADO. No lo edites a mano.
// Cada vez que cambie la base (tablas, columnas, funciones) hay que regenerarlo:
//   npx supabase gen types typescript --project-id aynronszcpwepvkcyrbu > src/lib/supabase/database.types.ts

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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_allowlist: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          note: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          note?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_allowlist_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: number
          new_data: Json | null
          old_data: Json | null
          row_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          row_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          row_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      families: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      family_links: {
        Row: {
          auto_approved: boolean
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          family_id: string
          id: string
          requested_at: string
          status: Database["public"]["Enums"]["link_status"]
          student_id: string | null
          user_id: string
        }
        Insert: {
          auto_approved?: boolean
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          family_id: string
          id?: string
          requested_at?: string
          status?: Database["public"]["Enums"]["link_status"]
          student_id?: string | null
          user_id: string
        }
        Update: {
          auto_approved?: boolean
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          family_id?: string
          id?: string
          requested_at?: string
          status?: Database["public"]["Enums"]["link_status"]
          student_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_links_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_links_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fees: {
        Row: {
          amount: number | null
          base_amount: number
          concept: Database["public"]["Enums"]["fee_concept"]
          created_at: string
          created_by: string | null
          discount_amount: number
          due_date: string
          family_id: string
          id: string
          is_exempt: boolean
          note: string | null
          period_month: number | null
          period_year: number
          student_id: string
        }
        Insert: {
          amount?: number | null
          base_amount: number
          concept: Database["public"]["Enums"]["fee_concept"]
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          due_date: string
          family_id: string
          id?: string
          is_exempt?: boolean
          note?: string | null
          period_month?: number | null
          period_year: number
          student_id: string
        }
        Update: {
          amount?: number | null
          base_amount?: number
          concept?: Database["public"]["Enums"]["fee_concept"]
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          due_date?: string
          family_id?: string
          id?: string
          is_exempt?: boolean
          note?: string | null
          period_month?: number | null
          period_year?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fees_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          ci: string | null
          created_at: string
          email: string | null
          family_id: string
          full_name: string
          id: string
          is_primary: boolean
          phone: string | null
          relationship: Database["public"]["Enums"]["guardian_relationship"]
          updated_at: string
        }
        Insert: {
          ci?: string | null
          created_at?: string
          email?: string | null
          family_id: string
          full_name: string
          id?: string
          is_primary?: boolean
          phone?: string | null
          relationship?: Database["public"]["Enums"]["guardian_relationship"]
          updated_at?: string
        }
        Update: {
          ci?: string | null
          created_at?: string
          email?: string | null
          family_id?: string
          full_name?: string
          id?: string
          is_primary?: boolean
          phone?: string | null
          relationship?: Database["public"]["Enums"]["guardian_relationship"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardians_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          family_id: string
          file_name: string | null
          file_path: string
          id: string
          issued_on: string
          number: string
          payment_id: string | null
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          family_id: string
          file_name?: string | null
          file_path: string
          id?: string
          issued_on: string
          number: string
          payment_id?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          family_id?: string
          file_name?: string | null
          file_path?: string
          id?: string
          issued_on?: string
          number?: string
          payment_id?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_items: {
        Row: {
          amount: number
          fee_id: string
          id: string
          payment_id: string
        }
        Insert: {
          amount: number
          fee_id: string
          id?: string
          payment_id: string
        }
        Update: {
          amount?: number
          fee_id?: string
          id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_items_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "fee_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_items_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_items_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          family_id: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          note: string | null
          paid_on: string
          receipt_path: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
          submitted_by: string | null
          submitted_via: string
        }
        Insert: {
          amount: number
          created_at?: string
          family_id: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_on: string
          receipt_path?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          submitted_by?: string | null
          submitted_via: string
        }
        Update: {
          amount?: number
          created_at?: string
          family_id?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_on?: string
          receipt_path?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          submitted_by?: string | null
          submitted_via?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          disciplines: string[]
          due_day: number
          enrollment_fee: number
          id: boolean
          invoices_required_from: string | null
          monthly_fee: number
          org_name: string
          updated_at: string
          whatsapp_phone: string | null
        }
        Insert: {
          disciplines?: string[]
          due_day?: number
          enrollment_fee?: number
          id?: boolean
          invoices_required_from?: string | null
          monthly_fee?: number
          org_name?: string
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Update: {
          disciplines?: string[]
          due_day?: number
          enrollment_fee?: number
          id?: boolean
          invoices_required_from?: string | null
          monthly_fee?: number
          org_name?: string
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      student_document_versions: {
        Row: {
          document_id: string
          file_name: string | null
          file_path: string
          id: string
          mime_type: string | null
          replaced_at: string
          replaced_by: string | null
          size_bytes: number | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          document_id: string
          file_name?: string | null
          file_path: string
          id?: string
          mime_type?: string | null
          replaced_at?: string
          replaced_by?: string | null
          size_bytes?: number | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          document_id?: string
          file_name?: string | null
          file_path?: string
          id?: string
          mime_type?: string | null
          replaced_at?: string
          replaced_by?: string | null
          size_bytes?: number | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "student_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_document_versions_replaced_by_fkey"
            columns: ["replaced_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_document_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          file_name: string | null
          file_path: string | null
          id: string
          kind: Database["public"]["Enums"]["document_kind"]
          mime_type: string | null
          review_note: string | null
          size_bytes: number | null
          status: Database["public"]["Enums"]["document_status"]
          student_id: string
          updated_at: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          file_name?: string | null
          file_path?: string | null
          id?: string
          kind: Database["public"]["Enums"]["document_kind"]
          mime_type?: string | null
          review_note?: string | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["document_status"]
          student_id: string
          updated_at?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string | null
          file_path?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["document_kind"]
          mime_type?: string | null
          review_note?: string | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["document_status"]
          student_id?: string
          updated_at?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_notes: {
        Row: {
          author_id: string
          body: string
          corrects_note_id: string | null
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          author_id?: string
          body: string
          corrects_note_id?: string | null
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          author_id?: string
          body?: string
          corrects_note_id?: string | null
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notes_corrects_note_id_fkey"
            columns: ["corrects_note_id"]
            isOneToOne: false
            referencedRelation: "student_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_withdrawals: {
        Row: {
          communicated_on: string
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          reason: string
          reentered_on: string | null
          student_id: string
        }
        Insert: {
          communicated_on: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          reason: string
          reentered_on?: string | null
          student_id: string
        }
        Update: {
          communicated_on?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          reason?: string
          reentered_on?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_withdrawals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_withdrawals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          birth_date: string
          ci: string
          created_at: string
          created_by: string | null
          discipline: string | null
          discount_reason: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          enrolled_on: string
          exempt_reason: string | null
          family_id: string
          first_name: string
          full_name: string | null
          id: string
          is_exempt: boolean
          last_name: string
          monthly_fee_override: number | null
          photo_path: string | null
          status: Database["public"]["Enums"]["student_status"]
          updated_at: string
        }
        Insert: {
          birth_date: string
          ci: string
          created_at?: string
          created_by?: string | null
          discipline?: string | null
          discount_reason?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          enrolled_on?: string
          exempt_reason?: string | null
          family_id: string
          first_name: string
          full_name?: string | null
          id?: string
          is_exempt?: boolean
          last_name: string
          monthly_fee_override?: number | null
          photo_path?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Update: {
          birth_date?: string
          ci?: string
          created_at?: string
          created_by?: string | null
          discipline?: string | null
          discount_reason?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          enrolled_on?: string
          exempt_reason?: string | null
          family_id?: string
          first_name?: string
          full_name?: string | null
          id?: string
          is_exempt?: boolean
          last_name?: string
          monthly_fee_override?: number | null
          photo_path?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      family_balances: {
        Row: {
          balance: number | null
          family_id: string | null
          overdue_balance: number | null
          pending_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fees_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_balances: {
        Row: {
          amount: number | null
          balance: number | null
          base_amount: number | null
          concept: Database["public"]["Enums"]["fee_concept"] | null
          created_at: string | null
          discount_amount: number | null
          due_date: string | null
          family_id: string | null
          id: string | null
          is_exempt: boolean | null
          note: string | null
          paid_amount: number | null
          pending_amount: number | null
          period_month: number | null
          period_year: number | null
          state: string | null
          student_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fees_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_balances: {
        Row: {
          balance: number | null
          overdue_balance: number | null
          overdue_count: number | null
          student_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_dashboard: { Args: never; Returns: Json }
      create_enrollment_fee: {
        Args: {
          p_amount?: number
          p_due_date?: string
          p_student_id: string
          p_year: number
        }
        Returns: string
      }
      generate_monthly_fees: {
        Args: { p_month: number; p_year: number }
        Returns: number
      }
      portal_overview: { Args: never; Returns: Json }
      portal_submit_payment: {
        Args: {
          p_family_id: string
          p_fee_ids: string[]
          p_note?: string
          p_paid_on: string
          p_receipt_path: string
        }
        Returns: string
      }
      reactivate_student: {
        Args: { p_reentered_on?: string; p_student_id: string }
        Returns: undefined
      }
      register_payment: {
        Args: {
          p_family_id: string
          p_items: Json
          p_method: Database["public"]["Enums"]["payment_method"]
          p_note?: string
          p_paid_on: string
          p_receipt_path?: string
        }
        Returns: string
      }
      request_family_link: {
        Args: { p_birth_date: string; p_ci: string }
        Returns: string
      }
      review_payment: {
        Args: {
          p_approve: boolean
          p_items?: Json
          p_payment_id: string
          p_reason?: string
        }
        Returns: Database["public"]["Enums"]["payment_status"]
      }
      set_family_link_status: {
        Args: {
          p_link_id: string
          p_note?: string
          p_status: Database["public"]["Enums"]["link_status"]
        }
        Returns: undefined
      }
      withdraw_student: {
        Args: {
          p_communicated_on: string
          p_note?: string
          p_reason: string
          p_student_id: string
        }
        Returns: string
      }
    }
    Enums: {
      discount_type: "none" | "percent" | "amount"
      document_kind: "ci_front" | "ci_back" | "medical"
      document_status: "pending" | "in_review" | "complete" | "needs_update"
      fee_concept: "monthly" | "enrollment"
      guardian_relationship: "father" | "mother" | "guardian" | "other"
      link_status: "pending" | "approved" | "rejected" | "revoked"
      payment_method: "transfer" | "cash"
      payment_status: "pending" | "confirmed" | "rejected"
      student_status: "active" | "inactive"
      user_role: "admin" | "tutor"
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
      discount_type: ["none", "percent", "amount"],
      document_kind: ["ci_front", "ci_back", "medical"],
      document_status: ["pending", "in_review", "complete", "needs_update"],
      fee_concept: ["monthly", "enrollment"],
      guardian_relationship: ["father", "mother", "guardian", "other"],
      link_status: ["pending", "approved", "rejected", "revoked"],
      payment_method: ["transfer", "cash"],
      payment_status: ["pending", "confirmed", "rejected"],
      student_status: ["active", "inactive"],
      user_role: ["admin", "tutor"],
    },
  },
} as const
