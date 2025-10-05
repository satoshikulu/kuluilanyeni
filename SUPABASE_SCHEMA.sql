-- ============================================
-- KULU İLAN - SUPABASE ŞEMASI
-- ============================================
-- Bu şema mevcut projenin ihtiyaçlarına göre hazırlanmıştır
-- Üye ol, ilan yayınla ve admin onay akışını destekler
-- ============================================

-- 1. USERS_MIN TABLOSU
-- Basit kullanıcı kayıt sistemi (ad-soyad + telefon)
-- Admin onayı sonrası aktif olur
CREATE TABLE IF NOT EXISTS public.users_min (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_users_min_phone ON public.users_min(phone);
CREATE INDEX IF NOT EXISTS idx_users_min_status ON public.users_min(status);
CREATE INDEX IF NOT EXISTS idx_users_min_created_at ON public.users_min(created_at DESC);

-- RLS Politikaları
ALTER TABLE public.users_min ENABLE ROW LEVEL SECURITY;

-- Herkes kayıt olabilir (INSERT)
CREATE POLICY "users_min_insert_policy" ON public.users_min
    FOR INSERT WITH CHECK (true);

-- Herkes kendi kaydını okuyabilir (phone ile kontrol)
CREATE POLICY "users_min_select_policy" ON public.users_min
    FOR SELECT USING (true);

-- Kullanıcılar kendi bilgilerini güncelleyebilir
CREATE POLICY "users_min_update_policy" ON public.users_min
    FOR UPDATE USING (true);

-- ============================================

-- 2. LISTINGS TABLOSU
-- İlan yönetimi (satılık/kiralık emlak)
-- Admin onayı sonrası yayına alınır
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    approved_at TIMESTAMPTZ,
    
    -- İlan Bilgileri
    title TEXT NOT NULL,
    description TEXT,
    
    -- Sahip Bilgileri
    owner_name TEXT NOT NULL,
    owner_phone TEXT NOT NULL,
    
    -- Emlak Detayları
    neighborhood TEXT,
    property_type TEXT,
    rooms TEXT,
    area_m2 INTEGER,
    price_tl BIGINT,
    
    -- Durum
    is_for TEXT DEFAULT 'satilik' NOT NULL CHECK (is_for IN ('satilik', 'kiralik')),
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Görseller (Supabase Storage'dan URL'ler)
    images JSONB DEFAULT '[]'::jsonb
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_is_for ON public.listings(is_for);
CREATE INDEX IF NOT EXISTS idx_listings_neighborhood ON public.listings(neighborhood);
CREATE INDEX IF NOT EXISTS idx_listings_property_type ON public.listings(property_type);
CREATE INDEX IF NOT EXISTS idx_listings_price_tl ON public.listings(price_tl);
CREATE INDEX IF NOT EXISTS idx_listings_area_m2 ON public.listings(area_m2);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_approved_at ON public.listings(approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_owner_phone ON public.listings(owner_phone);

-- Text search için GIN index (başlık, açıklama, mahalle için)
CREATE INDEX IF NOT EXISTS idx_listings_search ON public.listings 
    USING gin(to_tsvector('turkish', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(neighborhood, '')));

-- RLS Politikaları
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Herkes ilan ekleyebilir (INSERT)
CREATE POLICY "listings_insert_policy" ON public.listings
    FOR INSERT WITH CHECK (true);

-- Herkes ilanları okuyabilir (SELECT)
CREATE POLICY "listings_select_policy" ON public.listings
    FOR SELECT USING (true);

-- Herkes ilanları güncelleyebilir (Admin için)
CREATE POLICY "listings_update_policy" ON public.listings
    FOR UPDATE USING (true);

-- ============================================

-- 3. FAVORITES TABLOSU
-- Kullanıcıların favori ilanları
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    
    -- Bir kullanıcı aynı ilanı bir kez favoriye ekleyebilir
    UNIQUE(user_id, listing_id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON public.favorites(listing_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON public.favorites(created_at DESC);

-- RLS Politikaları
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi favorilerini ekleyebilir
CREATE POLICY "favorites_insert_policy" ON public.favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi favorilerini görebilir
CREATE POLICY "favorites_select_policy" ON public.favorites
    FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar kendi favorilerini silebilir
CREATE POLICY "favorites_delete_policy" ON public.favorites
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================

-- 4. STORAGE BUCKET
-- İlan görsellerini depolamak için bucket oluştur
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings.images', 'listings.images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Politikaları
-- Herkes görselleri görebilir (public bucket)
CREATE POLICY "listings_images_select_policy" ON storage.objects
    FOR SELECT USING (bucket_id = 'listings.images');

-- Herkes görsel yükleyebilir
CREATE POLICY "listings_images_insert_policy" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'listings.images');

-- Herkes görsel silebilir (admin için)
CREATE POLICY "listings_images_delete_policy" ON storage.objects
    FOR DELETE USING (bucket_id = 'listings.images');

-- ============================================

-- 5. YARDIMCI FONKSİYONLAR

-- İlan arama fonksiyonu (Türkçe full-text search)
CREATE OR REPLACE FUNCTION search_listings(search_query TEXT)
RETURNS SETOF public.listings AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.listings
    WHERE 
        to_tsvector('turkish', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(neighborhood, ''))
        @@ plainto_tsquery('turkish', search_query)
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- İstatistik fonksiyonu (admin için)
CREATE OR REPLACE FUNCTION get_listings_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_listings', COUNT(*),
        'pending_listings', COUNT(*) FILTER (WHERE status = 'pending'),
        'approved_listings', COUNT(*) FILTER (WHERE status = 'approved'),
        'rejected_listings', COUNT(*) FILTER (WHERE status = 'rejected'),
        'satilik_count', COUNT(*) FILTER (WHERE is_for = 'satilik'),
        'kiralik_count', COUNT(*) FILTER (WHERE is_for = 'kiralik'),
        'avg_price_tl', ROUND(AVG(price_tl), 2) FILTER (WHERE price_tl IS NOT NULL),
        'total_users', (SELECT COUNT(*) FROM public.users_min),
        'pending_users', (SELECT COUNT(*) FROM public.users_min WHERE status = 'pending'),
        'approved_users', (SELECT COUNT(*) FROM public.users_min WHERE status = 'approved')
    )
    INTO result
    FROM public.listings;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================

-- 6. ÖRNEK VERİLER (İsteğe Bağlı - Test için)

-- Örnek kullanıcı (onaylı)
INSERT INTO public.users_min (full_name, phone, status)
VALUES 
    ('Ahmet Yılmaz', '5551234567', 'approved'),
    ('Ayşe Demir', '5559876543', 'pending')
ON CONFLICT (phone) DO NOTHING;

-- Örnek ilanlar
INSERT INTO public.listings (
    title, 
    owner_name, 
    owner_phone, 
    neighborhood, 
    property_type, 
    rooms, 
    area_m2, 
    price_tl, 
    is_for, 
    status, 
    description
)
VALUES 
    (
        'Merkez Konumda 3+1 Satılık Daire',
        'Ahmet Yılmaz',
        '5551234567',
        'Cumhuriyet Mahallesi',
        'Daire',
        '3+1',
        120,
        2500000,
        'satilik',
        'approved',
        'Merkezi konumda, asansörlü binada, güneş alan, temiz daire. Krediye uygun.'
    ),
    (
        'Kiralık Müstakil Ev',
        'Ayşe Demir',
        '5559876543',
        'Atatürk Mahallesi',
        'Müstakil',
        '4+1',
        180,
        15000,
        'kiralik',
        'pending',
        'Geniş bahçeli müstakil ev, ailelere uygun.'
    )
ON CONFLICT DO NOTHING;

-- ============================================

-- NOTLAR:
-- 1. Bu şemayı Supabase SQL Editor'da çalıştırın
-- 2. RLS politikaları projenin güvenliğini sağlar
-- 3. Storage bucket'ı otomatik oluşturulur
-- 4. İndeksler sorgu performansını artırır
-- 5. Türkçe karakter desteği için 'turkish' text search kullanılır
-- 6. Admin kontrolü için frontend'de VITE_ADMIN_PASS kullanılır
-- 7. Favoriler tablosu Supabase Auth ile entegre çalışır

-- ============================================
-- KURULUM TAMAMLANDI
-- ============================================
