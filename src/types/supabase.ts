// Supabase Database Types
// Auto-generated types for type-safe database operations

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
      subscriptions: {
        Row: {
          id: string
          organization_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          plan: 'starter' | 'growth' | 'scale'
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid'
          cancel_flows_limit: number
          cancel_flows_used: number
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          trial_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          plan?: 'starter' | 'growth' | 'scale'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid'
          cancel_flows_limit?: number
          cancel_flows_used?: number
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          trial_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          plan?: 'starter' | 'growth' | 'scale'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid'
          cancel_flows_limit?: number
          cancel_flows_used?: number
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          trial_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cancel_flows: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          is_active: boolean
          is_default: boolean
          target_type: 'all' | 'product' | 'plan' | 'custom'
          target_product_ids: string[]
          target_plan_ids: string[]
          target_customer_segment: string | null
          theme: 'minimal' | 'gradient' | 'soft' | 'bold' | 'glass' | 'dark'
          header_title: string
          header_description: string | null
          offer_title: string | null
          offer_description: string | null
          reasons: Json
          discount_percent: number
          discount_duration: number
          show_offer: boolean
          impressions: number
          cancellations: number
          saves: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          is_active?: boolean
          is_default?: boolean
          target_type?: 'all' | 'product' | 'plan' | 'custom'
          target_product_ids?: string[]
          target_plan_ids?: string[]
          target_customer_segment?: string | null
          theme?: 'minimal' | 'gradient' | 'soft' | 'bold' | 'glass' | 'dark'
          header_title?: string
          header_description?: string | null
          offer_title?: string | null
          offer_description?: string | null
          reasons?: Json
          discount_percent?: number
          discount_duration?: number
          show_offer?: boolean
          impressions?: number
          cancellations?: number
          saves?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          is_default?: boolean
          target_type?: 'all' | 'product' | 'plan' | 'custom'
          target_product_ids?: string[]
          target_plan_ids?: string[]
          target_customer_segment?: string | null
          theme?: 'minimal' | 'gradient' | 'soft' | 'bold' | 'glass' | 'dark'
          header_title?: string
          header_description?: string | null
          offer_title?: string | null
          offer_description?: string | null
          reasons?: Json
          discount_percent?: number
          discount_duration?: number
          show_offer?: boolean
          impressions?: number
          cancellations?: number
          saves?: number
          created_at?: string
          updated_at?: string
        }
      }
      churn_events: {
        Row: {
          id: string
          organization_id: string
          event_type: 'payment_failed' | 'payment_retry_sent' | 'payment_recovered' | 'cancellation_attempt' | 'offer_accepted' | 'offer_declined' | 'subscription_canceled' | 'subscription_updated' | 'subscription_recovered'
          timestamp: string
          customer_id: string
          customer_email: string | null
          subscription_id: string | null
          invoice_id: string | null
          details: Json
          source: 'webhook' | 'cancel_flow' | 'api' | 'manual'
          processed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          event_type: 'payment_failed' | 'payment_retry_sent' | 'payment_recovered' | 'cancellation_attempt' | 'offer_accepted' | 'offer_declined' | 'subscription_canceled' | 'subscription_updated' | 'subscription_recovered'
          timestamp?: string
          customer_id: string
          customer_email?: string | null
          subscription_id?: string | null
          invoice_id?: string | null
          details?: Json
          source?: 'webhook' | 'cancel_flow' | 'api' | 'manual'
          processed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          event_type?: 'payment_failed' | 'payment_retry_sent' | 'payment_recovered' | 'cancellation_attempt' | 'offer_accepted' | 'offer_declined' | 'subscription_canceled' | 'subscription_updated' | 'subscription_recovered'
          timestamp?: string
          customer_id?: string
          customer_email?: string | null
          subscription_id?: string | null
          invoice_id?: string | null
          details?: Json
          source?: 'webhook' | 'cancel_flow' | 'api' | 'manual'
          processed?: boolean
          created_at?: string
        }
      }
      email_templates: {
        Row: {
          id: string
          organization_id: string
          type: 'payment_failed' | 'payment_reminder' | 'subscription_canceled' | 'offer_accepted' | 'custom'
          name: string
          subject: string
          body: string
          is_active: boolean
          variables: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          type: 'payment_failed' | 'payment_reminder' | 'subscription_canceled' | 'offer_accepted' | 'custom'
          name: string
          subject: string
          body: string
          is_active?: boolean
          variables?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          type?: 'payment_failed' | 'payment_reminder' | 'subscription_canceled' | 'offer_accepted' | 'custom'
          name?: string
          subject?: string
          body?: string
          is_active?: boolean
          variables?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          organization_id: string
          onboarding_completed: boolean
          onboarding_step: number
          stripe_config: Json
          email_config: Json
          cancel_flow_config: Json
          dunning_config: Json
          branding: Json
          notifications: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          onboarding_completed?: boolean
          onboarding_step?: number
          stripe_config?: Json
          email_config?: Json
          cancel_flow_config?: Json
          dunning_config?: Json
          branding?: Json
          notifications?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          onboarding_completed?: boolean
          onboarding_step?: number
          stripe_config?: Json
          email_config?: Json
          cancel_flow_config?: Json
          dunning_config?: Json
          branding?: Json
          notifications?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_churn_metrics: {
        Args: {
          p_organization_id: string
          p_start_date?: string
          p_end_date?: string
        }
        Returns: {
          event_type: string
          count: number
          total_mrr_impact: number
        }[]
      }
      create_default_email_templates: {
        Args: {
          p_organization_id: string
        }
        Returns: void
      }
    }
    Enums: {
      subscription_plan: 'starter' | 'growth' | 'scale'
      subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid'
      cancel_flow_target_type: 'all' | 'product' | 'plan' | 'custom'
      cancel_flow_theme: 'minimal' | 'gradient' | 'soft' | 'bold' | 'glass' | 'dark'
      churn_event_type: 'payment_failed' | 'payment_retry_sent' | 'payment_recovered' | 'cancellation_attempt' | 'offer_accepted' | 'offer_declined' | 'subscription_canceled' | 'subscription_updated' | 'subscription_recovered'
      churn_event_source: 'webhook' | 'cancel_flow' | 'api' | 'manual'
      email_template_type: 'payment_failed' | 'payment_reminder' | 'subscription_canceled' | 'offer_accepted' | 'custom'
      email_provider: 'resend' | 'sendgrid' | 'smtp'
      dunning_urgency: 'low' | 'medium' | 'high'
    }
  }
}
