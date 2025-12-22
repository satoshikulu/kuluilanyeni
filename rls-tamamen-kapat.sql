-- RLS'i tamamen kapat (admin login çalışsın)

-- 1. Tüm policies'i sil
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_access" ON public.profiles;

-- 2. RLS'i tamamen kapat
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Test sorgusu
SELECT 
    'RLS DISABLED - ADMIN TEST' as status,
    id,
    full_name,
    role,
    created_at
FROM public.profiles 
WHERE id = '90e60080-523f-46f1-8d46-255bd8e286bc';

-- 4. Tüm profiles'i göster (RLS olmadan)
SELECT 
    'ALL PROFILES - NO RLS' as status,
    id,
    full_name,
    role,
    created_at
FROM public.profiles 
ORDER BY created_at DESC;