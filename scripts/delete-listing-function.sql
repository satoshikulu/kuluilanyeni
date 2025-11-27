-- ============================================
-- LISTING DELETE FUNCTION
-- ============================================
-- İlan silme fonksiyonu
-- Admin kullanıcılarının RLS politikalarını bypass ederek
-- ilanları kalıcı olarak silmesini sağlar

CREATE OR REPLACE FUNCTION delete_listing(
  p_listing_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- İlanı sil
  DELETE FROM listings
  WHERE id = p_listing_id;
  
  -- İlan bulunamadıysa hata döndür
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'İlan bulunamadı'
    );
  END IF;
  
  -- Başarılı sonuç döndür
  RETURN json_build_object(
    'success', true,
    'message', 'İlan başarıyla silindi'
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

-- İlanları listele:
-- SELECT id, title, status FROM listings;

-- İlan sil:
-- SELECT delete_listing('listing-id-buraya', '00000000-0000-0000-0000-000000000000');

-- ============================================
-- NOTLAR:
-- ============================================
-- 1. SECURITY DEFINER ile çalışır - RLS politikalarını bypass eder
-- 2. Fonksiyon JSON döndürür: {success: boolean, message/error: string}
-- 3. İlan kalıcı olarak silinir (geri alınamaz)
-- 4. İlan bulunamazsa veya hata oluşursa success: false döner
-- 5. Admin ID parametresi gelecekte audit trail için kullanılabilir
-- 6. Bu fonksiyon AdminPage.tsx'den supabase.rpc() ile çağrılacak
