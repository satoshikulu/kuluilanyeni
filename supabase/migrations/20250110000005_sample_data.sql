-- ============================================
-- KULU İLAN - SAMPLE DATA
-- ============================================
-- Test için örnek veriler
-- İlk admin kullanıcısı ve örnek ilanlar
-- ============================================

-- ============================================
-- İLK ADMIN KULLANICISI
-- ============================================

-- Admin kullanıcısı oluştur (manuel)
-- Email: satoshinakamototokyo42@gmail.com
-- Şifre: Sevimbebe4242.
-- Not: Gerçek projede güçlü şifre kullanın

DO $$
DECLARE
  admin_user_id UUID := gen_random_uuid();
  existing_admin_count INTEGER;
BEGIN
  -- Mevcut admin kontrolü
  SELECT COUNT(*) INTO existing_admin_count 
  FROM auth.users 
  WHERE email = 'satoshinakamototokyo42@gmail.com';
  
  IF existing_admin_count = 0 THEN
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
      admin_user_id,
      'authenticated',
      'authenticated',
      'satoshinakamototokyo42@gmail.com',
      crypt('Sevimbebe4242.', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      json_build_object(
        'full_name', 'Admin Kullanıcı',
        'phone', '5551234567'
      ),
      false
    );

    -- Profile oluştur
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
      admin_user_id,
      'satoshinakamototokyo42@gmail.com',
      'Admin Kullanıcı',
      '5551234567',
      'admin',
      'approved',
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Admin kullanıcısı oluşturuldu: satoshinakamototokyo42@gmail.com / Sevimbebe4242.';
  ELSE
    RAISE NOTICE 'Admin kullanıcısı zaten mevcut: satoshinakamototokyo42@gmail.com';
  END IF;
END $$;

-- ============================================
-- ÖRNEK KULLANICILAR
-- ============================================

DO $$
DECLARE
  user1_id UUID := gen_random_uuid();
  user2_id UUID := gen_random_uuid();
  user3_id UUID := gen_random_uuid();
BEGIN
  -- Onaylı kullanıcı 1
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    user1_id, 'authenticated', 'authenticated',
    '5321234567@kuluilani.local',
    crypt('123456', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    json_build_object('full_name', 'Ahmet Yılmaz', 'phone', '5321234567')
  );

  INSERT INTO public.profiles (id, email, full_name, phone, role, status, created_at, updated_at)
  VALUES (user1_id, '5321234567@kuluilani.local', 'Ahmet Yılmaz', '5321234567', 'user', 'approved', NOW(), NOW());

  -- Bekleyen kullanıcı 2
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    user2_id, 'authenticated', 'authenticated',
    '5339876543@kuluilani.local',
    crypt('123456', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    json_build_object('full_name', 'Fatma Demir', 'phone', '5339876543')
  );

  INSERT INTO public.profiles (id, email, full_name, phone, role, status, created_at, updated_at)
  VALUES (user2_id, '5339876543@kuluilani.local', 'Fatma Demir', '5339876543', 'user', 'pending', NOW(), NOW());

  -- Reddedilen kullanıcı 3
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    user3_id, 'authenticated', 'authenticated',
    '5445556677@kuluilani.local',
    crypt('123456', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    json_build_object('full_name', 'Mehmet Kaya', 'phone', '5445556677')
  );

  INSERT INTO public.profiles (id, email, full_name, phone, role, status, created_at, updated_at)
  VALUES (user3_id, '5445556677@kuluilani.local', 'Mehmet Kaya', '5445556677', 'user', 'rejected', NOW(), NOW());

END $$;

-- ============================================
-- ÖRNEK İLANLAR
-- ============================================

-- Onaylı satılık daire ilanı
INSERT INTO public.listings (
  title, description, owner_name, owner_phone,
  neighborhood, property_type, rooms, area_m2, price_tl,
  is_for, status, approved_at,
  floor_number, total_floors, heating_type, building_age,
  furnished_status, usage_status, has_elevator, monthly_fee, has_balcony,
  address, latitude, longitude, location_type,
  user_id, requires_membership
) VALUES (
  'Merkez Konumda Satılık 3+1 Daire',
  'Şehir merkezinde, ulaşım imkanları çok iyi olan 3+1 daire. Temiz ve bakımlı.',
  'Ahmet Yılmaz', '5321234567',
  'Merkez', 'Daire', '3+1', 120, 850000,
  'satilik', 'approved', NOW(),
  2, 5, 'Doğalgaz', 15,
  'Eşyasız', 'Boş', true, 350, true,
  'Merkez Mahallesi, Kulu/Konya', 39.0919, 33.0794, 'address',
  (SELECT id FROM public.profiles WHERE phone = '5321234567'), false
);

-- Bekleyen kiralık müstakil ilanı
INSERT INTO public.listings (
  title, description, owner_name, owner_phone,
  neighborhood, property_type, rooms, area_m2, price_tl,
  is_for, status,
  heating_type, building_age, furnished_status, usage_status,
  garden_area_m2, deposit_amount, advance_payment_months,
  address, latitude, longitude, location_type,
  requires_membership
) VALUES (
  'Bahçeli Kiralık Müstakil Ev',
  'Geniş bahçeli, sakin bir konumda müstakil ev. Aile için ideal.',
  'Fatma Demir', '5339876543',
  'Yeni Mahalle', 'Müstakil', '4+1', 180, 8500,
  'kiralik', 'pending',
  'Doğalgaz', 8, 'Yarı Eşyalı', 'Boş',
  200, 17000, 2,
  'Yeni Mahalle, Kulu/Konya', 39.0950, 33.0820, 'address',
  true
);

-- Öne çıkan satılık daire
INSERT INTO public.listings (
  title, description, owner_name, owner_phone,
  neighborhood, property_type, rooms, area_m2, price_tl,
  is_for, status, approved_at,
  is_featured, featured_order, featured_until,
  floor_number, total_floors, heating_type, building_age,
  furnished_status, usage_status, has_elevator, monthly_fee,
  deed_status, address, latitude, longitude, location_type,
  requires_membership
) VALUES (
  'Lüks Satılık Daire - Öne Çıkan İlan',
  'Modern yapı, merkezi konum, deniz manzaralı lüks daire.',
  'Ali Veli', '5556667788',
  'Merkez', 'Daire', '4+1', 150, 1200000,
  'satilik', 'approved', NOW(),
  true, 1, NOW() + INTERVAL '30 days',
  3, 6, 'Merkezi Sistem', 5,
  'Eşyalı', 'Boş', true, 500,
  'Kat Mülkiyeti', 'Merkez Mahallesi, Kulu/Konya', 39.0900, 33.0800, 'address',
  false
);

-- Fırsat ilanı
INSERT INTO public.listings (
  title, description, owner_name, owner_phone,
  neighborhood, property_type, rooms, area_m2, price_tl,
  is_for, status, approved_at,
  is_opportunity, opportunity_order, original_price_tl, discount_percentage,
  floor_number, total_floors, heating_type, building_age,
  furnished_status, usage_status, has_elevator,
  deed_status, address, latitude, longitude, location_type,
  requires_membership
) VALUES (
  'Acil Satılık Daire - Fırsat Fiyatı!',
  'Acil satılık, fırsat fiyatına 2+1 daire. Kaçmaz fırsat!',
  'Zeynep Özkan', '5447778899',
  'Eski Mahalle', 'Daire', '2+1', 85, 450000,
  'satilik', 'approved', NOW(),
  true, 1, 550000, 18.18,
  1, 4, 'Doğalgaz', 25,
  'Eşyasız', 'Boş', false,
  'Kat Mülkiyeti', 'Eski Mahalle, Kulu/Konya', 39.0880, 33.0750, 'address',
  false
);

-- Reddedilen ilan
INSERT INTO public.listings (
  title, description, owner_name, owner_phone,
  neighborhood, property_type, rooms, area_m2, price_tl,
  is_for, status,
  address, latitude, longitude, location_type,
  requires_membership
) VALUES (
  'Eksik Bilgili İlan',
  'Bu ilan eksik bilgiler nedeniyle reddedildi.',
  'Test Kullanıcı', '5551112233',
  'Test Mahalle', 'Daire', '2+1', 70, 300000,
  'satilik', 'rejected',
  'Test Mahalle, Kulu/Konya', 39.0850, 33.0780, 'address',
  false
);

-- ============================================
-- ÖRNEK FAVORİLER
-- ============================================

-- Ahmet Yılmaz'ın favorileri
INSERT INTO public.favorites (user_id, listing_id)
SELECT 
  (SELECT id FROM public.profiles WHERE phone = '5321234567'),
  id
FROM public.listings 
WHERE title LIKE '%Lüks%' OR title LIKE '%Fırsat%'
LIMIT 2;

-- ============================================
-- ÖRNEK İLGİ KAYITLARI
-- ============================================

-- İlan ilgi kayıtları
INSERT INTO public.listing_interests (listing_id, user_id)
SELECT 
  l.id,
  p.id
FROM public.listings l
CROSS JOIN public.profiles p
WHERE l.status = 'approved' 
  AND p.role = 'user' 
  AND p.status = 'approved'
LIMIT 5;

-- ============================================
-- ÖRNEK ONESIGNAL KAYITLARI
-- ============================================

-- OneSignal kullanıcı kayıtları
INSERT INTO public.onesignal_users (user_id, onesignal_external_id, sync_status)
SELECT 
  id,
  'ext_' || id::text,
  'success'
FROM public.profiles 
WHERE status = 'approved'
LIMIT 3;

-- ============================================
-- BAŞARIYLA TAMAMLANDI MESAJI
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'KULU İLAN BACKEND BAŞARIYLA OLUŞTURULDU!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Admin Giriş Bilgileri:';
  RAISE NOTICE 'Email: satoshinakamototokyo42@gmail.com';
  RAISE NOTICE 'Şifre: Sevimbebe4242.';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Örnek Kullanıcılar:';
  RAISE NOTICE '- Ahmet Yılmaz (5321234567) - Onaylı';
  RAISE NOTICE '- Fatma Demir (5339876543) - Bekleyen';
  RAISE NOTICE '- Mehmet Kaya (5445556677) - Reddedilen';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Örnek İlanlar: 5 adet oluşturuldu';
  RAISE NOTICE '- 2 Onaylı ilan';
  RAISE NOTICE '- 1 Bekleyen ilan';
  RAISE NOTICE '- 1 Öne çıkan ilan';
  RAISE NOTICE '- 1 Fırsat ilanı';
  RAISE NOTICE '- 1 Reddedilen ilan';
  RAISE NOTICE '============================================';
END $$;