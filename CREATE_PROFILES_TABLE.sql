-- ============================================
-- PROFILES TABLOSU OLUŞTUR
-- ============================================
-- Supabase Auth ile entegre çalışan profiles tablosu
-- Admin ve normal kullanıcılar için role yönetimi
-- ============================================

-- 1. PROFILES TABLOSU
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Kullanıcı Bilgileri
    full_name TEXT,
    phone TEXT,
    
    -- Yetki ve Durum
    role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
    status TEXT DEFAULT 'approved' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Migration bilgileri
    migrated_from_custom BOOLEAN DEFAULT false,
    migration_date TIMESTAMPTZ
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_migrated ON public.profiles(migrated_from_custom);

-- RLS Politikaları
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi profillerini görebilir
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Kullanıcılar kendi profillerini güncelleyebilir
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Yeni kullanıcı kaydında otomatik profile oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, role, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        'approved'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Yeni kullanıcı kaydında profile oluştur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ADMIN KULLANICISI OLUŞTUR
-- ============================================
-- Manuel olarak admin kullanıcısı eklemek için:

-- 1. Önce Supabase Auth'ta admin hesabı oluşturun:
--    Email: admin@kuluilani.com
--    Password: [güçlü şifre]

-- 2. Sonra bu SQL'i çalıştırın (admin user ID'sini değiştirin):
-- INSERT INTO public.profiles (id, full_name, phone, role, status)
-- VALUES (
--     '[ADMIN_USER_ID]', -- Supabase Auth'tan alınan admin user ID
--     'Admin Kullanıcı',
--     '5551234567',
--     'admin',
--     'approved'
-- )
-- ON CONFLICT (id) DO UPDATE SET
--     role = 'admin',
--     status = 'approved';

-- ============================================
-- KURULUM TAMAMLANDI
-- ============================================