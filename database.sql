-- FreeResend Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Domains table
CREATE TABLE IF NOT EXISTS domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  domain VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, verified, failed
  ses_identity_arn VARCHAR(255),
  ses_configuration_set VARCHAR(255),
  do_domain_id VARCHAR(255),
  dns_records JSONB DEFAULT '[]',
  verification_token VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  key_name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(20) NOT NULL, -- First few chars of the key for identification
  permissions JSONB DEFAULT '["send"]', -- ["send", "receive", "webhooks"]
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, key_name)
);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  message_id VARCHAR(255),
  from_email VARCHAR(255) NOT NULL,
  to_emails JSONB NOT NULL, -- Array of email addresses
  cc_emails JSONB DEFAULT '[]',
  bcc_emails JSONB DEFAULT '[]',
  subject VARCHAR(500),
  html_content TEXT,
  text_content TEXT,
  attachments JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, delivered, bounced, complained
  ses_message_id VARCHAR(255),
  error_message TEXT,
  webhook_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_log_id UUID REFERENCES email_logs(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- sent, delivered, bounced, complained, etc.
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_domain_id ON api_keys(domain_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_email_logs_api_key_id ON email_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_domain_id ON email_logs(domain_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_message_id ON email_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_email_log_id ON webhook_events(email_log_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (for future multi-user support if needed)
CREATE POLICY "Users can view own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can view own domains" ON domains FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own API keys" ON api_keys FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own email logs" ON email_logs FOR SELECT USING (
  domain_id IN (SELECT id FROM domains WHERE user_id = auth.uid())
);
CREATE POLICY "API keys can insert email logs" ON email_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own webhook events" ON webhook_events FOR SELECT USING (
  email_log_id IN (
    SELECT id FROM email_logs WHERE domain_id IN (
      SELECT id FROM domains WHERE user_id = auth.uid()
    )
  )
);
