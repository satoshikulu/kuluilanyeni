-- Supabase Auth users tablosunu kontrol et

-- 1. Admin kullanıcısı auth.users'da var mı?
SELECT 
    'AUTH USERS CHECK' as status,
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'satoshinakamototokyo42@gmail.com';

-- 2. Eğer admin kullanıcısı yoksa oluştur
-- (Bu kısmı sadece gerekirse çalıştır)
/*
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    '90e60080-523f-46f1-8d46-255bd8e286bc',
    '00000000-0000-0000-0000-000000000000',
    'satoshinakamototokyo42@gmail.com',
    crypt('Sevimbebe4242.', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"full_name": "Admin User"}'::jsonb,
    false,
    'authenticated'
);
*/

-- 3. Profiles tablosunda admin kaydını güncelle
UPDATE public.profiles 
SET 
    full_name = 'Admin User',
    role = 'admin',
    updated_at = now()
WHERE id = '90e60080-523f-46f1-8d46-255bd8e286bc';

-- 4. Sonucu kontrol et
SELECT 
    'PROFILES UPDATE CHECK' as status,
    p.id,
    p.full_name,
    p.role,
    u.email,
    u.email_confirmed_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.id = '90e60080-523f-46f1-8d46-255bd8e286bc';