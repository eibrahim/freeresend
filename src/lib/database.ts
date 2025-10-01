import { Pool, PoolClient } from "pg";

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    ca: undefined,
  },
  max: 5, // Maximum number of clients in the pool (reduced from 20)
  idleTimeoutMillis: 10000, // Close idle clients after 10 seconds (reduced from 30s)
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
});

// Export the pool for direct access if needed
export { pool as db };

// Helper function for single queries
export async function query(text: string, params?: unknown[]) {
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
  dns_records: unknown[];
  smtp_credentials?: {
    username: string;
    password: string;
    server: string;
    port: number;
  };
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
  attachments: unknown[];
  status:
    | "pending"
    | "sent"
    | "failed"
    | "delivered"
    | "bounced"
    | "complained";
  ses_message_id?: string;
  error_message?: string;
  webhook_data?: unknown;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  email_log_id: string;
  event_type: string;
  event_data: unknown;
  processed: boolean;
  created_at: string;
}

export interface WaitlistSignup {
  id: string;
  email: string;
  estimated_volume?: number;
  current_provider?: string;
  referral_source?: string;
  user_agent?: string;
  ip_address?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  created_at: string;
  updated_at: string;
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

// Waitlist operations
export interface CreateWaitlistSignupData {
  email: string;
  estimated_volume?: number;
  current_provider?: string;
  referral_source?: string;
  user_agent?: string;
  ip_address?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface WaitlistAnalytics {
  total_signups: number;
  signups_today: number;
  signups_this_week: number;
  signups_this_month: number;
  avg_estimated_volume: number;
  top_referral_sources: Array<{ source: string; count: number }>;
  top_utm_sources: Array<{ source: string; count: number }>;
}

export async function createWaitlistSignup(data: CreateWaitlistSignupData): Promise<WaitlistSignup> {
  const result = await query(
    `INSERT INTO waitlist_signups (
      email, estimated_volume, current_provider, referral_source, 
      user_agent, ip_address, utm_source, utm_medium, utm_campaign
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      data.email,
      data.estimated_volume,
      data.current_provider,
      data.referral_source,
      data.user_agent,
      data.ip_address,
      data.utm_source,
      data.utm_medium,
      data.utm_campaign,
    ]
  );
  return result.rows[0];
}

export async function getWaitlistSignupByEmail(email: string): Promise<WaitlistSignup | null> {
  const result = await query(
    "SELECT * FROM waitlist_signups WHERE email = $1",
    [email]
  );
  return result.rows[0] || null;
}

export async function getAllWaitlistSignups(
  limit: number = 100,
  offset: number = 0
): Promise<WaitlistSignup[]> {
  const result = await query(
    "SELECT * FROM waitlist_signups ORDER BY created_at DESC LIMIT $1 OFFSET $2",
    [limit, offset]
  );
  return result.rows;
}

export async function getWaitlistAnalytics(): Promise<WaitlistAnalytics> {
  const [
    totalResult,
    todayResult,
    weekResult,
    monthResult,
    avgVolumeResult,
    referralSourcesResult,
    utmSourcesResult,
  ] = await Promise.all([
    // Total signups
    query("SELECT COUNT(*) as count FROM waitlist_signups"),
    
    // Signups today
    query(
      "SELECT COUNT(*) as count FROM waitlist_signups WHERE created_at >= CURRENT_DATE"
    ),
    
    // Signups this week
    query(
      "SELECT COUNT(*) as count FROM waitlist_signups WHERE created_at >= date_trunc('week', CURRENT_DATE)"
    ),
    
    // Signups this month
    query(
      "SELECT COUNT(*) as count FROM waitlist_signups WHERE created_at >= date_trunc('month', CURRENT_DATE)"
    ),
    
    // Average estimated volume
    query(
      "SELECT AVG(estimated_volume) as avg_volume FROM waitlist_signups WHERE estimated_volume IS NOT NULL"
    ),
    
    // Top referral sources
    query(
      `SELECT referral_source as source, COUNT(*) as count 
       FROM waitlist_signups 
       WHERE referral_source IS NOT NULL 
       GROUP BY referral_source 
       ORDER BY count DESC 
       LIMIT 10`
    ),
    
    // Top UTM sources
    query(
      `SELECT utm_source as source, COUNT(*) as count 
       FROM waitlist_signups 
       WHERE utm_source IS NOT NULL 
       GROUP BY utm_source 
       ORDER BY count DESC 
       LIMIT 10`
    ),
  ]);

  return {
    total_signups: parseInt(totalResult.rows[0].count),
    signups_today: parseInt(todayResult.rows[0].count),
    signups_this_week: parseInt(weekResult.rows[0].count),
    signups_this_month: parseInt(monthResult.rows[0].count),
    avg_estimated_volume: parseFloat(avgVolumeResult.rows[0].avg_volume) || 0,
    top_referral_sources: referralSourcesResult.rows,
    top_utm_sources: utmSourcesResult.rows,
  };
}

export async function getWaitlistSignupsCount(): Promise<number> {
  const result = await query("SELECT COUNT(*) as count FROM waitlist_signups");
  return parseInt(result.rows[0].count);
}

export async function exportWaitlistSignups(): Promise<WaitlistSignup[]> {
  const result = await query(
    "SELECT * FROM waitlist_signups ORDER BY created_at ASC"
  );
  return result.rows;
}
