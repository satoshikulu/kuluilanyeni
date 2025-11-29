-- Listings tablosuna user_id kolonu ekle
-- Bu kolon, ilanın hangi üye tarafından verildiğini takip eder

-- user_id kolonu ekle (nullable - çünkü eski ilanlar ve üye olmayan ilanlar var)
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);

-- requires_membership kolonu ekle (üyelik gerektiriyor mu?)
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS requires_membership BOOLEAN DEFAULT false;

COMMENT ON COLUMN listings.user_id IS 'İlanı veren üyenin ID si (null ise üye değil)';
COMMENT ON COLUMN listings.requires_membership IS 'İlanın yayınlanması için üyelik gerekiyor mu?';

-- Mevcut ilanları güncelle: owner_phone ile users tablosunu eşleştir
UPDATE listings l
SET user_id = u.id
FROM users u
WHERE l.owner_phone = u.phone
AND l.user_id IS NULL;

-- İstatistik: Kaç ilan üyeli, kaç ilan üyesiz?
SELECT 
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as member_listings,
  COUNT(*) FILTER (WHERE user_id IS NULL) as non_member_listings,
  COUNT(*) as total_listings
FROM listings;
