-- Create users_min table for user management
CREATE TABLE IF NOT EXISTS users_min (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(15) UNIQUE NOT NULL, -- Normalized phone number
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- OneSignal integration fields
    onesignal_player_id VARCHAR(255),
    notification_subscribed BOOLEAN DEFAULT false,
    
    -- Additional user fields
    profile_image_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_min_phone ON users_min(phone);
CREATE INDEX IF NOT EXISTS idx_users_min_email ON users_min(email);
CREATE INDEX IF NOT EXISTS idx_users_min_status ON users_min(status);
CREATE INDEX IF NOT EXISTS idx_users_min_created_at ON users_min(created_at);
CREATE INDEX IF NOT EXISTS idx_users_min_onesignal_player_id ON users_min(onesignal_player_id);
CREATE INDEX IF NOT EXISTS idx_users_min_notification_subscribed ON users_min(notification_subscribed);

-- Enable RLS
ALTER TABLE users_min ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view and update their own records
CREATE POLICY "Users can view own record" ON users_min
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own record" ON users_min
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Service role can do everything
CREATE POLICY "Service role full access" ON users_min
    FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can view approved users (for listings, etc.)
CREATE POLICY "Authenticated users can view approved users" ON users_min
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        status = 'approved'
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_min_updated_at 
    BEFORE UPDATE ON users_min 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some test data
INSERT INTO users_min (phone, full_name, email, status) VALUES
('5551234567', 'Test Kullanıcı 1', 'test1@example.com', 'approved'),
('5551234568', 'Test Kullanıcı 2', 'test2@example.com', 'approved'),
('5551234569', 'Test Kullanıcı 3', 'test3@example.com', 'pending')
ON CONFLICT (phone) DO NOTHING;