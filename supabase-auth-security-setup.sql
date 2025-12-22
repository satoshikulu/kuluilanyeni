-- ============================================
-- SUPABASE AUTH GÜVENLİK SİSTEMİ
-- ============================================
-- Bu SQL dosyası güvenli admin sistemi kurar
-- Supabase SQL Editor'da çalıştırın
-- ============================================

-- 1. PROFILES TABLOSU OLUŞTUR
-- ============================================
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
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Kullanıcı sadece kendi profilini güncelleyebilir (role hariç)
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Sadece admin'ler tüm profilleri görebilir
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
-- 5. LISTINGS TABLOSU GÜVENLİK (Düzeltilmiş)
-- ============================================

-- Eğer listings tablosu varsa RLS ekle
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'listings') THEN
        -- RLS aktif et
        ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
        
        -- Admin tüm ilanları görebilir
        DROP POLICY IF EXISTS "listings_admin_all" ON public.listings;
        CREATE POLICY "listings_admin_all" ON public.listings
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() AND role = 'admin'
                )
            );
        
        -- Normal kullanıcı sadece kendi ilanlarını görebilir
        -- Listings tablosundaki gerçek kolon adlarını kullan
        DROP POLICY IF EXISTS "listings_user_own" ON public.listings;
        CREATE POLICY "listings_user_own" ON public.listings
            FOR ALL USING (
                -- Mevcut kolon adlarına göre düzelt
                auth.uid()::text = user_id OR 
                auth.uid() = created_by OR
                auth.uid()::text = owner_phone -- Eğer owner_phone ile ilişki kuruluyorsa
            );
    END IF;
END $$;

-- ============================================
-- 6. HELPER FUNCTIONS
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
-- 7. KONTROL SORGUSU
-- ============================================

-- Kurulumu kontrol et
SELECT 
    'SETUP CHECK' as status,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') as admin_count,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'user') as user_count;

-- Admin kullanıcısını kontrol et
SELECT 
    'ADMIN CHECK' as status,
    id,
    full_name,
    role,
    created_at
FROM public.profiles 
WHERE role = 'admin';

-- ============================================
-- KURULUM TAMAMLANDI ✅
-- ============================================