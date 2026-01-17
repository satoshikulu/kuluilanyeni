-- ============================================
-- FIX: Admin RPC fonksiyonlarını güncelle
-- ============================================
-- p_admin_id parametresini kullanarak admin kontrolü yapsın
-- ============================================

-- Admin kontrolü için yardımcı fonksiyon (parametre ile)
CREATE OR REPLACE FUNCTION is_admin_by_id(p_admin_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- simple_users tablosunda kontrol et
  IF EXISTS (
    SELECT 1 FROM public.simple_users 
    WHERE id = p_admin_id AND role = 'admin' AND status = 'approved'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- profiles tablosunda da kontrol et (fallback)
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_admin_id AND role = 'admin' AND status = 'approved'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- İlan onaylama fonksiyonu (güncellenmiş)
CREATE OR REPLACE FUNCTION approve_listing(
  p_listing_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_listing RECORD;
BEGIN
  -- Admin kontrolü (parametre ile)
  IF NOT is_admin_by_id(p_admin_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Yetkisiz erişim'
    );
  END IF;

  -- İlan güncelleme
  UPDATE public.listings 
  SET 
    status = 'approved',
    approved_at = NOW()
  WHERE id = p_listing_id
  RETURNING * INTO v_listing;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'İlan bulunamadı'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'İlan başarıyla onaylandı',
    'listing', row_to_json(v_listing)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- İlan reddetme fonksiyonu (güncellenmiş)
CREATE OR REPLACE FUNCTION reject_listing(
  p_listing_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_listing RECORD;
BEGIN
  -- Admin kontrolü (parametre ile)
  IF NOT is_admin_by_id(p_admin_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Yetkisiz erişim'
    );
  END IF;

  -- İlan güncelleme
  UPDATE public.listings 
  SET status = 'rejected'
  WHERE id = p_listing_id
  RETURNING * INTO v_listing;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'İlan bulunamadı'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'İlan reddedildi',
    'listing', row_to_json(v_listing)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- İlan silme fonksiyonu (güncellenmiş)
CREATE OR REPLACE FUNCTION delete_listing(
  p_listing_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_listing RECORD;
BEGIN
  -- Admin kontrolü (parametre ile)
  IF NOT is_admin_by_id(p_admin_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Yetkisiz erişim'
    );
  END IF;

  -- İlan bilgilerini al
  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'İlan bulunamadı'
    );
  END IF;

  -- İlan silme
  DELETE FROM public.listings WHERE id = p_listing_id;

  RETURN json_build_object(
    'success', true,
    'message', 'İlan başarıyla silindi',
    'listing', row_to_json(v_listing)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcı onaylama fonksiyonu (güncellenmiş)
CREATE OR REPLACE FUNCTION approve_user(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Admin kontrolü (parametre ile)
  IF NOT is_admin_by_id(p_admin_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Yetkisiz erişim'
    );
  END IF;

  -- Kullanıcı güncelleme
  UPDATE public.profiles 
  SET 
    status = 'approved',
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO v_user;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Kullanıcı bulunamadı'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Kullanıcı başarıyla onaylandı',
    'user', row_to_json(v_user)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcı reddetme fonksiyonu (güncellenmiş)
CREATE OR REPLACE FUNCTION reject_user(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Admin kontrolü (parametre ile)
  IF NOT is_admin_by_id(p_admin_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Yetkisiz erişim'
    );
  END IF;

  -- Kullanıcı güncelleme
  UPDATE public.profiles 
  SET 
    status = 'rejected',
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO v_user;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Kullanıcı bulunamadı'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Kullanıcı reddedildi',
    'user', row_to_json(v_user)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcı silme fonksiyonu (güncellenmiş)
CREATE OR REPLACE FUNCTION delete_user(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_deleted_listings INTEGER;
BEGIN
  -- Admin kontrolü (parametre ile)
  IF NOT is_admin_by_id(p_admin_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Yetkisiz erişim'
    );
  END IF;

  -- Kullanıcı bilgilerini al
  SELECT * INTO v_user FROM public.profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    -- simple_users tablosunda da kontrol et
    SELECT * INTO v_user FROM public.simple_users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Kullanıcı bulunamadı'
      );
    END IF;
  END IF;

  -- Kullanıcının ilanlarını sil
  DELETE FROM public.listings WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_deleted_listings = ROW_COUNT;

  -- Kullanıcıyı sil (profiles veya simple_users)
  DELETE FROM public.profiles WHERE id = p_user_id;
  DELETE FROM public.simple_users WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Kullanıcı başarıyla silindi',
    'user', row_to_json(v_user),
    'deleted_listings', v_deleted_listings
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
