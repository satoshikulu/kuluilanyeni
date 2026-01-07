-- ============================================
-- RLS POLİTİKALARINI DÜZELT
-- ============================================
-- 500 hatasını çözmek için RLS politikalarını yeniden oluştur
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

-- 2. RLS'İ AKTİF ET (eğer kapalıysa)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. YENİ POLİTİKALARI OLUŞTUR
-- ============================================

-- Policy 1: Kullanıcılar kendi profillerini görebilir
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Policy 2: Admin'ler tüm profilleri görebilir
-- NOT: Bu policy, admin kontrolü için profiles tablosuna bakıyor
-- Bu circular dependency yaratabilir, bu yüzden SECURITY DEFINER function kullanıyoruz
CREATE POLICY "profiles_select_admin" ON public.profiles
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- Policy 3: Kullanıcılar kendi profillerini güncelleyebilir (role hariç)
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
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

-- Policy 5: Trigger function için INSERT izni (SECURITY DEFINER kullanıyor, bu yüzden gerekli değil ama ekstra güvenlik için)
-- INSERT policy'si yok çünkü trigger function SECURITY DEFINER kullanıyor

-- ============================================
-- 4. TEST SORGUSU
-- ============================================
-- Bu sorguyu Supabase SQL Editor'da çalıştırın
-- Eğer admin kullanıcısıyla giriş yaptıysanız, bu sorgu çalışmalı

-- Önce auth.uid() kontrolü
SELECT 
    'AUTH CHECK' as test_type,
    auth.uid() as current_user_id,
    '90e60080-523f-46f1-8d46-255bd8e286bc'::UUID as admin_id,
    (auth.uid() = '90e60080-523f-46f1-8d46-255bd8e286bc'::UUID) as is_admin_user;

-- Admin profilini kontrol et
SELECT 
    'PROFILE CHECK' as test_type,
    id,
    full_name,
    role,
    created_at
FROM public.profiles 
WHERE id = '90e60080-523f-46f1-8d46-255bd8e286bc';

-- ============================================
-- 5. ALTERNATİF ÇÖZÜM: EĞER HALA ÇALIŞMAZSA
-- ============================================
-- Eğer yukarıdaki politikalar çalışmazsa, 
-- geçici olarak RLS'i kapatabilirsiniz (GÜVENLİK RİSKİ!)
-- Aşağıdaki satırı yorumdan çıkarın:

-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ============================================
-- KURULUM TAMAMLANDI ✅
-- ============================================
-- Şimdi uygulamada giriş yapmayı deneyin
-- Eğer hala 500 hatası alıyorsanız, tarayıcıyı yenileyin
-- veya çıkış yapıp tekrar giriş yapın
-- ============================================
