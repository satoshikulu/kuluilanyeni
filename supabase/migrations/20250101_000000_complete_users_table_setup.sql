-- Complete users table setup with email support and admin user

-- 1. Add email column to users table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    END IF;
END $$;

-- 2. Add role column to users table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin'));
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    END IF;
END $$;

-- 3. Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. Clear existing RLS policies
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Authenticated users can view approved users" ON users;
DROP POLICY IF EXISTS "Admin users can view all users" ON users;
DROP POLICY IF EXISTS "Admin users can update all users" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can update all users" ON users;
DROP POLICY IF EXISTS "Admin can insert users" ON users;

-- 5. Create simple RLS policies (no recursion)

-- Service role has full access
CREATE POLICY "Service role full access" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Public can insert (for registration)
CREATE POLICY "Public can register" ON users
    FOR INSERT WITH CHECK (true);

-- Users can view their own record
CREATE POLICY "Users can view own record" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own record
CREATE POLICY "Users can update own record" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Everyone can view approved users (for listings)
CREATE POLICY "Everyone can view approved users" ON users
    FOR SELECT USING (status = 'approved');

-- 6. Create admin user with email
DO $$
DECLARE
    admin_exists BOOLEAN;
    admin_id UUID;
BEGIN
    -- Check if admin exists
    SELECT EXISTS(SELECT 1 FROM users WHERE email = 'satoshinakamototokyo42@gmail.com' OR role = 'admin') INTO admin_exists;
    
    IF NOT admin_exists THEN
        -- Insert admin user
        INSERT INTO users (
            full_name, 
            phone, 
            email,
            role, 
            status, 
            password_hash, 
            created_at, 
            updated_at
        ) VALUES (
            'Admin Kullanıcı', 
            '+905551234567', 
            'satoshinakamototokyo42@gmail.com',
            'admin', 
            'approved', 
            'admin123',
            NOW(), 
            NOW()
        ) RETURNING id INTO admin_id;
        
        RAISE NOTICE 'Admin kullanıcısı oluşturuldu:';
        RAISE NOTICE 'Email: satoshinakamototokyo42@gmail.com';
        RAISE NOTICE 'Telefon: +905551234567';
        RAISE NOTICE 'Şifre: admin123';
        RAISE NOTICE 'ID: %', admin_id;
    ELSE
        RAISE NOTICE 'Admin kullanıcısı zaten mevcut';
    END IF;
END $$;

-- 7. Update login function to support email login for admin
CREATE OR REPLACE FUNCTION login_user(
    p_phone_or_email TEXT,
    p_password TEXT
) RETURNS JSON AS $$
DECLARE
    v_user RECORD;
    v_normalized_phone TEXT;
BEGIN
    -- Check if input is email (contains @)
    IF p_phone_or_email LIKE '%@%' THEN
        -- Email login (for admin)
        SELECT * INTO v_user 
        FROM users 
        WHERE email = p_phone_or_email;
    ELSE
        -- Phone login (for regular users)
        v_normalized_phone := regexp_replace(p_phone_or_email, '[^0-9]', '', 'g');
        
        -- Add +90 if not present and starts with 5
        IF v_normalized_phone ~ '^5[0-9]{9}$' THEN
            v_normalized_phone := '+90' || v_normalized_phone;
        ELSIF v_normalized_phone ~ '^90[0-9]{10}$' THEN
            v_normalized_phone := '+' || v_normalized_phone;
        END IF;

        SELECT * INTO v_user 
        FROM users 
        WHERE phone = v_normalized_phone;
    END IF;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Kullanıcı bulunamadı'
        );
    END IF;

    -- Check password
    IF v_user.password_hash != p_password THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Hatalı şifre'
        );
    END IF;

    -- Check user status
    IF v_user.status = 'pending' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Hesabınız henüz onaylanmamış. Lütfen admin onayını bekleyin.'
        );
    ELSIF v_user.status = 'rejected' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Hesabınız reddedilmiş. Lütfen yönetici ile iletişime geçin.'
        );
    ELSIF v_user.status = 'suspended' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Hesabınız askıya alınmış. Lütfen yönetici ile iletişime geçin.'
        );
    END IF;

    -- Update last login
    UPDATE users 
    SET updated_at = NOW()
    WHERE id = v_user.id;

    RETURN json_build_object(
        'success', true,
        'message', 'Giriş başarılı',
        'user', json_build_object(
            'id', v_user.id,
            'full_name', v_user.full_name,
            'phone', v_user.phone,
            'email', v_user.email,
            'role', COALESCE(v_user.role, 'user'),
            'status', v_user.status
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Giriş sırasında hata: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Update register function
CREATE OR REPLACE FUNCTION register_user(
    p_full_name TEXT,
    p_phone TEXT,
    p_password TEXT
) RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_normalized_phone TEXT;
    v_existing_user RECORD;
BEGIN
    -- Normalize phone number
    v_normalized_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
    
    -- Add +90 if not present and starts with 5
    IF v_normalized_phone ~ '^5[0-9]{9}$' THEN
        v_normalized_phone := '+90' || v_normalized_phone;
    ELSIF v_normalized_phone ~ '^90[0-9]{10}$' THEN
        v_normalized_phone := '+' || v_normalized_phone;
    ELSIF NOT v_normalized_phone ~ '^\+90[0-9]{10}$' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Geçersiz telefon numarası formatı. Örnek: 05551234567'
        );
    END IF;

    -- Check if user already exists
    SELECT * INTO v_existing_user 
    FROM users 
    WHERE phone = v_normalized_phone;

    IF FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bu telefon numarası ile zaten kayıt yapılmış'
        );
    END IF;

    -- Insert new user
    INSERT INTO users (full_name, phone, status, role, password_hash)
    VALUES (p_full_name, v_normalized_phone, 'pending', 'user', p_password)
    RETURNING id INTO v_user_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Kayıt başarılı! Onay bekliyor.',
        'user_id', v_user_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Kayıt sırasında hata: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Update approve/reject functions
CREATE OR REPLACE FUNCTION approve_user(
    p_user_id UUID,
    p_admin_id UUID
) RETURNS JSON AS $$
DECLARE
    v_user RECORD;
    v_admin RECORD;
BEGIN
    -- Check admin permissions
    SELECT * INTO v_admin FROM users WHERE id = p_admin_id;
    IF NOT FOUND OR COALESCE(v_admin.role, 'user') != 'admin' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Yetkiniz yok'
        );
    END IF;

    -- Get user to approve
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
    v_admin RECORD;
BEGIN
    -- Check admin permissions
    SELECT * INTO v_admin FROM users WHERE id = p_admin_id;
    IF NOT FOUND OR COALESCE(v_admin.role, 'user') != 'admin' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Yetkiniz yok'
        );
    END IF;

    -- Get user to reject
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

-- 10. Grant execute permissions
GRANT EXECUTE ON FUNCTION login_user(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION register_user(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION approve_user(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_user(UUID, UUID) TO authenticated;