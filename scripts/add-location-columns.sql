-- Mevcut listings tablosuna konum kolonlarını ekle
-- Bu script'i Supabase SQL Editor'da çalıştırın

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'address' CHECK (location_type IN ('address', 'coordinates'));

-- İndeksler ekle
CREATE INDEX IF NOT EXISTS idx_listings_latitude ON public.listings(latitude);
CREATE INDEX IF NOT EXISTS idx_listings_longitude ON public.listings(longitude);

-- Başarılı mesajı
SELECT 'Konum kolonları başarıyla eklendi!' as message;
