-- ============================================
-- TELEFON NUMARASI DUPLICATE KONTROLÜ
-- ============================================
-- Bu script aynı telefon numarasıyla çoklu ilan vermeyi engeller

-- 1. ÖNCE: Mevcut duplicate kayıtları temizle (opsiyonel)
-- Eğer zaten duplicate kayıtlar varsa, önce bunları temizleyin:
/*
DELETE FROM listings a
USING listings b
WHERE a.id > b.id 
  AND a.owner_phone = b.owner_phone
  AND a.status = 'pending';
*/

-- 2. Telefon numarasını normalize eden function
-- (Boşlukları, tire ve parantezleri kaldırır)
CREATE OR REPLACE FUNCTION normalize_phone(phone TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Sadece rakamları al
  RETURN regexp_replace(phone, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Telefon numarası kontrolü için RPC function
CREATE OR REPLACE FUNCTION check_phone_exists(phone_number TEXT)
RETURNS TABLE(
  exists BOOLEAN,
  listing_count INTEGER,
  pending_count INTEGER,
  approved_count INTEGER
) AS $$
DECLARE
  normalized_phone TEXT;
BEGIN
  -- Telefonu normalize et
  normalized_phone := normalize_phone(phone_number);
  
  -- İstatistikleri döndür
  RETURN QUERY
  SELECT 
    COUNT(*) > 0 as exists,
    COUNT(*)::INTEGER as listing_count,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_count,
    COUNT(*) FILTER (WHERE status = 'approved')::INTEGER as approved_count
  FROM listings
  WHERE normalize_phone(owner_phone) = normalized_phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger: Yeni ilan eklenirken kontrol et
CREATE OR REPLACE FUNCTION prevent_duplicate_phone()
RETURNS TRIGGER AS $$
DECLARE
  normalized_new_phone TEXT;
  existing_count INTEGER;
  pending_count INTEGER;
BEGIN
  -- Yeni telefonu normalize et
  normalized_new_phone := normalize_phone(NEW.owner_phone);
  
  -- Aynı telefon numarasıyla kaç ilan var?
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending')
  INTO existing_count, pending_count
  FROM listings
  WHERE normalize_phone(owner_phone) = normalized_new_phone
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Eğer bekleyen ilan varsa, yeni ilan vermeyi engelle
  IF pending_count > 0 THEN
    RAISE EXCEPTION 'Bu telefon numarasıyla zaten bekleyen bir ilan var. Lütfen önceki ilanınızın onaylanmasını bekleyin.'
      USING HINT = 'Telefon: ' || NEW.owner_phone;
  END IF;
  
  -- Eğer 5'ten fazla aktif ilan varsa, uyar (ama engelleme)
  IF existing_count >= 5 THEN
    RAISE WARNING 'Bu telefon numarasıyla % adet ilan mevcut', existing_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger'ı listings tablosuna ekle
DROP TRIGGER IF EXISTS check_duplicate_phone_trigger ON listings;
CREATE TRIGGER check_duplicate_phone_trigger
  BEFORE INSERT OR UPDATE OF owner_phone
  ON listings
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_phone();

-- 6. İstatistik view'i (opsiyonel - admin için)
CREATE OR REPLACE VIEW phone_statistics AS
SELECT 
  normalize_phone(owner_phone) as normalized_phone,
  owner_phone as original_phone,
  owner_name,
  COUNT(*) as total_listings,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  MAX(created_at) as last_listing_date
FROM listings
GROUP BY normalize_phone(owner_phone), owner_phone, owner_name
HAVING COUNT(*) > 1
ORDER BY total_listings DESC;

-- 7. Test sorguları
-- Bir telefon numarasını kontrol et:
-- SELECT * FROM check_phone_exists('0555 123 45 67');

-- Duplicate telefon numaralarını listele:
-- SELECT * FROM phone_statistics;

-- ============================================
-- NOTLAR:
-- ============================================
-- 1. Bu script'i Supabase SQL Editor'da çalıştırın
-- 2. Trigger otomatik olarak çalışacak
-- 3. Frontend'de de kontrol ekleyeceğiz (kullanıcı deneyimi için)
-- 4. Admin panelinde phone_statistics view'ini kullanabilirsiniz
