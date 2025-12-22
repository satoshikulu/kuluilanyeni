-- Listings tablosu şemasını kontrol et

-- 1. Listings tablosu kolonlarını göster
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'listings' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Listings tablosundan örnek kayıt
SELECT * FROM public.listings LIMIT 1;