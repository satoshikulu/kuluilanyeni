-- Fix onesignal_users table to reference simple_users instead of profiles
-- Migration: 20250117000004_fix_onesignal_table_reference.sql

-- First, check if onesignal_users table exists and what it references
DO $$
BEGIN
    -- Drop the table if it exists with wrong reference
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'onesignal_users') THEN
        -- Check if it references profiles (wrong) or simple_users (correct)
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = 'onesignal_users' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'profiles'
        ) THEN
            -- Wrong reference, drop and recreate
            RAISE NOTICE 'Dropping onesignal_users table with wrong profiles reference';
            DROP TABLE IF EXISTS public.onesignal_users CASCADE;
        END IF;
    END IF;
END $$;

-- Create onesignal_users table with correct simple_users reference
CREATE TABLE IF NOT EXISTS public.onesignal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.simple_users(id) ON DELETE CASCADE,
  onesignal_external_id TEXT,
  onesignal_user_id TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'success', 'failed')),
  sync_error TEXT,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_onesignal_users_user_id ON public.onesignal_users(user_id);
CREATE INDEX IF NOT EXISTS idx_onesignal_users_sync_status ON public.onesignal_users(sync_status);
CREATE INDEX IF NOT EXISTS idx_onesignal_users_external_id ON public.onesignal_users(onesignal_external_id);

-- Enable RLS
ALTER TABLE public.onesignal_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own onesignal record" ON public.onesignal_users
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.simple_users 
      WHERE phone = current_setting('request.jwt.claims', true)::json->>'phone'
    )
  );

CREATE POLICY "Users can insert own onesignal record" ON public.onesignal_users
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.simple_users 
      WHERE phone = current_setting('request.jwt.claims', true)::json->>'phone'
    )
  );

CREATE POLICY "Users can update own onesignal record" ON public.onesignal_users
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.simple_users 
      WHERE phone = current_setting('request.jwt.claims', true)::json->>'phone'
    )
  );

-- Admin can manage all onesignal records
CREATE POLICY "Admins can manage all onesignal records" ON public.onesignal_users
  FOR ALL USING (
    is_admin_user(current_setting('request.jwt.claims', true)::json->>'phone')
  );