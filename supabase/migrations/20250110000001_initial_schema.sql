-- ============================================
-- KULU İLAN - SUPABASE BACKEND SQL SCHEMA
-- ============================================
-- Frontend ile tam uyumlu tablo yapısı
-- Email, OTP, magic link kullanılmaz
-- Supabase Auth signup trigger'ları kullanılmaz
-- ============================================

-- 1. PROFILES TABLOSU (Üyeler)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. LISTINGS TABLOSU (İlanlar)
-- ============================================
CREATE TABLE IF NOT EXISTS public.listings (
  -- Temel Bilgiler
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  listing_number TEXT UNIQUE,
  
  -- İlan Bilgileri
  title TEXT NOT NULL,
  description TEXT,
  
  -- Sahip Bilgileri
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  
  -- Emlak Detayları
  neighborhood TEXT,
  property_type TEXT,
  rooms TEXT,
  area_m2 NUMERIC,
  price_tl NUMERIC,
  
  -- Konum Bilgileri
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  location_type TEXT CHECK (location_type IN ('address', 'coordinates')),
  
  -- Durum
  is_for TEXT NOT NULL CHECK (is_for IN ('satilik', 'kiralik')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Öne Çıkan İlan
  is_featured BOOLEAN DEFAULT FALSE,
  featured_order INTEGER,
  featured_until TIMESTAMPTZ,
  
  -- Fırsat İlan
  is_opportunity BOOLEAN DEFAULT FALSE,
  opportunity_order INTEGER,
  original_price_tl NUMERIC,
  discount_percentage NUMERIC,
  
  -- Görseller
  images TEXT[] DEFAULT '{}',
  
  -- Profesyonel Detaylar
  floor_number INTEGER CHECK (floor_number >= -5 AND floor_number <= 50),
  total_floors INTEGER CHECK (total_floors >= 1 AND total_floors <= 50),
  heating_type TEXT CHECK (heating_type IN (
    'Doğalgaz', 'Elektrik', 'Kömür', 'Odun', 'Güneş Enerjisi', 
    'Jeotermal', 'Klima', 'Soba', 'Merkezi Sistem', 'Yok'
  )),
  building_age INTEGER CHECK (building_age >= 0 AND building_age <= 200),
  furnished_status TEXT CHECK (furnished_status IN ('Eşyalı', 'Eşyasız', 'Yarı Eşyalı')),
  usage_status TEXT CHECK (usage_status IN (
    'Boş', 'Kiracılı', 'Mülk Sahibi Oturuyor', 'Tadilat Halinde'
  )),
  has_elevator BOOLEAN DEFAULT FALSE,
  monthly_fee NUMERIC CHECK (monthly_fee >= 0),
  has_balcony BOOLEAN DEFAULT FALSE,
  garden_area_m2 NUMERIC CHECK (garden_area_m2 >= 0),
  deed_status TEXT CHECK (deed_status IN (
    'Kat Mülkiyeti', 'Kat İrtifakı', 'Arsa Tapusu', 'Tahsis', 'Diğer'
  )),
  deposit_amount NUMERIC CHECK (deposit_amount >= 0),
  advance_payment_months INTEGER CHECK (advance_payment_months >= 0 AND advance_payment_months <= 12),
  
  -- İlişkili Veriler
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  requires_membership BOOLEAN DEFAULT FALSE
);

-- 3. FAVORITES TABLOSU (Favoriler)
-- ============================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- 4. LISTING_INTERESTS TABLOSU (İlgi Sayıları)
-- ============================================
CREATE TABLE IF NOT EXISTS public.listing_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ONESIGNAL_USERS TABLOSU (OneSignal Senkronizasyonu)
-- ============================================
CREATE TABLE IF NOT EXISTS public.onesignal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  onesignal_external_id TEXT,
  onesignal_user_id TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'success', 'failed')),
  sync_error TEXT,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- INDEXES VE CONSTRAINTS
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Listings indexes
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_is_for ON public.listings(is_for);
CREATE INDEX IF NOT EXISTS idx_listings_neighborhood ON public.listings(neighborhood);
CREATE INDEX IF NOT EXISTS idx_listings_property_type ON public.listings(property_type);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_approved_at ON public.listings(approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_price_tl ON public.listings(price_tl);
CREATE INDEX IF NOT EXISTS idx_listings_area_m2 ON public.listings(area_m2);
CREATE INDEX IF NOT EXISTS idx_listings_is_featured ON public.listings(is_featured);
CREATE INDEX IF NOT EXISTS idx_listings_is_opportunity ON public.listings(is_opportunity);
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_owner_phone ON public.listings(owner_phone);
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings(latitude, longitude);

-- Favorites indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON public.favorites(listing_id);

-- Listing interests indexes
CREATE INDEX IF NOT EXISTS idx_listing_interests_listing_id ON public.listing_interests(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_interests_created_at ON public.listing_interests(created_at DESC);

-- OneSignal users indexes
CREATE INDEX IF NOT EXISTS idx_onesignal_users_user_id ON public.onesignal_users(user_id);
CREATE INDEX IF NOT EXISTS idx_onesignal_users_sync_status ON public.onesignal_users(sync_status);

-- ============================================
-- SEQUENCE VE FUNCTIONS
-- ============================================

-- İlan numarası için sequence
CREATE SEQUENCE IF NOT EXISTS listing_number_seq START 10001;

-- İlan numarası otomatik atama fonksiyonu
CREATE OR REPLACE FUNCTION generate_listing_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.listing_number IS NULL THEN
    NEW.listing_number := nextval('listing_number_seq')::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- İlan numarası trigger
DROP TRIGGER IF EXISTS trigger_generate_listing_number ON public.listings;
CREATE TRIGGER trigger_generate_listing_number
  BEFORE INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION generate_listing_number();

-- Updated_at otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profiles updated_at trigger
DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (ROW LEVEL SECURITY) ENABLE
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onesignal_users ENABLE ROW LEVEL SECURITY;