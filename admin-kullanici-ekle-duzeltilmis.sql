-- Admin kullanıcısını users_min tablosuna ekle

-- 1. Önce mevcut durumu kontrol et
SELECT 
  'AUTH USERS' as table_name,
  id,
  email,
  phone,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'satoshinakamototokyo42@gmail.com';

-- 2. Users_min tablosunda admin var mı kontrol et
SELECT 
  'USERS_MIN TABLE' as table_name,
  id,
  phone,
  full_name,
  status
FROM users_min 
WHERE phone = '5556874803';

-- 3. Admin kullanıcısını users_min tablosuna ekle (eğer yoksa)
INSERT INTO users_min (
  id,
  phone,
  full_name,
  status,
  created_at
) 
VALUES (
  '90e60080-523f-46f1-8d46-255bd8e286bc', -- Admin user ID
  '5556874803', -- Admin telefon numarası (DÜZELTME)
  'Admin User', -- Admin adı
  'approved', -- Onaylanmış durumda
  now()
)
ON CONFLICT (phone) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  status = EXCLUDED.status;

-- 4. Sonucu kontrol et
SELECT 
  'AFTER INSERT' as status,
  id,
  phone,
  full_name,
  status
FROM users_min 
WHERE phone = '5556874803'; -- Admin telefon numarası

-- 5. FCM tokens tablosunu da kontrol et
SELECT 
  'FCM TOKENS' as table_name,
  user_id,
  phone,
  token,
  updated_at
FROM fcm_tokens 
WHERE user_id = '90e60080-523f-46f1-8d46-255bd8e286bc';