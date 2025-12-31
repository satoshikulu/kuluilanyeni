-- Fix authentication functions to work with 'users' table instead of 'users_min'

-- Drop existing functions
DROP FUNCTION IF EXISTS register_user(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS login_user(TEXT, TEXT);
DROP FUNCTION IF EXISTS approve_user(UUID, UUID);
DROP FUNCTION IF EXISTS reject_user(UUID, UUID);

-- Register user function (for 'users' table)
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
    -- Normalize phone number (remove non-digits and add +90 if needed)
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

    -- Check if user already exists in 'users' table
    SELECT * INTO v_existing_user 
    FROM users 
    WHERE phone = v_normalized_phone;

    IF FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bu telefon numarası ile zaten kayıt yapılmış'
        );
    END IF;

    -- Insert new user into 'users' table
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

-- Login user function (for 'users' table)
CREATE OR REPLACE FUNCTION login_user(
    p_phone TEXT,
    p_password TEXT
) RETURNS JSON AS $$
DECLARE
    v_user RECORD;
    v_normalized_phone TEXT;
BEGIN
    -- Normalize phone number
    v_normalized_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
    
    -- Add +90 if not present and starts with 5
    IF v_normalized_phone ~ '^5[0-9]{9}$' THEN
        v_normalized_phone := '+90' || v_normalized_phone;
    ELSIF v_normalized_phone ~ '^90[0-9]{10}$' THEN
        v_normalized_phone := '+' || v_normalized_phone;
    END IF;

    -- Get user from 'users' table
    SELECT * INTO v_user 
    FROM users 
    WHERE phone = v_normalized_phone;

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

    -- Update last login (if columns exist)
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

-- Approve user function (for 'users' table)
CREATE OR REPLACE FUNCTION approve_user(
    p_user_id UUID,
    p_admin_id UUID
) RETURNS JSON AS $$
DECLARE
    v_user RECORD;
    v_admin RECORD;
BEGIN
    -- Check admin permissions from 'users' table
    SELECT * INTO v_admin FROM users WHERE id = p_admin_id;
    IF NOT FOUND OR COALESCE(v_admin.role, 'user') != 'admin' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Yetkiniz yok'
        );
    END IF;

    -- Get user to approve from 'users' table
    SELECT * INTO v_user FROM users WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Kullanıcı bulunamadı'
        );
    END IF;

    -- Update user status in 'users' table
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

-- Reject user function (for 'users' table)
CREATE OR REPLACE FUNCTION reject_user(
    p_user_id UUID,
    p_admin_id UUID
) RETURNS JSON AS $$
DECLARE
    v_user RECORD;
    v_admin RECORD;
BEGIN
    -- Check admin permissions from 'users' table
    SELECT * INTO v_admin FROM users WHERE id = p_admin_id;
    IF NOT FOUND OR COALESCE(v_admin.role, 'user') != 'admin' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Yetkiniz yok'
        );
    END IF;

    -- Get user to reject from 'users' table
    SELECT * INTO v_user FROM users WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Kullanıcı bulunamadı'
        );
    END IF;

    -- Update user status in 'users' table
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
GRANT EXECUTE ON FUNCTION register_user(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION login_user(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION approve_user(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_user(UUID, UUID) TO authenticated;