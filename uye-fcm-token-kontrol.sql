-- Üye (5453526056) için FCM token kontrolü

-- 1. Üyenin FCM token'ı var mı?
SELECT 
  'MEMBER FCM TOKEN' as check_name,
  user_id,
  phone,
  LENGTH(phone) as phone_length,
  CASE 
    WHEN phone = '5453526056' THEN 'CORRECT ✅'
    ELSE 'WRONG ❌'
  END as phone_status,
  token,
  updated_at
FROM fcm_tokens 
WHERE phone = '5453526056';

-- 2. Üyenin users_min kaydı var mı?
SELECT 
  'MEMBER USERS_MIN' as check_name,
  id,
  phone,
  full_name,
  status,
  created_at
FROM users_min 
WHERE phone = '5453526056';

-- 3. Tüm FCM token kayıtları
SELECT 
  'ALL FCM TOKENS' as check_name,
  user_id,
  phone,
  LENGTH(phone) as phone_length,
  CASE 
    WHEN phone = '' THEN 'EMPTY ❌'
    WHEN phone IS NULL THEN 'NULL ❌'
    WHEN LENGTH(phone) = 10 THEN 'VALID ✅'
    ELSE 'INVALID ❌'
  END as phone_status,
  updated_at
FROM fcm_tokens 
ORDER BY updated_at DESC;

-- 4. Admin FCM token kontrolü
SELECT 
  'ADMIN FCM TOKEN' as check_name,
  user_id,
  phone,
  CASE 
    WHEN phone = '5556874803' THEN 'CORRECT ✅'
    ELSE 'WRONG ❌'
  END as phone_status,
  token,
  updated_at
FROM fcm_tokens 
WHERE user_id = '90e60080-523f-46f1-8d46-255bd8e286bc';