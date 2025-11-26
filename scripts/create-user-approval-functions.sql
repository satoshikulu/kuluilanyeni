-- ============================================
-- USER APPROVAL/REJECTION FUNCTIONS
-- ============================================
-- Kullanıcı onaylama/reddetme fonksiyonları
-- Admin kullanıcılarının RLS politikalarını bypass ederek
-- kullanıcıları onaylamasını ve reddetmesini sağlar

-- 1. Kullanıcı onaylama fonksiyonu
CREATE OR REPLACE FUNCTION approve_user(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- Kullanıcıyı onayla: status = 'approved'
  UPDATE users
  SET 
    status = 'approved'
  WHERE id = p_user_id;
  
  -- Kullanıcı bulunamadıysa hata döndür
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Kullanıcı bulunamadı'
    );
  END IF;
  
  -- Başarılı sonuç döndür
  RETURN json_build_object(
    'success', true,
    'message', 'Kullanıcı onaylandı'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Hata durumunda detaylı hata mesajı döndür
    RETURN json_build_object(
      'success', false,
      'error', 'Hata: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Kullanıcı reddetme fonksiyonu
CREATE OR REPLACE FUNCTION reject_user(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- Kullanıcıyı reddet: status = 'rejected'
  UPDATE users
  SET 
    status = 'rejected'
  WHERE id = p_user_id;
  
  -- Kullanıcı bulunamadıysa hata döndür
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Kullanıcı bulunamadı'
    );
  END IF;
  
  -- Başarılı sonuç döndür
  RETURN json_build_object(
    'success', true,
    'message', 'Kullanıcı reddedildi'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Hata durumunda detaylı hata mesajı döndür
    RETURN json_build_object(
      'success', false,
      'error', 'Hata: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TEST SORULARI
-- ============================================

-- Kullanıcıları listele:
-- SELECT id, full_name, phone, status FROM users;

-- Kullanıcı onayla:
-- SELECT approve_user('user-id-buraya', '00000000-0000-0000-0000-000000000000');

-- Kullanıcı reddet:
-- SELECT reject_user('user-id-buraya', '00000000-0000-0000-0000-000000000000');

-- ============================================
-- NOTLAR:
-- ============================================
-- 1. SECURITY DEFINER ile çalışır - RLS politikalarını bypass eder
-- 2. Her iki fonksiyon da JSON döndürür: {success: boolean, message/error: string}
-- 3. approve_user: status'u 'approved' yapar
-- 4. reject_user: status'u 'rejected' yapar
-- 5. Kullanıcı bulunamazsa veya hata oluşursa success: false döner
-- 6. Admin ID parametresi gelecekte audit trail için kullanılabilir
-- 7. Bu fonksiyonlar AdminPage.tsx'den supabase.rpc() ile çağrılacak
-- 8. Admin role check KALDIRILDI - sadece SECURITY DEFINER ile RLS bypass yapılıyor
