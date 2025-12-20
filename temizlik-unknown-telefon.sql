-- Unknown telefon kayıtlarını temizle ve kontrol et

-- 1. Mevcut durumu kontrol et
SELECT 
  'BEFORE CLEANUP' as status,
  phone,
  LENGTH(phone) as phone_length,
  COUNT(*) as count
FROM fcm_tokens 
GROUP BY phone, LENGTH(phone)
ORDER BY phone;

-- 2. Unknown/boş telefon kayıtlarını sil
DELETE FROM fcm_tokens 
WHERE phone = '' 
   OR phone = 'unknown' 
   OR phone IS NULL 
   OR LENGTH(phone) < 10;

-- 3. Temizlik sonrası durumu kontrol et
SELECT 
  'AFTER CLEANUP' as status,
  phone,
  LENGTH(phone) as phone_length,
  COUNT(*) as count
FROM fcm_tokens 
GROUP BY phone, LENGTH(phone)
ORDER BY phone;

-- 4. Geçerli telefon formatlarını kontrol et
SELECT 
  phone,
  user_id,
  CASE 
    WHEN phone ~ '^[0-9]{10}$' THEN 'VALID ✅'
    ELSE 'INVALID ❌'
  END as phone_status,
  token
FROM fcm_tokens 
ORDER BY phone;

-- 5. Users tablosundaki telefon formatlarını kontrol et
SELECT 
  'USERS TABLE' as table_name,
  phone,
  LENGTH(phone) as phone_length,
  CASE 
    WHEN phone ~ '^[0-9]{10}$' THEN 'NORMALIZED ✅'
    WHEN phone IS NULL THEN 'NULL ❌'
    ELSE 'NEEDS NORMALIZATION ❌'
  END as status,
  COUNT(*) as count
FROM users 
WHERE phone IS NOT NULL
GROUP BY phone, LENGTH(phone)
ORDER BY phone
LIMIT 10;

-- 6. Eğer users tablosunda normalize edilmemiş telefonlar varsa düzelt
-- UPDATE users 
-- SET phone = RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10)
-- WHERE phone IS NOT NULL AND phone !~ '^[0-9]{10}$';