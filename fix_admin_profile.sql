-- ============================================
-- ADMIN KULLANICISI PROFİL OLUŞTURMA
-- ============================================
-- RLS nedeniyle SECURITY DEFINER function kullanıyoruz
-- ID: 90e60080-523f-46f1-8d46-255bd8e286bc
-- ============================================

-- Admin profilini oluşturan function (RLS bypass için)
CREATE OR REPLACE FUNCTION public.create_admin_profile(
    user_id UUID,
    admin_full_name TEXT DEFAULT 'Admin User'
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
    VALUES (
        user_id,
        admin_full_name,
        'admin',
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        full_name = admin_full_name,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin profilini oluştur
-- Email: satoshinakamototokyo42@gmail.com
SELECT public.create_admin_profile(
    '90e60080-523f-46f1-8d46-255bd8e286bc'::UUID,
    'Admin' -- veya istediğiniz ismi buraya yazabilirsiniz
);

-- Function'ı temizle (opsiyonel - güvenlik için)
DROP FUNCTION IF EXISTS public.create_admin_profile(UUID, TEXT);

-- ============================================
-- KONTROL SORGUSU
-- ============================================
SELECT 
    id, 
    full_name, 
    role, 
    created_at,
    updated_at
FROM public.profiles 
WHERE id = '90e60080-523f-46f1-8d46-255bd8e286bc';