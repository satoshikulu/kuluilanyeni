-- Simple fix: Just change the foreign key constraint
-- Migration: 20250117000005_simple_fix_onesignal_constraint.sql

-- Drop existing foreign key constraint
ALTER TABLE public.onesignal_users 
DROP CONSTRAINT IF EXISTS onesignal_users_user_id_fkey;

-- Add new foreign key constraint to simple_users
ALTER TABLE public.onesignal_users 
ADD CONSTRAINT onesignal_users_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.simple_users(id) ON DELETE CASCADE;

-- Clean up any orphaned records
DELETE FROM public.onesignal_users 
WHERE user_id NOT IN (SELECT id FROM public.simple_users);