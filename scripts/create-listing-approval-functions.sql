-- ============================================
-- LISTING APPROVAL/REJECTION FUNCTIONS
-- ============================================
-- İlan onaylama/reddetme fonksiyonları
-- Admin kullanıcılarının RLS politikalarını bypass ederek
-- ilanları onaylamasını ve reddetmesini sağlar

-- 1. İlan onaylama fonksiyonu
CREATE OR REPLACE FUNCTION approve_listing(
  p_listing_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- İlanı onayla: status = 'approved' ve approved_at timestamp'ini set et
  UPDATE listings
  SET 
    status = 'approved',
    approved_at = NOW()
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
    'message', 'İlan onaylandı'
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

-- 2. İlan reddetme fonksiyonu
CREATE OR REPLACE FUNCTION reject_listing(
  p_listing_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- İlanı reddet: status = 'rejected' ve approved_at'i temizle
  UPDATE listings
  SET 
    status = 'rejected',
    approved_at = NULL
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
    'message', 'İlan reddedildi'
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
-- SELECT id, title, status, approved_at FROM listings;

-- İlan onayla:
-- SELECT approve_listing('listing-id-buraya', '00000000-0000-0000-0000-000000000000');

-- İlan reddet:
-- SELECT reject_listing('listing-id-buraya', '00000000-0000-0000-0000-000000000000');

-- ============================================
-- NOTLAR:
-- ============================================
-- 1. SECURITY DEFINER ile çalışır - RLS politikalarını bypass eder
-- 2. Her iki fonksiyon da JSON döndürür: {success: boolean, message/error: string}
-- 3. approve_listing: status'u 'approved' yapar ve approved_at timestamp'ini set eder
-- 4. reject_listing: status'u 'rejected' yapar ve approved_at'i NULL yapar
-- 5. İlan bulunamazsa veya hata oluşursa success: false döner
-- 6. Admin ID parametresi gelecekte audit trail için kullanılabilir
-- 7. Bu fonksiyonlar AdminPage.tsx'den supabase.rpc() ile çağrılacak

