-- Fix login function to accept correct parameters

-- Drop existing function first
DROP FUNCTION IF EXISTS public.login_user(p_password TEXT, p_phone TEXT);
DROP FUNCTION IF EXISTS public.login_user(p_phone TEXT, p_password TEXT);

-- Create new login function that accepts both phone and email
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