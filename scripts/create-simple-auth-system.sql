-- ============================================
-- BASİT ÜYELİK SİSTEMİ
-- ============================================
-- Ad-Soyad + Telefon + Şifre ile kayıt
-- Admin onayı sonrası giriş yapabilir

-- 1. Users tablosunu güncelle (eğer yoksa oluştur)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  last_login_at TIMESTAMPTZ
);

-- 2. Telefon numarasına index
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 3. Updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Kullanıcı kaydı için RPC function
CREATE OR REPLACE FUNCTION register_user(
  p_full_name TEXT,
  p_phone TEXT,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_normalized_phone TEXT;
  v_existing_user RECORD;
BEGIN
  -- Telefonu normalize et
  v_normalized_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
  
  -- Validasyon
  IF LENGTH(TRIM(p_full_name)) < 3 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ad soyad en az 3 karakter olmalıdır'
    );
  END IF;
  
  IF LENGTH(v_normalized_phone) < 10 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Geçerli bir telefon numarası girin'
    );
  END IF;
  
  IF LENGTH(p_password) < 4 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Şifre en az 4 karakter olmalıdır'
    );
  END IF;
  
  -- Telefon numarası daha önce kullanılmış mı?
  SELECT * INTO v_existing_user
  FROM users
  WHERE phone = v_normalized_phone;
  
  IF FOUND THEN
    IF v_existing_user.status = 'pending' THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Bu telefon numarasıyla kayıt zaten mevcut. Admin onayı bekleniyor.'
      );
    ELSIF v_existing_user.status = 'approved' THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Bu telefon numarası zaten kayıtlı. Giriş yapabilirsiniz.'
      );
    ELSIF v_existing_user.status = 'rejected' THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Bu telefon numarası ile kayıt reddedilmiş. Lütfen farklı bir numara kullanın.'
      );
    END IF;
  END IF;
  
  -- Yeni kullanıcı oluştur
  -- NOT: Gerçek uygulamada şifre hash'lenmeli (bcrypt, argon2 vb.)
  -- Şimdilik basit tutuyoruz, frontend'de hash'leyeceğiz
  INSERT INTO users (full_name, phone, password_hash, status)
  VALUES (TRIM(p_full_name), v_normalized_phone, p_password, 'pending')
  RETURNING id INTO v_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Kayıt başarılı! Admin onayından sonra giriş yapabilirsiniz.',
    'user_id', v_user_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Kayıt sırasında bir hata oluştu: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Giriş için RPC function
CREATE OR REPLACE FUNCTION login_user(
  p_phone TEXT,
  p_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_normalized_phone TEXT;
BEGIN
  -- Telefonu normalize et
  v_normalized_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
  
  -- Kullanıcıyı bul
  SELECT * INTO v_user
  FROM users
  WHERE phone = v_normalized_phone;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Telefon numarası veya şifre hatalı'
    );
  END IF;
  
  -- Şifre kontrolü
  IF v_user.password_hash != p_password THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Telefon numarası veya şifre hatalı'
    );
  END IF;
  
  -- Durum kontrolü
  IF v_user.status = 'pending' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Hesabınız henüz onaylanmadı. Lütfen admin onayını bekleyin.'
    );
  ELSIF v_user.status = 'rejected' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Hesabınız reddedilmiş. Lütfen yönetici ile iletişime geçin.'
    );
  END IF;
  
  -- Son giriş zamanını güncelle
  UPDATE users
  SET last_login_at = NOW()
  WHERE id = v_user.id;
  
  -- Başarılı giriş
  RETURN json_build_object(
    'success', true,
    'message', 'Giriş başarılı!',
    'user', json_build_object(
      'id', v_user.id,
      'full_name', v_user.full_name,
      'phone', v_user.phone,
      'role', v_user.role,
      'status', v_user.status
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Giriş sırasında bir hata oluştu: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Admin: Kullanıcı onaylama
CREATE OR REPLACE FUNCTION approve_user(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_admin RECORD;
  v_user RECORD;
BEGIN
  -- Admin kontrolü
  SELECT * INTO v_admin FROM users WHERE id = p_admin_id;
  
  IF NOT FOUND OR v_admin.role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Yetkiniz yok'
    );
  END IF;
  
  -- Kullanıcıyı bul
  SELECT * INTO v_user FROM users WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Kullanıcı bulunamadı'
    );
  END IF;
  
  -- Onayla
  UPDATE users
  SET 
    status = 'approved',
    approved_at = NOW(),
    approved_by = p_admin_id
  WHERE id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Kullanıcı onaylandı'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Admin: Kullanıcı reddetme
CREATE OR REPLACE FUNCTION reject_user(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_admin RECORD;
BEGIN
  -- Admin kontrolü
  SELECT * INTO v_admin FROM users WHERE id = p_admin_id;
  
  IF NOT FOUND OR v_admin.role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Yetkiniz yok'
    );
  END IF;
  
  -- Reddet
  UPDATE users
  SET status = 'rejected'
  WHERE id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Kullanıcı reddedildi'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. İlk admin kullanıcısını oluştur (eğer yoksa)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin') THEN
    INSERT INTO users (full_name, phone, password_hash, status, role, approved_at)
    VALUES ('Admin', '5556874803', 'admin123', 'approved', 'admin', NOW());
    
    RAISE NOTICE 'İlk admin kullanıcısı oluşturuldu:';
    RAISE NOTICE 'Telefon: 5556874803';
    RAISE NOTICE 'Şifre: admin123';
    RAISE NOTICE 'LÜTFEN ŞİFREYİ DEĞİŞTİRİN!';
  END IF;
END $$;

-- 9. RLS Politikaları
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Herkes kayıt olabilir (insert)
CREATE POLICY "Herkes kayıt olabilir"
ON users FOR INSERT
WITH CHECK (true);

-- Sadece kendi bilgilerini görebilir
CREATE POLICY "Kullanıcı kendi bilgilerini görebilir"
ON users FOR SELECT
USING (true); -- Şimdilik herkese açık, sonra auth eklenince düzenlenecek

-- Sadece admin tüm kullanıcıları görebilir ve güncelleyebilir
CREATE POLICY "Admin tüm işlemleri yapabilir"
ON users FOR ALL
USING (role = 'admin');

-- 10. Test sorguları
-- Kayıt testi:
-- SELECT register_user('Ahmet Yılmaz', '0555 123 45 67', 'sifre123');

-- Giriş testi:
-- SELECT login_user('5551234567', 'sifre123');

-- Bekleyen kullanıcıları listele:
-- SELECT id, full_name, phone, created_at FROM users WHERE status = 'pending' ORDER BY created_at DESC;

-- ============================================
-- NOTLAR:
-- ============================================
-- 1. Bu basit bir auth sistemidir
-- 2. Şifreler şu an plain text (frontend'de hash'lenecek)
-- 3. Session yönetimi localStorage ile yapılacak
-- 4. Production'da daha güvenli bir sistem kullanın
-- 5. İlk admin: Telefon: 5556874803, Şifre: admin123
