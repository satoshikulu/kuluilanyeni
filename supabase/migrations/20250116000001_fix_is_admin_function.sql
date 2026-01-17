-- ============================================
-- FIX: is_admin() fonksiyonunu güncelle
-- ============================================
-- simple_users tablosunu da kontrol etsin
-- ============================================

-- Admin kontrolü için yardımcı fonksiyon (güncellenmiş)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Önce profiles tablosunda kontrol et (eski sistem)
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- simple_users tablosunda da kontrol et (yeni sistem)
  -- NOT: auth.uid() NULL olabilir (simpleAuth kullanıyoruz)
  -- Bu durumda her zaman FALSE döner, bu normal
  IF EXISTS (
    SELECT 1 FROM public.simple_users 
    WHERE id = auth.uid() AND role = 'admin' AND status = 'approved'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
