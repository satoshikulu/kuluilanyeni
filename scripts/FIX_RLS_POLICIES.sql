-- ============================================
-- RLS POLİTİKALARINI DÜZELT
-- ============================================
-- Admin'in kullanıcıları güncelleyebilmesi için

-- 1. Önce mevcut politikaları kaldır
DROP POLICY IF EXISTS "Herkes kayıt olabilir" ON users;
DROP POLICY IF EXISTS "Kullanıcı kendi bilgilerini görebilir" ON users;
DROP POLICY IF EXISTS "Admin tüm işlemleri yapabilir" ON users;

-- 2. RLS'i geçici olarak kapat (test için)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. Test: Manuel güncelleme
-- UPDATE users SET status = 'approved', approved_at = NOW() WHERE phone = '5551234567';

-- 4. Eğer çalışıyorsa, RLS'i tekrar aç ve doğru politikalar ekle
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. Yeni politikalar (daha basit)
-- Herkes okuyabilir
CREATE POLICY "Herkes okuyabilir"
ON users FOR SELECT
USING (true);

-- Herkes kayıt olabilir
CREATE POLICY "Herkes kayıt olabilir"
ON users FOR INSERT
WITH CHECK (true);

-- Herkes güncelleyebilir (geçici - test için)
CREATE POLICY "Herkes güncelleyebilir"
ON users FOR UPDATE
USING (true);

-- ============================================
-- NOTLAR:
-- ============================================
-- 1. Bu geçici bir çözüm - test için
-- 2. Production'da daha güvenli politikalar kullanın
-- 3. Eğer hala çalışmazsa RLS'i tamamen kapatın:
--    ALTER TABLE users DISABLE ROW LEVEL SECURITY;
