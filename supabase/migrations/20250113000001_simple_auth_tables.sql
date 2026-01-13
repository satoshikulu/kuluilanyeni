-- ============================================
-- BASİT ÜYELİK SİSTEMİ TABLOLARI
-- ============================================
-- Supabase Auth yerine basit telefon + şifre sistemi
-- ============================================

-- 1. USER_REQUESTS TABLOSU (Üyelik Başvuruları)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 2. SIMPLE_USERS TABLOSU (Onaylanmış Üyeler)
-- ============================================
CREATE TABLE IF NOT EXISTS public.simple_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

-- User requests indexes
CREATE INDEX IF NOT EXISTS idx_user_requests_phone ON public.user_requests(phone);
CREATE INDEX IF NOT EXISTS idx_user_requests_status ON public.user_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_requests_created_at ON public.user_requests(created_at DESC);

-- Simple users indexes
CREATE INDEX IF NOT EXISTS idx_simple_users_phone ON public.simple_users(phone);
CREATE INDEX IF NOT EXISTS idx_simple_users_role ON public.simple_users(role);
CREATE INDEX IF NOT EXISTS idx_simple_users_status ON public.simple_users(status);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Updated_at otomatik güncelleme
CREATE TRIGGER trigger_update_user_requests_updated_at
  BEFORE UPDATE ON public.user_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_simple_users_updated_at
  BEFORE UPDATE ON public.simple_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS ENABLE
-- ============================================

ALTER TABLE public.user_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simple_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ADMIN KULLANICI EKLEME
-- ============================================

-- Admin kullanıcı ekle (şifre: Sevimbebe4242.)
INSERT INTO public.simple_users (
  full_name,
  phone,
  password_hash,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  'Admin Kullanıcı',
  'satoshinakamototokyo42@gmail.com',
  'U2V2aW1iZWJlNDI0Mi4=', -- Base64 encoded "Sevimbebe4242."
  'admin',
  'approved',
  NOW(),
  NOW()
) ON CONFLICT (phone) DO NOTHING;