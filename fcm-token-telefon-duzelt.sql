-- FCM tokens tablosundaki boş telefon numarasını düzelt

-- 1. Mevcut durumu kontrol et
SELECT 
  'BEFORE UPDATE' as status,
  user_id,
  phone,
  LENGTH(phone) as phone_length,
  CASE 
    WHEN phone = '' THEN 'EMPTY ❌'
    WHEN phone IS NULL THEN 'NULL ❌'
    WHEN LENGTH(phone) = 10 THEN 'VALID ✅'
    ELSE 'INVALID ❌'
  END as phone_status,
  token
FROM fcm_tokens 
WHERE user_id = '90e60080-523f-46f1-8d46-255bd8e286bc';

-- 2. Admin kullanıcısının telefon numarasını güncelle
UPDATE fcm_tokens 
SET 
  phone = '5556874803', -- Admin telefon numarası (DÜZELTME)
  updated_at = now()
WHERE user_id = '90e60080-523f-46f1-8d46-255bd8e286bc'
  AND (phone = '' OR phone IS NULL);

-- 3. Güncellenmiş durumu kontrol et
SELECT 
  'AFTER UPDATE' as status,
  user_id,
  phone,
  LENGTH(phone) as phone_length,
  CASE 
    WHEN phone = '' THEN 'EMPTY ❌'
    WHEN phone IS NULL THEN 'NULL ❌'
    WHEN LENGTH(phone) = 10 THEN 'VALID ✅'
    ELSE 'INVALID ❌'
  END as phone_status,
  token
FROM fcm_tokens 
WHERE user_id = '90e60080-523f-46f1-8d46-255bd8e286bc';

-- 4. Test sorgusu - Üye için bildirim gönderme testi
SELECT 
  'MEMBER NOTIFICATION TEST' as test_name,
  phone,
  token,
  'TOKEN FOUND FOR MEMBER ✅' as result
FROM fcm_tokens 
WHERE phone = '5453526056'; -- Üye telefon numarası

-- 5. Tüm boş telefon kayıtlarını kontrol et
SELECT 
  'ALL EMPTY PHONES' as status,
  user_id,
  phone,
  LENGTH(phone) as phone_length,
  updated_at
FROM fcm_tokens 
WHERE phone = '' OR phone IS NULL;