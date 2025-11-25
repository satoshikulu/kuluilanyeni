-- ============================================
-- AUTH FONKSİYONLARINI DÜZELT
-- ============================================
-- Eğer giriş yaparken sorun yaşıyorsanız bu script'i çalıştırın

-- 1. Kayıt fonksiyonunu düzelt
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

-- 2. Giriş fonksiyonunu düzelt
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

-- 3. Test sorguları
-- Kayıt testi:
-- SELECT register_user('Test Kullanıcı', '5551234567', 'test123');

-- Giriş testi:
-- SELECT login_user('5551234567', 'test123');

-- Kullanıcıları listele:
-- SELECT id, full_name, phone, password_hash, status, role FROM users;

-- ============================================
-- NOTLAR:
-- ============================================
-- 1. Bu script'i Supabase SQL Editor'da çalıştırın
-- 2. Mevcut fonksiyonları güncelleyecek
-- 3. Test sorgularını yorumdan çıkarıp test edebilirsiniz
