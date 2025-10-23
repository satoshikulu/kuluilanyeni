-- ============================================
-- ÖNE ÇIKAN İLANLAR - MİGRATION
-- ============================================
-- Bu migration mevcut listings tablosuna öne çıkan ilan özelliği ekler
-- ============================================

-- 1. Yeni kolonları ekle
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- 2. İndeksler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_listings_is_featured 
ON public.listings(is_featured) 
WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_listings_featured_order 
ON public.listings(featured_order) 
WHERE is_featured = true;

-- 3. Yorum ekle
COMMENT ON COLUMN public.listings.is_featured IS 'İlan öne çıkarılmış mı?';
COMMENT ON COLUMN public.listings.featured_order IS 'Öne çıkan ilanların sıralama numarası (küçük numara önce gösterilir)';
COMMENT ON COLUMN public.listings.featured_until IS 'İlanın öne çıkarılma bitiş tarihi (opsiyonel)';

-- ============================================
-- KURULUM TAMAMLANDI
-- ============================================
-- Bu SQL'i Supabase SQL Editor'da çalıştırın
-- Mevcut verileriniz korunacaktır
-- ============================================
