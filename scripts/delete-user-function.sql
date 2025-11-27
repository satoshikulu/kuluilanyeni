-- ============================================
-- USER DELETE FUNCTION
-- ============================================
-- Kullanıcı silme fonksiyonu
-- Admin kullanıcılarının RLS politikalarını bypass ederek
-- kullanıcıları kalıcı olarak silmesini sağlar

CREATE OR REPLACE FUNCTION delete_user(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_listing_count INTEGER;
BEGIN
  -- Kullanıcının kaç ilanı olduğunu say
  SELECT COUNT(*) INTO v_listing_count
  FROM listings
  WHERE owner_phone = (SELECT phone FROM users WHERE id = p_user_id);
  
  -- Önce kullanıcının tüm ilanlarını sil
  DELETE FROM listings
  WHERE owner_phone = (SELECT phone FROM users WHERE id = p_user_id);
  
  -- Sonra kullanıcıyı sil
  DELETE FROM users
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
    'message', 'Kullanıcı ve ' || v_listing_count || ' ilanı başarıyla silindi',
    'deleted_listings', v_listing_count
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

-- Kullanıcı sil:
-- SELECT delete_user('user-id-buraya', '00000000-0000-0000-0000-000000000000');

-- ============================================
-- NOTLAR:
-- ============================================
-- 1. SECURITY DEFINER ile çalışır - RLS politikalarını bypass eder
-- 2. Fonksiyon JSON döndürür: {success: boolean, message/error: string, deleted_listings: number}
-- 3. Kullanıcı kalıcı olarak silinir (geri alınamaz)
-- 4. Kullanıcının TÜM ilanları da otomatik silinir
-- 5. Kullanıcı bulunamazsa veya hata oluşursa success: false döner
-- 6. Admin ID parametresi gelecekte audit trail için kullanılabilir
-- 7. Bu fonksiyon AdminPage.tsx'den supabase.rpc() ile çağrılacak
-- 8. Silinen ilan sayısı response'da döndürülür
