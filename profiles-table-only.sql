-- Sadece profiles tablosunu oluştur (hızlı çözüm)

-- 1. Profiles tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. İndeksler
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- 3. RLS aktif et
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Admin kullanıcısı ekle
INSERT INTO public.profiles (id, full_name, role)
VALUES (
    '90e60080-523f-46f1-8d46-255bd8e286bc', -- Admin user ID
    'Admin User',
    'admin'
)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = 'Admin User',
    updated_at = now();

-- 5. Kontrol et
SELECT 
    'PROFILES CREATED' as status,
    COUNT(*) as total_profiles,
    COUNT(*) FILTER (WHERE role = 'admin') as admin_count
FROM public.profiles;