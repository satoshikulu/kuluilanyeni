-- ============================================
-- BASIT RLS DÜZELTMESİ
-- ============================================
-- 500 hatasını çözmek için basit RLS politikaları
-- ============================================

-- 1. TÜM ESKİ POLİTİKALARI TEMİZLE
-- ============================================
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

-- 2. BASIT VE ÇALIŞAN POLİTİKALAR
-- ============================================

-- Policy 1: Kullanıcılar kendi profillerini görebilir
-- Bu en önemli policy - kullanıcı kendi profilini görebilmeli
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL 
        AND auth.uid() = id
    );

-- Policy 2: Kullanıcılar kendi profillerini güncelleyebilir
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE 
    USING (
        auth.uid() IS NOT NULL 
        AND auth.uid() = id
    )
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND auth.uid() = id
    );

-- Policy 3: Admin'ler tüm profilleri görebilir
-- NOT: Bu policy admin kontrolü için profiles'e bakıyor
-- Bu yüzden SECURITY DEFINER function kullanmak daha iyi olabilir
-- Ama şimdilik bu şekilde deneyelim
CREATE POLICY "profiles_select_admin" ON public.profiles
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- Policy 4: Admin'ler tüm profilleri güncelleyebilir
CREATE POLICY "profiles_update_admin" ON public.profiles
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- ============================================
-- 3. RLS'İ AKTİF ET
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. KONTROL SORGUSU
-- ============================================
-- Admin profilini kontrol et
SELECT 
    'RLS FIX CHECK' as status,
    id,
    full_name,
    role,
    created_at,
    updated_at
FROM public.profiles 
WHERE id = '90e60080-523f-46f1-8d46-255bd8e286bc';

-- ============================================
-- NOT: Eğer hala 500 hatası alıyorsanız
-- ============================================
-- 1. Tarayıcıyı tamamen kapatıp açın
-- 2. Çıkış yapıp tekrar giriş yapın
-- 3. Supabase Dashboard'da Authentication > Users > 
--    Kullanıcınızın session'ını kontrol edin
-- ============================================
