-- ============================================
-- SUPABASE AUTH GEÇİŞİ - MIGRATION
-- ============================================
-- Custom auth sisteminden Supabase Auth'a geçiş
-- Mevcut kullanıcı verilerini koruyarak güvenli geçiş
-- ============================================

-- 1. PROFILES TABLOSUNU GÜNCELLE
-- Mevcut users tablosundaki verileri profiles tablosuna taşı

-- Önce profiles tablosuna gerekli kolonları ekle (eğer yoksa)
DO $$ 
BEGIN
    -- phone kolonu ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    END IF;
    
    -- status kolonu ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'status') THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'rejected'));
    END IF;
    
    -- password_hash kolonu ekle (geçici - şifre sıfırlama için)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'old_password_hash') THEN
        ALTER TABLE public.profiles ADD COLUMN old_password_hash TEXT;
    END IF;
END $$;

-- 2. USERS TABLOSUNU PROFILES İLE UYUMLU HALE GETİR
-- users tablosunu profiles ile aynı yapıya getir

-- users tablosuna user_id kolonu ekle (auth.users ile bağlantı için)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' 
                   AND column_name = 'user_id') THEN
        ALTER TABLE public.users ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. LISTINGS TABLOSUNU GÜNCELLE
-- user_id kolonu ekle (eğer yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'listings' 
                   AND column_name = 'user_id') THEN
        ALTER TABLE public.listings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    -- requires_membership kolonu ekle (üye olmayan kullanıcılar için)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'listings' 
                   AND column_name = 'requires_membership') THEN
        ALTER TABLE public.listings ADD COLUMN requires_membership BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 4. KULLANICI KAYIT FONKSİYONU (SUPABASE AUTH İLE)
-- Yeni kullanıcılar Supabase Auth ile kaydolacak

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Yeni kullanıcı auth.users'a eklendiğinde profiles tablosuna da ekle
    INSERT INTO public.profiles (id, full_name, role, status, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Kullanıcı'),
        'user',
        'pending', -- Yeni kullanıcılar admin onayı bekler
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger oluştur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. KULLANICI ONAYLAMA FONKSİYONLARI (ADMIN İÇİN)

-- Kullanıcı onaylama fonksiyonu
CREATE OR REPLACE FUNCTION public.approve_user(
    p_user_id UUID,
    p_admin_id UUID
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Admin kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = p_admin_id AND role = 'admin'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Admin yetkisi gerekli'
        );
    END IF;
    
    -- Kullanıcıyı onayla
    UPDATE public.profiles 
    SET status = 'approved', updated_at = NOW()
    WHERE id = p_user_id;
    
    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Kullanıcı onaylandı'
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'error', 'Kullanıcı bulunamadı'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcı reddetme fonksiyonu
CREATE OR REPLACE FUNCTION public.reject_user(
    p_user_id UUID,
    p_admin_id UUID
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Admin kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = p_admin_id AND role = 'admin'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Admin yetkisi gerekli'
        );
    END IF;
    
    -- Kullanıcıyı reddet
    UPDATE public.profiles 
    SET status = 'rejected', updated_at = NOW()
    WHERE id = p_user_id;
    
    IF FOUND THEN
        RETURN json_build_object(
            'success', true,
            'message', 'Kullanıcı reddedildi'
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'error', 'Kullanıcı bulunamadı'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS POLİTİKALARINI GÜNCELLE

-- profiles tablosu RLS politikaları
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi profillerini görebilir
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Adminler tüm profilleri görebilir
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Kullanıcılar kendi profillerini güncelleyebilir (sadece belirli alanlar)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Adminler tüm profilleri güncelleyebilir
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 7. LISTINGS TABLOSU RLS POLİTİKALARINI GÜNCELLE

-- Herkes ilanları görebilir
DROP POLICY IF EXISTS "listings_select_all" ON public.listings;
CREATE POLICY "listings_select_all" ON public.listings
    FOR SELECT USING (true);

-- Giriş yapmış kullanıcılar ilan ekleyebilir
DROP POLICY IF EXISTS "listings_insert_authenticated" ON public.listings;
CREATE POLICY "listings_insert_authenticated" ON public.listings
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Kullanıcılar kendi ilanlarını güncelleyebilir
DROP POLICY IF EXISTS "listings_update_own" ON public.listings;
CREATE POLICY "listings_update_own" ON public.listings
    FOR UPDATE USING (auth.uid() = user_id);

-- Adminler tüm ilanları güncelleyebilir
DROP POLICY IF EXISTS "listings_update_admin" ON public.listings;
CREATE POLICY "listings_update_admin" ON public.listings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 8. İNDEKSLER EKLE

-- profiles tablosu indeksleri
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- listings tablosu user_id indeksi
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings(user_id);

-- 9. YARDIMCI FONKSİYONLAR

-- Kullanıcı telefon numarası ile profil bulma
CREATE OR REPLACE FUNCTION public.get_user_by_phone(p_phone TEXT)
RETURNS TABLE(
    id UUID,
    full_name TEXT,
    phone TEXT,
    status TEXT,
    role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.phone,
        p.status,
        p.role
    FROM public.profiles p
    WHERE p.phone = p_phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcının ilan sayısını getir
CREATE OR REPLACE FUNCTION public.get_user_listing_counts(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'pending', COUNT(*) FILTER (WHERE status = 'pending'),
        'approved', COUNT(*) FILTER (WHERE status = 'approved'),
        'rejected', COUNT(*) FILTER (WHERE status = 'rejected')
    )
    INTO result
    FROM public.listings
    WHERE user_id = p_user_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NOTLAR:
-- ============================================
-- 1. Bu migration mevcut verileri korur
-- 2. Yeni kullanıcılar Supabase Auth ile kaydolur
-- 3. Mevcut kullanıcılar şifre sıfırlama ile sisteme geçer
-- 4. Admin sistemi tamamen Supabase Auth kullanır
-- 5. RLS politikaları güvenliği sağlar
-- 6. Trigger otomatik profil oluşturur
-- ============================================

-- Migration tamamlandı
SELECT 'Supabase Auth migration completed successfully!' as status;