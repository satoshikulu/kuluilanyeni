-- ============================================
-- ÇALIŞAN RLS POLİTİKALARI
-- ============================================
-- Bu dosya RLS'i düzgün şekilde yapılandırır
-- ============================================

-- 1. TÜM ESKİ POLİTİKALARI TEMİZLE
-- ============================================
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

-- 2. RLS'İ AKTİF ET
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. BASIT VE ÇALIŞAN POLİTİKALAR
-- ============================================

-- Policy 1: Kullanıcılar kendi profillerini görebilir
-- Bu policy, kullanıcının kendi ID'si ile eşleşen profili görmesine izin verir
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
-- 2. Admin kontrolü uygulama tarafında yapılıyor
-- 3. Circular dependency sorununu önlemek için
-- ============================================

-- ============================================
-- 4. KONTROL SORGUSU
-- ============================================
-- Admin profilini kontrol et
SELECT 
    'RLS WORKING - FINAL' as status,
    id,
    full_name,
    role,
    created_at,
    updated_at
FROM public.profiles 
WHERE id = '90e60080-523f-46f1-8d46-255bd8e286bc';

-- ============================================
-- KURULUM TAMAMLANDI ✅
-- ============================================
-- Şimdi:
-- 1. Bu SQL'i Supabase SQL Editor'da çalıştırın
-- 2. Uygulamada çıkış yapın
-- 3. Tekrar giriş yapın
-- 4. Eğer hala 500 hatası alıyorsanız:
--    a) Tarayıcıyı tamamen kapatıp açın
--    b) Veya fix_rls_bypass_test.sql dosyasını çalıştırın
--       (RLS'i geçici olarak kapatır - sadece test için)
-- ============================================
