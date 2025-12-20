-- Üye için test FCM token ekle

-- 1. Önce tüm FCM token kayıtlarını kontrol et
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
  LEFT(token, 20) || '...' as token_preview,
  updated_at
FROM fcm_tokens 
ORDER BY updated_at DESC;

-- 2. Üye için test FCM token ekle
INSERT INTO fcm_tokens (
  user_id,
  phone,
  token,
  updated_at
) VALUES (
  gen_random_uuid(), -- Test user ID
  '5453526056', -- Üye telefon numarası
  'test-fcm-token-for-member-5453526056', -- Test token
  now()
)
ON CONFLICT (user_id) DO UPDATE SET
  phone = EXCLUDED.phone,
  token = EXCLUDED.token,
  updated_at = EXCLUDED.updated_at;

-- 3. Eklenen kaydı kontrol et
SELECT 
  'ADDED MEMBER FCM TOKEN' as status,
  user_id,
  phone,
  CASE 
    WHEN phone = '5453526056' THEN 'CORRECT ✅'
    ELSE 'WRONG ❌'
  END as phone_status,
  token,
  updated_at
FROM fcm_tokens 
WHERE phone = '5453526056';

-- 4. Edge function test sorgusu
SELECT 
  'EDGE FUNCTION TEST' as test_name,
  phone,
  token,
  'TOKEN FOUND FOR MEMBER ✅' as result
FROM fcm_tokens 
WHERE phone = '5453526056';