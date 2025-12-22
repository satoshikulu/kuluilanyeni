-- ============================================
-- SADECE PROFILES GÜVENLİK SİSTEMİ
-- ============================================
-- Listings tablosuna dokunmadan sadece profiles güvenliği
-- ============================================

-- 1. PROFILES TABLOSU OLUŞTUR
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- ============================================
-- 2. RLS (ROW LEVEL SECURITY) AKTIF ET
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
-- Kullanıcı sadece kendi profilini görebilir
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Kullanıcı sadece kendi profilini güncelleyebilir (role hariç)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Sadece admin'ler tüm profilleri görebilir
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 3. OTOMATIK PROFILE OLUŞTURMA TRİGGER
-- ============================================

-- Trigger function: Yeni kullanıcı için otomatik profile oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auth.users'a yeni kayıt eklendiğinde çalış
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. ADMIN KULLANICI OLUŞTUR
-- ============================================

-- Mevcut admin kullanıcısı için profile oluştur
INSERT INTO public.profiles (id, full_name, role)
VALUES (
    '90e60080-523f-46f1-8d46-255bd8e286bc', -- Admin user ID
    'Admin User',
    'admin'
)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = 'Admin User',
    updated_at = now();

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Kullanıcının admin olup olmadığını kontrol eden function
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcının rolünü döndüren function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM public.profiles 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. KONTROL SORGUSU
-- ============================================

-- Kurulumu kontrol et
SELECT 
    'PROFILES SETUP COMPLETE' as status,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') as admin_count,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'user') as user_count;

-- Admin kullanıcısını kontrol et
SELECT 
    'ADMIN USER CHECK' as status,
    id,
    full_name,
    role,
    created_at
FROM public.profiles 
WHERE role = 'admin';

-- ============================================
-- KURULUM TAMAMLANDI ✅
-- Listings tablosuna dokunulmadı
-- ============================================