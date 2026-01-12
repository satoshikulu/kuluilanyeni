-- ============================================
-- KULU İLAN - PROFILE TRIGGER
-- ============================================
-- Supabase Auth ile profile senkronizasyonu
-- Otomatik profile oluşturma (basit trigger)
-- ============================================

-- Profile otomatik oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'user',
    'pending',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auth.users insert trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ADMIN USER OLUŞTURMA
-- ============================================

-- İlk admin kullanıcısı oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_admin_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Auth kullanıcısı oluştur
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    is_super_admin
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    json_build_object(
      'full_name', p_full_name,
      'phone', p_phone
    ),
    false
  )
  RETURNING id INTO v_user_id;

  -- Profile oluştur (trigger otomatik çalışır ama admin yapalım)
  UPDATE public.profiles 
  SET 
    role = 'admin',
    status = 'approved',
    full_name = p_full_name,
    phone = COALESCE(p_phone, ''),
    updated_at = NOW()
  WHERE id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Admin kullanıcısı oluşturuldu',
    'user_id', v_user_id,
    'email', p_email
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TELEFON NUMARASI NORMALIZASYON
-- ============================================

-- Telefon numarası temizleme fonksiyonu
CREATE OR REPLACE FUNCTION normalize_phone(phone_input TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Sadece rakamları al
  RETURN regexp_replace(phone_input, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Telefon numarası formatı kontrol fonksiyonu
CREATE OR REPLACE FUNCTION is_valid_phone(phone_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  clean_phone TEXT;
BEGIN
  clean_phone := normalize_phone(phone_input);
  
  -- Türkiye telefon numarası kontrolü (10 veya 11 haneli)
  RETURN length(clean_phone) IN (10, 11) AND clean_phone ~ '^[0-9]+$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Profile telefon normalizasyon trigger
CREATE OR REPLACE FUNCTION normalize_profile_phone()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    NEW.phone := normalize_phone(NEW.phone);
    
    -- Geçersiz telefon kontrolü
    IF NOT is_valid_phone(NEW.phone) THEN
      RAISE EXCEPTION 'Geçersiz telefon numarası formatı: %', NEW.phone;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profile telefon normalizasyon trigger
DROP TRIGGER IF EXISTS trigger_normalize_profile_phone ON public.profiles;
CREATE TRIGGER trigger_normalize_profile_phone
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION normalize_profile_phone();

-- ============================================
-- MEMBERSHIP CHECK FUNCTIONS
-- ============================================

-- Telefon numarasına göre onaylı üye kontrolü
CREATE OR REPLACE FUNCTION check_approved_membership(phone_input TEXT)
RETURNS JSON AS $$
DECLARE
  clean_phone TEXT;
  v_user RECORD;
BEGIN
  clean_phone := normalize_phone(phone_input);
  
  SELECT id, full_name, status, role
  INTO v_user
  FROM public.profiles
  WHERE phone = clean_phone AND status = 'approved';

  IF FOUND THEN
    RETURN json_build_object(
      'is_member', true,
      'user_id', v_user.id,
      'user_name', v_user.full_name,
      'role', v_user.role
    );
  ELSE
    RETURN json_build_object(
      'is_member', false,
      'user_id', null,
      'user_name', null,
      'role', null
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Telefon numarasına göre bekleyen üyelik kontrolü
CREATE OR REPLACE FUNCTION check_pending_membership(phone_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  clean_phone TEXT;
BEGIN
  clean_phone := normalize_phone(phone_input);
  
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE phone = clean_phone AND status = 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;