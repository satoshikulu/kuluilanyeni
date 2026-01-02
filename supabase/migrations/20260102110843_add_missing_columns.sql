-- Add missing columns and create notification_logs table

-- 1. Create notification_logs table (if not exists)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- OneSignal notification details
    onesignal_notification_id TEXT,
    external_id TEXT,
    
    -- Notification content
    title TEXT,
    message TEXT,
    
    -- Target info
    target_type TEXT CHECK (target_type IN ('user', 'segment', 'all', 'phone')),
    target_user_id UUID,
    target_segment TEXT,
    target_phone TEXT,
    
    -- Status and type
    success BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
    type TEXT,
    
    -- User info (for logging)
    user_id UUID,
    
    -- Metadata
    metadata JSONB,
    error_message TEXT
);

-- 2. Add missing columns to push_subscriptions (if they don't exist)
DO $$ 
BEGIN
    -- Add active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'push_subscriptions' 
                   AND column_name = 'active') THEN
        ALTER TABLE public.push_subscriptions ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add onesignal_player_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'push_subscriptions' 
                   AND column_name = 'onesignal_player_id') THEN
        ALTER TABLE public.push_subscriptions ADD COLUMN onesignal_player_id TEXT;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'push_subscriptions' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE public.push_subscriptions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
    END IF;
END $$;

-- 3. Create indexes (if not exist)
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.notification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_target_user_id ON public.notification_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON public.notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_success ON public.notification_logs(success);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON public.push_subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_onesignal_player_id ON public.push_subscriptions(onesignal_player_id);

-- 4. Enable RLS (if not already enabled)
DO $$
BEGIN
    -- Enable RLS for notification_logs
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'notification_logs' AND relrowsecurity = true) THEN
        ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Enable RLS for push_subscriptions  
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'push_subscriptions' AND relrowsecurity = true) THEN
        ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 5. Create policies (if not exist)
DO $$
BEGIN
    -- notification_logs policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_logs' AND policyname = 'Service role full access on notification_logs') THEN
        CREATE POLICY "Service role full access on notification_logs" ON public.notification_logs
            FOR ALL USING (auth.role() = 'service_role');
    END IF;
    
    -- push_subscriptions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'push_subscriptions' AND policyname = 'Service role full access on push_subscriptions') THEN
        CREATE POLICY "Service role full access on push_subscriptions" ON public.push_subscriptions
            FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;