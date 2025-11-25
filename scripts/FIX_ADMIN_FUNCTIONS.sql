-- ============================================
-- ADMIN FONKSİYONLARINI DÜZELT
-- ============================================
-- Kullanıcı onaylama/reddetme fonksiyonları

-- 1. RLS'i kapat (geçici)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Kullanıcı onaylama fonksiyonu
CREATE OR REPLACE FUNCTION approve_user(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- Direkt güncelle (admin kontrolü yok - basit versiyon)
  UPDATE users
  SET 
    status = 'approved',
    approved_at = NOW(),
    approved_by = p_admin_id
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Kullanıcı bulunamadı'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Kullanıcı onaylandı'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Hata: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Kullanıcı reddetme fonksiyonu
CREATE OR REPLACE FUNCTION reject_user(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- Direkt güncelle
  UPDATE users
  SET status = 'rejected'
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Kullanıcı bulunamadı'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Kullanıcı reddedildi'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Hata: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Test sorguları
-- Kullanıcıları listele:
-- SELECT id, full_name, phone, status FROM users;

-- Kullanıcı onayla:
-- SELECT approve_user('user-id-buraya', '00000000-0000-0000-0000-000000000000');

-- Kullanıcı reddet:
-- SELECT reject_user('user-id-buraya', '00000000-0000-0000-0000-000000000000');

-- ============================================
-- NOTLAR:
-- ============================================
-- 1. RLS kapatıldı - test için
-- 2. Admin kontrolü yok - basit versiyon
-- 3. SECURITY DEFINER ile çalışıyor
-- 4. Production'da RLS'i tekrar açın ve admin kontrolü ekleyin
