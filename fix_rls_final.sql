-- ============================================
-- RLS FİNAL DÜZELTMESİ
-- ============================================
-- 500 hatasını çözmek için en basit ve çalışan çözüm
-- ============================================

-- 1. TÜM ESKİ POLİTİKALARI TEMİZLE
-- ============================================
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_access" ON public.profiles;

-- 2. RLS'İ AKTİF ET
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. BASIT VE ÇALIŞAN POLİTİKALAR
-- ============================================

-- Policy 1: Kullanıcılar kendi profillerini görebilir
-- Bu en önemli policy - kullanıcı kendi profilini görebilmeli
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Policy 2: Kullanıcılar kendi profillerini güncelleyebilir
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================
-- NOT: Admin policy'si eklemiyoruz çünkü:
-- 1. Kullanıcı zaten kendi profilini görebiliyor
-- 2. Admin kontrolü uygulama tarafında yapılıyor (adminSecurity.ts)
-- 3. Circular dependency sorununu önlemek için
-- ============================================

-- ============================================
-- 4. KONTROL SORGUSU
-- ============================================
-- Admin profilini kontrol et
SELECT 
    'RLS FIX - FINAL' as status,
    id,
    full_name,
    role,
    created_at,
    updated_at
FROM public.profiles 
WHERE id = '90e60080-523f-46f1-8d46-255bd8e286bc';

-- ============================================
-- 5. TEST İÇİN AUTH CHECK
-- ============================================
-- Bu sorguyu Supabase SQL Editor'da çalıştırın
-- Eğer admin kullanıcısıyla giriş yaptıysanız, 
-- auth.uid() değeri admin ID'si olmalı
SELECT 
    'AUTH SESSION CHECK' as test_type,
    auth.uid() as current_user_id,
    '90e60080-523f-46f1-8d46-255bd8e286bc'::UUID as admin_id,
    CASE 
        WHEN auth.uid() = '90e60080-523f-46f1-8d46-255bd8e286bc'::UUID THEN '✅ MATCH'
        WHEN auth.uid() IS NULL THEN '❌ NULL - Session yok'
        ELSE '❌ MISMATCH'
    END as status;

-- ============================================
-- KURULUM TAMAMLANDI ✅
-- ============================================
-- Şimdi:
-- 1. Bu SQL'i Supabase SQL Editor'da çalıştırın
-- 2. Uygulamada çıkış yapın
-- 3. Tekrar giriş yapın
-- 4. Eğer hala 500 hatası alıyorsanız, 
--    tarayıcıyı tamamen kapatıp açın
-- ============================================
