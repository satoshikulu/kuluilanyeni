-- Fix RLS infinite recursion completely

-- 1. Disable RLS on users table temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Authenticated users can view approved users" ON users;
DROP POLICY IF EXISTS "Admin users can view all users" ON users;
DROP POLICY IF EXISTS "Admin users can update all users" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can update all users" ON users;
DROP POLICY IF EXISTS "Admin can insert users" ON users;
DROP POLICY IF EXISTS "Public can register" ON users;
DROP POLICY IF EXISTS "Everyone can view approved users" ON users;

-- 3. Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. Create simple, non-recursive policies

-- Service role has full access (highest priority)
CREATE POLICY "service_role_access" ON users
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Anonymous users can register
CREATE POLICY "anonymous_register" ON users
    FOR INSERT 
    TO anon
    WITH CHECK (true);

-- Authenticated users can view approved users (for listings)
CREATE POLICY "view_approved_users" ON users
    FOR SELECT 
    TO authenticated, anon
    USING (status = 'approved');

-- Users can view and update their own record
CREATE POLICY "own_record_access" ON users
    FOR ALL 
    TO authenticated
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- 5. Create a separate function for admin checks (no RLS dependency)
CREATE OR REPLACE FUNCTION check_admin_role(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_status TEXT;
BEGIN
    -- Direct query with explicit security definer to bypass RLS
    SELECT role, status INTO user_role, user_status
    FROM users 
    WHERE id = user_id;
    
    RETURN (user_role = 'admin' AND user_status = 'approved');
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_admin_role(UUID) TO authenticated;

-- 6. Admin policy using the function
CREATE POLICY "admin_full_access" ON users
    FOR ALL 
    TO authenticated
    USING (check_admin_role(auth.uid()))
    WITH CHECK (check_admin_role(auth.uid()));

-- 7. Update approve/reject functions to use the new admin check
CREATE OR REPLACE FUNCTION approve_user(
    p_user_id UUID,
    p_admin_id UUID
) RETURNS JSON AS $$
DECLARE
    v_user RECORD;
    is_admin BOOLEAN;
BEGIN
    -- Check admin permissions using our function
    SELECT check_admin_role(p_admin_id) INTO is_admin;
    
    IF NOT is_admin THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Yetkiniz yok'
        );
    END IF;

    -- Get user to approve (bypass RLS with security definer)
    SELECT * INTO v_user FROM users WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Kullanıcı bulunamadı'
        );
    END IF;

    -- Update user status
    UPDATE users 
    SET status = 'approved', updated_at = NOW()
    WHERE id = p_user_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Kullanıcı başarıyla onaylandı',
        'user', json_build_object(
            'id', v_user.id,
            'full_name', v_user.full_name,
            'phone', v_user.phone
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Onaylama sırasında hata: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reject_user(
    p_user_id UUID,
    p_admin_id UUID
) RETURNS JSON AS $$
DECLARE
    v_user RECORD;
    is_admin BOOLEAN;
BEGIN
    -- Check admin permissions using our function
    SELECT check_admin_role(p_admin_id) INTO is_admin;
    
    IF NOT is_admin THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Yetkiniz yok'
        );
    END IF;

    -- Get user to reject (bypass RLS with security definer)
    SELECT * INTO v_user FROM users WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Kullanıcı bulunamadı'
        );
    END IF;

    -- Update user status
    UPDATE users 
    SET status = 'rejected', updated_at = NOW()
    WHERE id = p_user_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Kullanıcı başarıyla reddedildi'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Reddetme sırasında hata: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION approve_user(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_user(UUID, UUID) TO authenticated;