-- ============================================
-- KULU İLAN - RLS POLICIES
-- ============================================
-- Row Level Security politikaları
-- İş kurallarına uygun erişim kontrolü
-- ============================================

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Herkes kendi profilini okuyabilir
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Herkes kendi profilini güncelleyebilir
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin tüm profilleri okuyabilir
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin tüm profilleri güncelleyebilir
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin profilleri silebilir
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- LISTINGS POLICIES
-- ============================================

-- Herkes onaylı ilanları okuyabilir
CREATE POLICY "Anyone can read approved listings" ON public.listings
  FOR SELECT USING (status = 'approved');

-- Admin tüm ilanları okuyabilir
CREATE POLICY "Admins can read all listings" ON public.listings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Kullanıcılar kendi ilanlarını okuyabilir
CREATE POLICY "Users can read own listings" ON public.listings
  FOR SELECT USING (user_id = auth.uid());

-- Herkes ilan ekleyebilir (üye olan veya olmayan)
CREATE POLICY "Anyone can insert listings" ON public.listings
  FOR INSERT WITH CHECK (true);

-- Sadece admin ilanları güncelleyebilir
CREATE POLICY "Only admins can update listings" ON public.listings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sadece admin ilanları silebilir
CREATE POLICY "Only admins can delete listings" ON public.listings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- FAVORITES POLICIES
-- ============================================

-- Kullanıcılar kendi favorilerini okuyabilir
CREATE POLICY "Users can read own favorites" ON public.favorites
  FOR SELECT USING (user_id = auth.uid());

-- Kullanıcılar favori ekleyebilir
CREATE POLICY "Users can insert favorites" ON public.favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Kullanıcılar kendi favorilerini silebilir
CREATE POLICY "Users can delete own favorites" ON public.favorites
  FOR DELETE USING (user_id = auth.uid());

-- Admin tüm favorileri görebilir
CREATE POLICY "Admins can read all favorites" ON public.favorites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- LISTING_INTERESTS POLICIES
-- ============================================

-- Herkes ilgi kaydı ekleyebilir
CREATE POLICY "Anyone can insert listing interests" ON public.listing_interests
  FOR INSERT WITH CHECK (true);

-- Admin tüm ilgi kayıtlarını okuyabilir
CREATE POLICY "Admins can read all listing interests" ON public.listing_interests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Kullanıcılar kendi ilgi kayıtlarını okuyabilir
CREATE POLICY "Users can read own listing interests" ON public.listing_interests
  FOR SELECT USING (user_id = auth.uid());

-- ============================================
-- ONESIGNAL_USERS POLICIES
-- ============================================

-- Kullanıcılar kendi OneSignal kaydını okuyabilir
CREATE POLICY "Users can read own onesignal record" ON public.onesignal_users
  FOR SELECT USING (user_id = auth.uid());

-- Kullanıcılar kendi OneSignal kaydını ekleyebilir
CREATE POLICY "Users can insert own onesignal record" ON public.onesignal_users
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Kullanıcılar kendi OneSignal kaydını güncelleyebilir
CREATE POLICY "Users can update own onesignal record" ON public.onesignal_users
  FOR UPDATE USING (user_id = auth.uid());

-- Admin tüm OneSignal kayıtlarını yönetebilir
CREATE POLICY "Admins can manage all onesignal records" ON public.onesignal_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Admin kontrolü için yardımcı fonksiyon
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Onaylı kullanıcı kontrolü için yardımcı fonksiyon
CREATE OR REPLACE FUNCTION is_approved_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND status = 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;