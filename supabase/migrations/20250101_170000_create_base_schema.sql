-- Create base schema with users table and login functions

-- 1. Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    email TEXT,
    approved_at TIMESTAMPTZ,
    approved_by UUID,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Create basic policies
CREATE POLICY "Public can register" ON public.users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own record" ON public.users
    FOR SELECT USING (id = auth.uid()::uuid OR true); -- Temporarily allow all for testing

-- 5. Create login function that accepts both phone and email
CREATE OR REPLACE FUNCTION public.login_user(
    p_password TEXT,
    p_phone_or_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    result JSON;
BEGIN
    -- Try to find user by phone or email
    SELECT * INTO user_record
    FROM public.users
    WHERE (phone = p_phone_or_email OR email = p_phone_or_email)
    AND password_hash = p_password;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Telefon/email veya şifre hatalı'
        );
    END IF;
    
    -- Check if user is approved
    IF user_record.status != 'approved' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Hesabınız henüz onaylanmamış'
        );
    END IF;
    
    -- Return success with user data
    RETURN json_build_object(
        'success', true,
        'message', 'Giriş başarılı',
        'user', json_build_object(
            'id', user_record.id,
            'full_name', user_record.full_name,
            'phone', user_record.phone,
            'email', user_record.email,
            'role', user_record.role,
            'status', user_record.status
        )
    );
END;
$$;

-- 6. Create register function
CREATE OR REPLACE FUNCTION public.register_user(
    p_full_name TEXT,
    p_phone TEXT,
    p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    result JSON;
BEGIN
    -- Check if phone already exists
    IF EXISTS (SELECT 1 FROM public.users WHERE phone = p_phone) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Bu telefon numarası zaten kayıtlı'
        );
    END IF;
    
    -- Insert new user
    INSERT INTO public.users (full_name, phone, password_hash, status, role)
    VALUES (p_full_name, p_phone, p_password, 'pending', 'user')
    RETURNING id INTO user_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Kayıt başarılı. Admin onayı bekleniyor.',
        'user_id', user_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Kayıt sırasında hata oluştu'
        );
END;
$$;

-- 7. Create admin functions
CREATE OR REPLACE FUNCTION public.approve_user(
    p_user_id UUID,
    p_admin_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if admin exists and has admin role
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_admin_id AND role = 'admin'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Admin kullanıcı bulunamadı'
        );
    END IF;
    
    -- Update user status
    UPDATE public.users
    SET status = 'approved',
        approved_at = now(),
        approved_by = p_admin_id,
        updated_at = now()
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Kullanıcı bulunamadı'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Kullanıcı onaylandı'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_user(
    p_user_id UUID,
    p_admin_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if admin exists and has admin role
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_admin_id AND role = 'admin'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Admin kullanıcı bulunamadı'
        );
    END IF;
    
    -- Update user status
    UPDATE public.users
    SET status = 'rejected',
        updated_at = now()
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Kullanıcı bulunamadı'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Kullanıcı reddedildi'
    );
END;
$$;

-- 8. Insert admin user
INSERT INTO public.users (
    full_name, 
    phone, 
    email,
    password_hash, 
    status, 
    role,
    approved_at,
    created_at
) VALUES (
    'Admin User',
    '0000000000',
    'satoshinakamototokyo42@gmail.com',
    'Sevimbebe4242.',
    'approved',
    'admin',
    now(),
    now()
) ON CONFLICT (phone) DO NOTHING;

-- 9. Insert test user
INSERT INTO public.users (
    full_name, 
    phone, 
    password_hash, 
    status, 
    role
) VALUES (
    'Sevim Copler',
    '5453526056',
    '1234',
    'approved',
    'user'
) ON CONFLICT (phone) DO NOTHING;