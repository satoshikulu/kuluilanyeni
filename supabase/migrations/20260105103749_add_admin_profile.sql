-- Admin kullanıcısını profiles tablosuna ekle
-- Bu migration admin kullanıcısının profiles tablosunda kaydını oluşturur

-- Admin kullanıcısını ekle (satoshinakamototokyo42@gmail.com)
-- ID'yi auth.users tablosundan al ve profiles'a ekle
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
SELECT 
    id,
    'Admin User' as full_name,
    'admin' as role,
    created_at,
    now() as updated_at
FROM auth.users 
WHERE email = 'satoshinakamototokyo42@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = 'Admin User',
    updated_at = now();

-- Kontrol: Admin kullanıcısının profiles kaydını göster
DO $$
BEGIN
    RAISE NOTICE 'Admin profile created/updated for user: %', 
        (SELECT email FROM auth.users WHERE email = 'satoshinakamototokyo42@gmail.com');
END $$;