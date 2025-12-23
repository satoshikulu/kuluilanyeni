-- Web Push Subscriptions Table
-- This replaces the fcm_tokens table for Web Push Protocol

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  subscription JSONB NOT NULL, -- Full PushSubscription object
  endpoint TEXT NOT NULL, -- Push service endpoint
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id), -- One subscription per user
  UNIQUE(endpoint) -- One endpoint per subscription
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_phone ON push_subscriptions(phone);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Enable RLS (Row Level Security) - Optional
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (if needed)
CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Allow service role to access all subscriptions (for edge functions)
CREATE POLICY "Service role can access all push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON push_subscriptions TO authenticated;
GRANT ALL ON push_subscriptions TO service_role;

-- Comments
COMMENT ON TABLE push_subscriptions IS 'Web Push Protocol subscriptions for users';
COMMENT ON COLUMN push_subscriptions.subscription IS 'Full PushSubscription object as JSON';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push service endpoint URL';
COMMENT ON COLUMN push_subscriptions.phone IS 'Normalized phone number (10 digits)';

-- Example subscription data structure:
/*
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BEl62iUYgUivxIkv69yViA...",
    "auth": "tBHItJI5svbpez7KI4CCXg=="
  }
}
*/