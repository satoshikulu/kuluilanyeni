-- Admin RLS policies for user management

-- Admin users can view all users
CREATE POLICY "Admin users can view all users" ON users_min
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_min admin_user 
            WHERE admin_user.id::text = auth.uid()::text 
            AND admin_user.role = 'admin' 
            AND admin_user.status = 'approved'
        )
    );

-- Admin users can update all users
CREATE POLICY "Admin users can update all users" ON users_min
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users_min admin_user 
            WHERE admin_user.id::text = auth.uid()::text 
            AND admin_user.role = 'admin' 
            AND admin_user.status = 'approved'
        )
    );

-- Create admin user if not exists
DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- Check if admin user exists
    SELECT id INTO v_admin_id FROM users_min WHERE role = 'admin' LIMIT 1;
    
    IF NOT FOUND THEN
        -- Create admin user
        INSERT INTO users_min (full_name, phone, role, status)
        VALUES ('Admin Kullanıcı', '+905551234567', 'admin', 'approved')
        RETURNING id INTO v_admin_id;
        
        -- Create admin password
        INSERT INTO user_passwords (user_id, password_hash)
        VALUES (v_admin_id, 'admin123'); -- Change this password!
        
        RAISE NOTICE 'Admin user created with phone: +905551234567, password: admin123';
    END IF;
END $$;

-- Function to check if user is admin (for frontend)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users_min 
        WHERE id = user_id 
        AND role = 'admin' 
        AND status = 'approved'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;