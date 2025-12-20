-- Telefon formatlarını kontrol et ve normalize et

-- 1. FCM tokens tablosundaki telefon formatlarını kontrol et
SELECT 
  phone, 
  LENGTH(phone) as phone_length,
  CASE 
    WHEN phone ~ '^[0-9]{10}$' THEN 'NORMALIZED ✅'
    ELSE 'NEEDS NORMALIZATION ❌'
  END as status,
  token
FROM fcm_tokens 
ORDER BY phone;

-- 2. Listings tablosundaki owner_phone formatlarını kontrol et
SELECT 
  owner_phone, 
  LENGTH(owner_phone) as phone_length,
  CASE 
    WHEN owner_phone ~ '^[0-9]{10}$' THEN 'NORMALIZED ✅'
    ELSE 'NEEDS NORMALIZATION ❌'
  END as status,
  title
FROM listings 
WHERE owner_phone IS NOT NULL 
ORDER BY owner_phone
LIMIT 10;

-- 3. Users tablosundaki phone formatlarını kontrol et
SELECT 
  phone, 
  LENGTH(phone) as phone_length,
  CASE 
    WHEN phone ~ '^[0-9]{10}$' THEN 'NORMALIZED ✅'
    ELSE 'NEEDS NORMALIZATION ❌'
  END as status,
  full_name
FROM users 
WHERE phone IS NOT NULL 
ORDER BY phone
LIMIT 10;

-- 4. Eğer normalize edilmemiş telefonlar varsa, bunları düzelt:

-- FCM tokens tablosunu normalize et
-- UPDATE fcm_tokens 
-- SET phone = RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10)
-- WHERE phone !~ '^[0-9]{10}$';

-- Listings tablosunu normalize et
-- UPDATE listings 
-- SET owner_phone = RIGHT(REGEXP_REPLACE(owner_phone, '[^0-9]', '', 'g'), 10)
-- WHERE owner_phone IS NOT NULL AND owner_phone !~ '^[0-9]{10}$';

-- Users tablosunu normalize et
-- UPDATE users 
-- SET phone = RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10)
-- WHERE phone IS NOT NULL AND phone !~ '^[0-9]{10}$';

-- 5. Test için: 5453526056 numarası için FCM token var mı?
SELECT 
  'FCM Token Check' as test_name,
  phone,
  token,
  CASE 
    WHEN token IS NOT NULL THEN 'TOKEN FOUND ✅'
    ELSE 'NO TOKEN ❌'
  END as result
FROM fcm_tokens 
WHERE phone = '5453526056';