-- Fix OneSignal users table to reference simple_users instead of users
-- Migration: 20250117000001_fix_onesignal_schema.sql

-- Drop existing foreign key constraint if exists
ALTER TABLE onesignal_users 
DROP CONSTRAINT IF EXISTS onesignal_users_user_id_fkey;

-- Add new foreign key constraint to simple_users table
ALTER TABLE onesignal_users 
ADD CONSTRAINT onesignal_users_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES simple_users(id) ON DELETE CASCADE;

-- Update any existing records that might have invalid user_id references
-- (This is safe because we're just ensuring data integrity)
DELETE FROM onesignal_users 
WHERE user_id NOT IN (SELECT id FROM simple_users);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_onesignal_users_user_id ON onesignal_users(user_id);
CREATE INDEX IF NOT EXISTS idx_onesignal_users_sync_status ON onesignal_users(sync_status);
CREATE INDEX IF NOT EXISTS idx_onesignal_users_external_id ON onesignal_users(onesignal_external_id);