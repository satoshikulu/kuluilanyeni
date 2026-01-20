-- Fix infinite recursion in simple_users RLS policies
-- Migration: 20250117000003_fix_simple_users_rls_recursion.sql

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can read all users" ON public.simple_users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.simple_users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.simple_users;

-- Create admin check function that bypasses RLS
CREATE OR REPLACE FUNCTION is_admin_user(phone_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Use security definer to bypass RLS for this check
  RETURN EXISTS (
    SELECT 1 FROM public.simple_users 
    WHERE phone = phone_number 
    AND role = 'admin' 
    AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate admin policies using the function
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

-- Also fix user_requests policies that have the same issue
DROP POLICY IF EXISTS "Admins can read all user requests" ON public.user_requests;
DROP POLICY IF EXISTS "Admins can update user requests" ON public.user_requests;
DROP POLICY IF EXISTS "Admins can delete user requests" ON public.user_requests;

CREATE POLICY "Admins can read all user requests"
ON public.user_requests
FOR SELECT
TO public
USING (
  is_admin_user(current_setting('request.jwt.claims', true)::json->>'phone')
);

CREATE POLICY "Admins can update user requests"
ON public.user_requests
FOR UPDATE
TO public
USING (
  is_admin_user(current_setting('request.jwt.claims', true)::json->>'phone')
);

CREATE POLICY "Admins can delete user requests"
ON public.user_requests
FOR DELETE
TO public
USING (
  is_admin_user(current_setting('request.jwt.claims', true)::json->>'phone')
);