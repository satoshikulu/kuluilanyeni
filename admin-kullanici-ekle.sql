-- Admin kullanıcısını users tablosuna ekle

-- 1. Önce mevcut durumu kontrol et
SELECT 
  'AUTH USERS' as table_name,
  id,
  email,
  phone,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'satoshinakamototokyo42@gmail.com';

-- 2. Users tablosunda admin var mı kontrol et
SELECT 
  'USERS TABLE' as table_name,
  id,
  email,
  phone,
  full_name
FROM users 
WHERE email = 'satoshinakamototokyo42@gmail.com';

-- 3. Admin kullanıcısını users tablosuna ekle (eğer yoksa)
INSERT INTO users (
  id,
  email,
  phone,
  full_name,
  role,
  status,
  created_at,
  updated_at
) 
SELECT 
  id,
  email,
  COALESCE(phone, '5453526056') as phone, -- Admin telefon numarası
  'Admin User' as full_name,
  'admin' as role,
  'approved' as status,
  now() as created_at,
  now() as updated_at
FROM auth.users 
WHERE email = 'satoshinakamototokyo42@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'satoshinakamototokyo42@gmail.com'
  );

-- 4. Sonucu kontrol et
SELECT 
  'AFTER INSERT' as status,
  id,
  email,
  phone,
  full_name,
  role,
  status
FROM users 
WHERE email = 'satoshinakamototokyo42@gmail.com';

-- 5. FCM tokens tablosunu da kontrol et
SELECT 
  'FCM TOKENS' as table_name,
  user_id,
  phone,
  token,
  updated_at
FROM fcm_tokens 
WHERE user_id = '90e60080-523f-46f1-8d46-255bd8e286bc';