-- ============================================
-- ADMIN KULLANICI GÜNCELLEME
-- ============================================
-- Mevcut admin kullanıcısını güncelle
-- ============================================

DO $$
DECLARE
  existing_admin_id UUID;
BEGIN
  -- Mevcut admin kullanıcısını bul
  SELECT id INTO existing_admin_id 
  FROM auth.users 
  WHERE email = 'satoshinakamototokyo42@gmail.com';
  
  IF existing_admin_id IS NOT NULL THEN
    -- Profile güncelle (şifre Supabase dashboard'dan değiştirilmeli)
    UPDATE public.profiles 
    SET 
      role = 'admin',
      status = 'approved',
      updated_at = NOW()
    WHERE id = existing_admin_id;
    
    RAISE NOTICE 'Admin kullanıcısı profili güncellendi: satoshinakamototokyo42@gmail.com';
    RAISE NOTICE 'Şifre Supabase Dashboard > Authentication > Users bölümünden manuel olarak değiştirilmelidir.';
  ELSE
    RAISE NOTICE 'Admin kullanıcısı bulunamadı';
  END IF;
END $$;