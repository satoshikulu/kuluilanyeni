-- ============================================
-- BASİT ÜYELİK SİSTEMİ RLS POLİCİES
-- ============================================

-- ============================================
-- USER_REQUESTS POLİCİES
-- ============================================

-- Herkes başvuru yapabilir
CREATE POLICY "Anyone can insert user requests"
ON public.user_requests
FOR INSERT
TO public
WITH CHECK (true);

-- Sadece admin başvuruları görebilir
CREATE POLICY "Admins can read all user requests"
ON public.user_requests
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.simple_users
    WHERE phone = current_setting('request.jwt.claims', true)::json->>'phone'
    AND role = 'admin'
    AND status = 'approved'
  )
);

-- Sadece admin başvuruları güncelleyebilir
CREATE POLICY "Admins can update user requests"
ON public.user_requests
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.simple_users
    WHERE phone = current_setting('request.jwt.claims', true)::json->>'phone'
    AND role = 'admin'
    AND status = 'approved'
  )
);

-- Sadece admin başvuruları silebilir
CREATE POLICY "Admins can delete user requests"
ON public.user_requests
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.simple_users
    WHERE phone = current_setting('request.jwt.claims', true)::json->>'phone'
    AND role = 'admin'
    AND status = 'approved'
  )
);

-- ============================================
-- SIMPLE_USERS POLİCİES
-- ============================================

-- Kullanıcılar kendi profilini görebilir
CREATE POLICY "Users can read own profile"
ON public.simple_users
FOR SELECT
TO public
USING (
  phone = current_setting('request.jwt.claims', true)::json->>'phone'
);

-- Admin tüm kullanıcıları görebilir
CREATE POLICY "Admins can read all users"
ON public.simple_users
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.simple_users su
    WHERE su.phone = current_setting('request.jwt.claims', true)::json->>'phone'
    AND su.role = 'admin'
    AND su.status = 'approved'
  )
);

-- Kullanıcılar kendi profilini güncelleyebilir
CREATE POLICY "Users can update own profile"
ON public.simple_users
FOR UPDATE
TO public
USING (
  phone = current_setting('request.jwt.claims', true)::json->>'phone'
);

-- Admin tüm kullanıcıları güncelleyebilir
CREATE POLICY "Admins can update all users"
ON public.simple_users
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.simple_users su
    WHERE su.phone = current_setting('request.jwt.claims', true)::json->>'phone'
    AND su.role = 'admin'
    AND su.status = 'approved'
  )
);

-- Sadece admin kullanıcı silebilir
CREATE POLICY "Admins can delete users"
ON public.simple_users
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.simple_users su
    WHERE su.phone = current_setting('request.jwt.claims', true)::json->>'phone'
    AND su.role = 'admin'
    AND su.status = 'approved'
  )
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Telefon numarası kontrolü fonksiyonu
CREATE OR REPLACE FUNCTION check_phone_exists(phone_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.simple_users 
    WHERE phone = phone_number AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Onaylanmış üyelik kontrolü
CREATE OR REPLACE FUNCTION check_approved_membership(phone_number TEXT)
RETURNS TABLE(id UUID, full_name TEXT, status TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT su.id, su.full_name, su.status
  FROM public.simple_users su
  WHERE su.phone = phone_number AND su.status = 'approved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;