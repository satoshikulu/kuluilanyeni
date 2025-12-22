-- ============================================
-- ADMIN GÜVENLİK SİSTEMİ TEST
-- ============================================
-- Bu dosyayı çalıştırarak sistemi test edin
-- ============================================

-- 1. Profiles tablosu kontrolü
SELECT 
    'PROFILES TABLE' as check_name,
    COUNT(*) as total_profiles,
    COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
    COUNT(*) FILTER (WHERE role = 'user') as user_count
FROM public.profiles;

-- 2. Admin kullanıcısı kontrolü
SELECT 
    'ADMIN USER' as check_name,
    id,
    full_name,
    role,
    created_at
FROM public.profiles 
WHERE role = 'admin';

-- 3. RLS policies kontrolü
SELECT 
    'RLS POLICIES' as check_name,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Trigger kontrolü
SELECT 
    'TRIGGERS' as check_name,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 5. Functions kontrolü
SELECT 
    'FUNCTIONS' as check_name,
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_user', 'is_admin', 'get_user_role');

-- 6. Test kullanıcısı oluştur (TEST AMAÇLI)
-- Bu kısmı sadece test için kullanın
/*
-- Test user ekle
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
) VALUES (
    gen_random_uuid(),
    'test@example.com',
    crypt('testpassword', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"full_name": "Test User"}'::jsonb
);
*/

-- 7. RLS test sorguları
-- Bu sorgular sadece admin kullanıcısı çalıştırabilir
SELECT 
    'RLS TEST - ALL PROFILES' as test_name,
    COUNT(*) as accessible_profiles
FROM public.profiles;

-- 8. Helper functions test
SELECT 
    'HELPER FUNCTIONS TEST' as test_name,
    public.is_admin() as is_current_user_admin,
    public.get_user_role() as current_user_role;

-- ============================================
-- BEKLENEN SONUÇLAR:
-- ============================================
-- 1. profiles tablosu var ve kayıtlar mevcut
-- 2. En az 1 admin kullanıcısı var
-- 3. RLS policies aktif
-- 4. Trigger çalışıyor
-- 5. Helper functions mevcut
-- ============================================