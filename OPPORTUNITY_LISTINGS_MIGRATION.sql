-- ============================================
-- FIRSAT İLANLARI - MİGRATION
-- ============================================
-- Bu migration mevcut listings tablosuna fırsat ilan özelliği ekler
-- ============================================

-- 1. Yeni kolonları ekle
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS is_opportunity BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS opportunity_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_price_tl BIGINT,
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER;

-- 2. İndeksler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_listings_is_opportunity 
ON public.listings(is_opportunity) 
WHERE is_opportunity = true;

CREATE INDEX IF NOT EXISTS idx_listings_opportunity_order 
ON public.listings(opportunity_order) 
WHERE is_opportunity = true;

-- 3. Yorum ekle
COMMENT ON COLUMN public.listings.is_opportunity IS 'İlan fırsat ilan olarak işaretlenmiş mi?';
COMMENT ON COLUMN public.listings.opportunity_order IS 'Fırsat ilanların sıralama numarası (küçük numara önce gösterilir)';
COMMENT ON COLUMN public.listings.original_price_tl IS 'İlanın orijinal/eski fiyatı (indirim göstermek için)';
COMMENT ON COLUMN public.listings.discount_percentage IS 'İndirim yüzdesi (otomatik hesaplanır)';

-- ============================================
-- KURULUM TAMAMLANDI
-- ============================================
-- Bu SQL'i Supabase SQL Editor'da çalıştırın
-- Mevcut verileriniz korunacaktır
-- ============================================
