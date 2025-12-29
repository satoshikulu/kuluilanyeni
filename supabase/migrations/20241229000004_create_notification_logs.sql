-- Create notification_logs table for tracking OneSignal notifications
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users_min(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'notification', 'subscription', 'bulk_subscription'
    title VARCHAR(255),
    message TEXT,
    target_type VARCHAR(20), -- 'all', 'user', 'segment'
    target_value VARCHAR(255), -- user ID or segment name
    success BOOLEAN NOT NULL DEFAULT false,
    onesignal_notification_id VARCHAR(255),
    onesignal_player_id VARCHAR(255),
    recipients INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_success ON notification_logs(success);

-- Enable RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notification logs
CREATE POLICY "Users can view own notification logs" ON notification_logs
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Policy: Service role can do everything
CREATE POLICY "Service role full access" ON notification_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Policy: Authenticated users can view general notification stats (without personal data)
CREATE POLICY "Authenticated users can view stats" ON notification_logs
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        user_id IS NULL
    );

-- Create a view for notification statistics
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
    DATE(created_at) as date,
    type,
    target_type,
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE success = true) as successful_notifications,
    COUNT(*) FILTER (WHERE success = false) as failed_notifications,
    SUM(recipients) as total_recipients
FROM notification_logs
GROUP BY DATE(created_at), type, target_type
ORDER BY date DESC;

-- Grant access to the view
GRANT SELECT ON notification_stats TO authenticated;
GRANT SELECT ON notification_stats TO service_role;