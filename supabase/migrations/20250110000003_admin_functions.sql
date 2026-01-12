-- ============================================
-- KULU İLAN - ADMIN RPC FUNCTIONS
-- ============================================
-- Admin paneli için RPC fonksiyonları
-- İlan ve kullanıcı yönetimi
-- ============================================

-- ============================================
-- İLAN YÖNETİMİ FUNCTIONS
-- ============================================

-- İlan onaylama fonksiyonu
CREATE OR REPLACE FUNCTION approve_listing(
  p_listing_id UUID,
  p_admin_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_listing RECORD;
BEGIN
  -- Admin kontrolü
  IF NOT is_admin() THEN
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

-- İlan reddetme fonksiyonu
CREATE OR REPLACE FUNCTION reject_listing(
  p_listing_id UUID,
  p_admin_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_listing RECORD;
BEGIN
  -- Admin kontrolü
  IF NOT is_admin() THEN
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

-- İlan silme fonksiyonu
CREATE OR REPLACE FUNCTION delete_listing(
  p_listing_id UUID,
  p_admin_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
  v_listing RECORD;
BEGIN
  -- Admin kontrolü
  IF NOT is_admin() THEN
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

-- İlan öne çıkarma fonksiyonu
CREATE OR REPLACE FUNCTION feature_listing(
  p_listing_id UUID,
  p_featured_until TIMESTAMPTZ DEFAULT NULL,
  p_admin_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
  v_listing RECORD;
  v_max_order INTEGER;
BEGIN
  -- Admin kontrolü
  IF NOT is_admin() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Yetkisiz erişim'
    );
  END IF;

  -- Maksimum featured_order değerini al
  SELECT COALESCE(MAX(featured_order), 0) + 1 INTO v_max_order
  FROM public.listings 
  WHERE is_featured = true;

  -- İlan güncelleme
  UPDATE public.listings 
  SET 
    is_featured = true,
    featured_order = v_max_order,
    featured_until = COALESCE(p_featured_until, NOW() + INTERVAL '30 days')
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
    'message', 'İlan öne çıkarıldı',
    'listing', row_to_json(v_listing)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- İlan fırsat yapma fonksiyonu
CREATE OR REPLACE FUNCTION make_opportunity_listing(
  p_listing_id UUID,
  p_original_price_tl NUMERIC,
  p_discount_percentage NUMERIC,
  p_admin_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
  v_listing RECORD;
  v_max_order INTEGER;
BEGIN
  -- Admin kontrolü
  IF NOT is_admin() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Yetkisiz erişim'
    );
  END IF;

  -- Maksimum opportunity_order değerini al
  SELECT COALESCE(MAX(opportunity_order), 0) + 1 INTO v_max_order
  FROM public.listings 
  WHERE is_opportunity = true;

  -- İlan güncelleme
  UPDATE public.listings 
  SET 
    is_opportunity = true,
    opportunity_order = v_max_order,
    original_price_tl = p_original_price_tl,
    discount_percentage = p_discount_percentage
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
    'message', 'İlan fırsat ilanı yapıldı',
    'listing', row_to_json(v_listing)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- KULLANICI YÖNETİMİ FUNCTIONS
-- ============================================

-- Kullanıcı onaylama fonksiyonu
CREATE OR REPLACE FUNCTION approve_user(
  p_user_id UUID,
  p_admin_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Admin kontrolü
  IF NOT is_admin() THEN
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

-- Kullanıcı reddetme fonksiyonu
CREATE OR REPLACE FUNCTION reject_user(
  p_user_id UUID,
  p_admin_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Admin kontrolü
  IF NOT is_admin() THEN
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

-- Kullanıcı silme fonksiyonu
CREATE OR REPLACE FUNCTION delete_user(
  p_user_id UUID,
  p_admin_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Admin kontrolü
  IF NOT is_admin() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Yetkisiz erişim'
    );
  END IF;

  -- Kullanıcı bilgilerini al
  SELECT * INTO v_user FROM public.profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Kullanıcı bulunamadı'
    );
  END IF;

  -- Auth kullanıcısını sil (CASCADE ile profile da silinir)
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Kullanıcı başarıyla silindi',
    'user', row_to_json(v_user)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- İSTATİSTİK FUNCTIONS
-- ============================================

-- Admin dashboard istatistikleri
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  -- Admin kontrolü
  IF NOT is_admin() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Yetkisiz erişim'
    );
  END IF;

  SELECT json_build_object(
    'total_listings', (SELECT COUNT(*) FROM public.listings),
    'pending_listings', (SELECT COUNT(*) FROM public.listings WHERE status = 'pending'),
    'approved_listings', (SELECT COUNT(*) FROM public.listings WHERE status = 'approved'),
    'rejected_listings', (SELECT COUNT(*) FROM public.listings WHERE status = 'rejected'),
    'featured_listings', (SELECT COUNT(*) FROM public.listings WHERE is_featured = true),
    'opportunity_listings', (SELECT COUNT(*) FROM public.listings WHERE is_opportunity = true),
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'pending_users', (SELECT COUNT(*) FROM public.profiles WHERE status = 'pending'),
    'approved_users', (SELECT COUNT(*) FROM public.profiles WHERE status = 'approved'),
    'rejected_users', (SELECT COUNT(*) FROM public.profiles WHERE status = 'rejected'),
    'admin_users', (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin'),
    'total_favorites', (SELECT COUNT(*) FROM public.favorites),
    'total_interests', (SELECT COUNT(*) FROM public.listing_interests)
  ) INTO v_stats;

  RETURN json_build_object(
    'success', true,
    'stats', v_stats
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- BULK OPERATIONS
-- ============================================

-- Toplu ilan onaylama
CREATE OR REPLACE FUNCTION bulk_approve_listings(
  p_listing_ids UUID[],
  p_admin_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Admin kontrolü
  IF NOT is_admin() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Yetkisiz erişim'
    );
  END IF;

  -- Toplu güncelleme
  UPDATE public.listings 
  SET 
    status = 'approved',
    approved_at = NOW()
  WHERE id = ANY(p_listing_ids) AND status = 'pending';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'message', format('%s ilan onaylandı', v_count),
    'count', v_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toplu kullanıcı onaylama
CREATE OR REPLACE FUNCTION bulk_approve_users(
  p_user_ids UUID[],
  p_admin_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Admin kontrolü
  IF NOT is_admin() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Yetkisiz erişim'
    );
  END IF;

  -- Toplu güncelleme
  UPDATE public.profiles 
  SET 
    status = 'approved',
    updated_at = NOW()
  WHERE id = ANY(p_user_ids) AND status = 'pending';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'message', format('%s kullanıcı onaylandı', v_count),
    'count', v_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;