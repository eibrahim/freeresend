import { Pool, PoolClient } from "pg";

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    ca: undefined,
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Export the pool for direct access if needed
export { pool as db };

// Helper function for single queries
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Helper function for transactions
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Database types (kept from Supabase version)
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
  verification_token?: string;
  ses_configuration_set?: string;
  do_domain_id?: string;
  dns_records: any[];
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

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query("SELECT NOW() as current_time");
    console.log("Database connected successfully:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabase(): Promise<void> {
  await pool.end();
}
