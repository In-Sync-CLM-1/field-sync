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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_locations: {
        Row: {
          accuracy: number | null
          id: string
          latitude: number
          longitude: number
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          id?: string
          latitude: number
          longitude: number
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          id?: string
          latitude?: number
          longitude?: number
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          organization_id: string
          punch_in_accuracy: number | null
          punch_in_latitude: number | null
          punch_in_longitude: number | null
          punch_in_time: string | null
          punch_out_accuracy: number | null
          punch_out_latitude: number | null
          punch_out_longitude: number | null
          punch_out_time: string | null
          status: string
          total_hours: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          organization_id: string
          punch_in_accuracy?: number | null
          punch_in_latitude?: number | null
          punch_in_longitude?: number | null
          punch_in_time?: string | null
          punch_out_accuracy?: number | null
          punch_out_latitude?: number | null
          punch_out_longitude?: number | null
          punch_out_time?: string | null
          status?: string
          total_hours?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          organization_id?: string
          punch_in_accuracy?: number | null
          punch_in_latitude?: number | null
          punch_in_longitude?: number | null
          punch_in_time?: string | null
          punch_out_accuracy?: number | null
          punch_out_latitude?: number | null
          punch_out_longitude?: number | null
          punch_out_time?: string | null
          status?: string
          total_hours?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          organization_id: string
          phone: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          organization_id: string
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          organization_id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          application_id: string | null
          assigned_user_id: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          customer_type: string | null
          email: string | null
          id: string
          industry: string | null
          last_visit_date: string | null
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          postal_code: string | null
          state: string | null
          status: string
          tags: string[] | null
          territory: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          application_id?: string | null
          assigned_user_id?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          customer_type?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          last_visit_date?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string
          tags?: string[] | null
          territory?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          application_id?: string | null
          assigned_user_id?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          customer_type?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          last_visit_date?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string
          tags?: string[] | null
          territory?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_plans: {
        Row: {
          corrected_by: string | null
          created_at: string
          health_insurance_actual: number | null
          health_insurance_target: number | null
          id: string
          life_insurance_actual: number | null
          life_insurance_target: number | null
          organization_id: string
          original_values: Json | null
          plan_date: string
          policies_actual: number
          policies_target: number
          prospects_actual: number
          prospects_market: string | null
          prospects_target: number
          quotes_actual: number
          quotes_market: string | null
          quotes_target: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          corrected_by?: string | null
          created_at?: string
          health_insurance_actual?: number | null
          health_insurance_target?: number | null
          id?: string
          life_insurance_actual?: number | null
          life_insurance_target?: number | null
          organization_id: string
          original_values?: Json | null
          plan_date: string
          policies_actual?: number
          policies_target?: number
          prospects_actual?: number
          prospects_market?: string | null
          prospects_target?: number
          quotes_actual?: number
          quotes_market?: string | null
          quotes_target?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          corrected_by?: string | null
          created_at?: string
          health_insurance_actual?: number | null
          health_insurance_target?: number | null
          id?: string
          life_insurance_actual?: number | null
          life_insurance_target?: number | null
          organization_id?: string
          original_values?: Json | null
          plan_date?: string
          policies_actual?: number
          policies_target?: number
          prospects_actual?: number
          prospects_market?: string | null
          prospects_target?: number
          quotes_actual?: number
          quotes_market?: string | null
          quotes_target?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_plans_corrected_by_fkey"
            columns: ["corrected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dispositions: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispositions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          schema: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          schema: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          schema?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string
          invoice_url: string | null
          metadata: Json | null
          organization_id: string
          paid_at: string | null
          status: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          invoice_url?: string | null
          metadata?: Json | null
          organization_id: string
          paid_at?: string | null
          status?: string | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          invoice_url?: string | null
          metadata?: Json | null
          organization_id?: string
          paid_at?: string | null
          status?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          lead_id: string
          metadata: Json | null
          organization_id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          organization_id: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assigned_user_id: string | null
          branch: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_response: string | null
          district: string | null
          follow_up_date: string | null
          id: string
          latitude: number | null
          lead_source: string | null
          longitude: number | null
          mobile_no: string | null
          name: string
          organization_id: string
          policy_type: string | null
          policy_type_category: string | null
          premium_amount: number | null
          proposal_number: string | null
          state: string | null
          status: string
          updated_at: string
          village_city: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_user_id?: string | null
          branch?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_response?: string | null
          district?: string | null
          follow_up_date?: string | null
          id?: string
          latitude?: number | null
          lead_source?: string | null
          longitude?: number | null
          mobile_no?: string | null
          name: string
          organization_id: string
          policy_type?: string | null
          policy_type_category?: string | null
          premium_amount?: number | null
          proposal_number?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          village_city?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_user_id?: string | null
          branch?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_response?: string | null
          district?: string | null
          follow_up_date?: string | null
          id?: string
          latitude?: number | null
          lead_source?: string | null
          longitude?: number | null
          mobile_no?: string | null
          name?: string
          organization_id?: string
          policy_type?: string | null
          policy_type_category?: string | null
          premium_amount?: number | null
          proposal_number?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          village_city?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_history: {
        Row: {
          accuracy: number | null
          attendance_id: string
          id: string
          latitude: number
          longitude: number
          organization_id: string
          recorded_at: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          attendance_id: string
          id?: string
          latitude: number
          longitude: number
          organization_id: string
          recorded_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          attendance_id?: string
          id?: string
          latitude?: number
          longitude?: number
          organization_id?: string
          recorded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_history_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_incentive_targets: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          policy_target: number
          target_month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          policy_target?: number
          target_month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          policy_target?: number
          target_month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_incentive_targets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_incentive_targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          apollo_config: Json | null
          billing_address: Json | null
          billing_email: string | null
          code: string | null
          created_at: string
          current_plan_id: string | null
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          max_automation_emails_per_day: number | null
          name: string
          primary_color: string | null
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          services_enabled: Json | null
          settings: Json | null
          slug: string | null
          subscription_active: boolean | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at: string | null
          updated_at: string
          usage_limits: Json | null
          user_count: number | null
        }
        Insert: {
          apollo_config?: Json | null
          billing_address?: Json | null
          billing_email?: string | null
          code?: string | null
          created_at?: string
          current_plan_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          max_automation_emails_per_day?: number | null
          name: string
          primary_color?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          services_enabled?: Json | null
          settings?: Json | null
          slug?: string | null
          subscription_active?: boolean | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
          updated_at?: string
          usage_limits?: Json | null
          user_count?: number | null
        }
        Update: {
          apollo_config?: Json | null
          billing_address?: Json | null
          billing_email?: string | null
          code?: string | null
          created_at?: string
          current_plan_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          max_automation_emails_per_day?: number | null
          name?: string
          primary_color?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          services_enabled?: Json | null
          settings?: Json | null
          slug?: string | null
          subscription_active?: boolean | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
          updated_at?: string
          usage_limits?: Json | null
          user_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_current_plan_id_fkey"
            columns: ["current_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_verifications: {
        Row: {
          attempts: number | null
          code: string
          created_at: string
          expires_at: string
          id: string
          identifier: string
          identifier_type: string
          otp_hash: string | null
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string
          expires_at: string
          id?: string
          identifier: string
          identifier_type: string
          otp_hash?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          identifier?: string
          identifier_type?: string
          otp_hash?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          invoice_id: string | null
          metadata: Json | null
          organization_id: string
          payment_method: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string
          razorpay_signature: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          organization_id: string
          payment_method?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id: string
          razorpay_signature?: string | null
          status: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          organization_id?: string
          payment_method?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string
          razorpay_signature?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_enrollments: {
        Row: {
          created_at: string | null
          customer_id: string
          daily_plan_id: string
          enrolled_at: string | null
          id: string
          notes: string | null
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          daily_plan_id: string
          enrolled_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          daily_plan_id?: string
          enrolled_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_enrollments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_enrollments_daily_plan_id_fkey"
            columns: ["daily_plan_id"]
            isOneToOne: false
            referencedRelation: "daily_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          branch_id: string | null
          calling_enabled: boolean
          created_at: string
          designation_id: string | null
          email: string | null
          email_enabled: boolean
          first_name: string | null
          full_name: string | null
          id: string
          is_active: boolean
          is_platform_admin: boolean
          last_name: string | null
          onboarding_completed: boolean
          organization_id: string | null
          phone: string | null
          reporting_manager_id: string | null
          sms_enabled: boolean
          updated_at: string
          whatsapp_enabled: boolean
        }
        Insert: {
          avatar_url?: string | null
          branch_id?: string | null
          calling_enabled?: boolean
          created_at?: string
          designation_id?: string | null
          email?: string | null
          email_enabled?: boolean
          first_name?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          is_platform_admin?: boolean
          last_name?: string | null
          onboarding_completed?: boolean
          organization_id?: string | null
          phone?: string | null
          reporting_manager_id?: string | null
          sms_enabled?: boolean
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Update: {
          avatar_url?: string | null
          branch_id?: string | null
          calling_enabled?: boolean
          created_at?: string
          designation_id?: string | null
          email?: string | null
          email_enabled?: boolean
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_platform_admin?: boolean
          last_name?: string | null
          onboarding_completed?: boolean
          organization_id?: string | null
          phone?: string | null
          reporting_manager_id?: string | null
          sms_enabled?: boolean
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      route_deviations: {
        Row: {
          acknowledged: boolean
          attendance_id: string
          detected_at: string
          distance_from_route_km: number
          id: string
          latitude: number
          longitude: number
          nearest_visit_id: string | null
          organization_id: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          attendance_id: string
          detected_at?: string
          distance_from_route_km: number
          id?: string
          latitude: number
          longitude: number
          nearest_visit_id?: string | null
          organization_id: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          attendance_id?: string
          detected_at?: string
          distance_from_route_km?: number
          id?: string
          latitude?: number
          longitude?: number
          nearest_visit_id?: string | null
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_deviations_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_deviations_nearest_visit_id_fkey"
            columns: ["nearest_visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_deviations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_deviations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_dispositions: {
        Row: {
          code: string | null
          created_at: string
          disposition_id: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          disposition_id: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          disposition_id?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_dispositions_disposition_id_fkey"
            columns: ["disposition_id"]
            isOneToOne: false
            referencedRelation: "dispositions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_dispositions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_cycle: string
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price_per_user: number
          razorpay_plan_id: string | null
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price_per_user?: number
          razorpay_plan_id?: string | null
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_per_user?: number
          razorpay_plan_id?: string | null
          trial_days?: number | null
          updated_at?: string
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
      user_sessions: {
        Row: {
          id: string
          last_accessed_at: string
          organization_id: string
          user_id: string
        }
        Insert: {
          id?: string
          last_accessed_at?: string
          organization_id: string
          user_id: string
        }
        Update: {
          id?: string
          last_accessed_at?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_checklist_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          items: Json
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          items?: Json
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          items?: Json
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_checklist_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_in_time: string
          check_out_latitude: number | null
          check_out_longitude: number | null
          check_out_time: string | null
          checklist: Json | null
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          organization_id: string
          purpose: string | null
          rescheduled_from: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_time?: string
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_time?: string | null
          checklist?: Json | null
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          organization_id: string
          purpose?: string | null
          rescheduled_from?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_time?: string
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_time?: string | null
          checklist?: Json | null
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          purpose?: string | null
          rescheduled_from?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_otps: { Args: never; Returns: undefined }
      get_user_organization_id: { Args: { user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "field_agent"
        | "manager"
        | "super_admin"
        | "sales_manager"
        | "sales_agent"
        | "support_manager"
        | "support_agent"
        | "analyst"
        | "platform_admin"
        | "sales_officer"
        | "branch_manager"
      subscription_status:
        | "trial"
        | "active"
        | "past_due"
        | "cancelled"
        | "expired"
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
      app_role: [
        "admin",
        "field_agent",
        "manager",
        "super_admin",
        "sales_manager",
        "sales_agent",
        "support_manager",
        "support_agent",
        "analyst",
        "platform_admin",
        "sales_officer",
        "branch_manager",
      ],
      subscription_status: [
        "trial",
        "active",
        "past_due",
        "cancelled",
        "expired",
      ],
    },
  },
} as const
