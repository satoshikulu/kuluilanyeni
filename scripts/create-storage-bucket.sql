-- Storage Bucket Oluşturma
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- Bucket oluştur (eğer yoksa)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'listings.images',
    'listings.images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880;

-- Storage RLS Politikalarını oluştur
-- Herkes görselleri görebilir
DROP POLICY IF EXISTS "listings_images_select_policy" ON storage.objects;
CREATE POLICY "listings_images_select_policy" ON storage.objects
    FOR SELECT USING (bucket_id = 'listings.images');

-- Herkes görsel yükleyebilir
DROP POLICY IF EXISTS "listings_images_insert_policy" ON storage.objects;
CREATE POLICY "listings_images_insert_policy" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'listings.images');

-- Herkes görsel güncelleyebilir
DROP POLICY IF EXISTS "listings_images_update_policy" ON storage.objects;
CREATE POLICY "listings_images_update_policy" ON storage.objects
    FOR UPDATE USING (bucket_id = 'listings.images');

-- Herkes görsel silebilir (admin için)
DROP POLICY IF EXISTS "listings_images_delete_policy" ON storage.objects;
CREATE POLICY "listings_images_delete_policy" ON storage.objects
    FOR DELETE USING (bucket_id = 'listings.images');

-- Başarılı mesajı
SELECT 'Storage bucket başarıyla oluşturuldu!' as message;
