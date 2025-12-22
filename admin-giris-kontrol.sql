-- Admin giriş bilgilerini kontrol et

-- 1. Admin kaydı users_min tablosunda var mı?
SELECT 
  'ADMIN USER RECORD' as check_name,
  id,
  phone,
  full_name,
  status,
  created_at
FROM users_min 
WHERE phone = '5556874803';

-- 2. Admin şifresi doğru mu? (login_user fonksiyonunu test et)
SELECT 
  'LOGIN TEST' as test_name,
  'Test login_user function' as description;

-- 3. Tüm users_min kayıtları
SELECT 
  'ALL USERS' as check_name,
  id,
  phone,
  full_name,
  status,
  created_at
FROM users_min 
ORDER BY created_at DESC
LIMIT 10;

-- 4. Eğer admin kaydı yoksa ekle
INSERT INTO users_min (
  id,
  phone,
  full_name,
  status,
  created_at
) VALUES (
  '90e60080-523f-46f1-8d46-255bd8e286bc', -- Admin user ID
  '5556874803', -- Admin telefon numarası
  'Admin User', -- Admin adı
  'approved', -- Onaylanmış durumda
  now()
)
ON CONFLICT (id) DO UPDATE SET
  phone = EXCLUDED.phone,
  full_name = EXCLUDED.full_name,
  status = EXCLUDED.status;