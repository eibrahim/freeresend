import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser/client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations that bypass RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database types
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface Domain {
  id: string;
  user_id: string;
  domain: string;
  status: "pending" | "verified" | "failed";
  ses_identity_arn?: string;
  ses_configuration_set?: string;
  do_domain_id?: string;
  dns_records: any[];
  verification_token?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  domain_id: string;
  key_name: string;
  key_hash: string;
  key_prefix: string;
  permissions: string[];
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  api_key_id?: string;
  domain_id: string;
  message_id?: string;
  from_email: string;
  to_emails: string[];
  cc_emails: string[];
  bcc_emails: string[];
  subject?: string;
  html_content?: string;
  text_content?: string;
  attachments: any[];
  status:
    | "pending"
    | "sent"
    | "failed"
    | "delivered"
    | "bounced"
    | "complained";
  ses_message_id?: string;
  error_message?: string;
  webhook_data?: any;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  email_log_id: string;
  event_type: string;
  event_data: any;
  processed: boolean;
  created_at: string;
}
