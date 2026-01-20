-- Complete RLS fix for infinite recursion
-- Migration: 20250117000006_complete_rls_fix.sql

-- STEP 1: Disable RLS temporarily to clean up
ALTER TABLE public.simple_users DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies on simple_users
DROP POLICY IF EXISTS "Users can read own profile" ON public.simple_users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.simple_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.simple_users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.simple_users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.simple_users;

-- STEP 3: Drop and recreate the admin check function with proper security
DROP FUNCTION IF EXISTS is_admin_user(TEXT);

CREATE OR REPLACE FUNCTION is_admin_user(phone_number TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    is_admin BOOLEAN := FALSE;
BEGIN
    -- Direct query without RLS to avoid recursion
    SELECT EXISTS (
        SELECT 1 FROM public.simple_users 
        WHERE phone = phone_number 
        AND role = 'admin' 
        AND status = 'approved'
    ) INTO is_admin;
    
    RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Create simple, non-recursive policies
CREATE POLICY "Users can read own profile"
ON public.simple_users
FOR SELECT
TO public
USING (
    phone = current_setting('request.jwt.claims', true)::json->>'phone'
);

CREATE POLICY "Users can update own profile"
ON public.simple_users
FOR UPDATE
TO public
USING (
    phone = current_setting('request.jwt.claims', true)::json->>'phone'
);

-- Admin policies using the security definer function
CREATE POLICY "Admins can read all users"
ON public.simple_users
FOR SELECT
TO public
USING (
    is_admin_user(current_setting('request.jwt.claims', true)::json->>'phone')
);

CREATE POLICY "Admins can update all users"
ON public.simple_users
FOR UPDATE
TO public
USING (
    is_admin_user(current_setting('request.jwt.claims', true)::json->>'phone')
);

CREATE POLICY "Admins can delete users"
ON public.simple_users
FOR DELETE
TO public
USING (
    is_admin_user(current_setting('request.jwt.claims', true)::json->>'phone')
);

-- STEP 5: Re-enable RLS
ALTER TABLE public.simple_users ENABLE ROW LEVEL SECURITY;

-- STEP 6: Also fix onesignal_users policies to avoid recursion
ALTER TABLE public.onesignal_users DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own onesignal record" ON public.onesignal_users;
DROP POLICY IF EXISTS "Users can insert own onesignal record" ON public.onesignal_users;
DROP POLICY IF EXISTS "Users can update own onesignal record" ON public.onesignal_users;
DROP POLICY IF EXISTS "Admins can manage all onesignal records" ON public.onesignal_users;

-- Simple onesignal policies without complex joins
CREATE POLICY "Users can read own onesignal record" ON public.onesignal_users
FOR SELECT
TO public
USING (
    user_id = (
        SELECT id FROM public.simple_users 
        WHERE phone = current_setting('request.jwt.claims', true)::json->>'phone'
        LIMIT 1
    )
);

CREATE POLICY "Users can insert own onesignal record" ON public.onesignal_users
FOR INSERT
TO public
WITH CHECK (
    user_id = (
        SELECT id FROM public.simple_users 
        WHERE phone = current_setting('request.jwt.claims', true)::json->>'phone'
        LIMIT 1
    )
);

CREATE POLICY "Users can update own onesignal record" ON public.onesignal_users
FOR UPDATE
TO public
USING (
    user_id = (
        SELECT id FROM public.simple_users 
        WHERE phone = current_setting('request.jwt.claims', true)::json->>'phone'
        LIMIT 1
    )
);

CREATE POLICY "Admins can manage all onesignal records" ON public.onesignal_users
FOR ALL
TO public
USING (
    is_admin_user(current_setting('request.jwt.claims', true)::json->>'phone')
);

ALTER TABLE public.onesignal_users ENABLE ROW LEVEL SECURITY;