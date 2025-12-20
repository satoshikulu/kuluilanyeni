-- Admin kullanıcısını users_min tablosunda güncelle (INSERT yerine UPDATE)

-- 1. Mevcut admin kaydını kontrol et
SELECT 
  'CURRENT ADMIN RECORD' as status,
  id,
  phone,
  full_name,
  status,
  created_at
FROM users_min 
WHERE id = '90e60080-523f-46f1-8d46-255bd8e286bc';

-- 2. Admin kullanıcısının telefon numarasını güncelle
UPDATE users_min 
SET 
  phone = '5556874803', -- Admin telefon numarası
  full_name = 'Admin User',
  status = 'approved',
  created_at = COALESCE(created_at, now()) -- Eğer null ise şimdi, değilse mevcut değeri koru
WHERE id = '90e60080-523f-46f1-8d46-255bd8e286bc';

-- 3. Güncellenmiş kaydı kontrol et
SELECT 
  'UPDATED ADMIN RECORD' as status,
  id,
  phone,
  full_name,
  status,
  created_at
FROM users_min 
WHERE id = '90e60080-523f-46f1-8d46-255bd8e286bc';

-- 4. Admin FCM token kaydını da güncelle
UPDATE fcm_tokens 
SET 
  phone = '5556874803', -- Admin telefon numarası
  updated_at = now()
WHERE user_id = '90e60080-523f-46f1-8d46-255bd8e286bc';

-- 5. Güncellenmiş FCM token kaydını kontrol et
SELECT 
  'UPDATED ADMIN FCM TOKEN' as status,
  user_id,
  phone,
  LENGTH(phone) as phone_length,
  CASE 
    WHEN phone = '5556874803' THEN 'CORRECT ✅'
    ELSE 'WRONG ❌'
  END as phone_status,
  token,
  updated_at
FROM fcm_tokens 
WHERE user_id = '90e60080-523f-46f1-8d46-255bd8e286bc';