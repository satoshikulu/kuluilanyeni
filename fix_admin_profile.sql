-- Admin kullanıcısını profiles tablosuna ekle
-- ID: 90e60080-523f-46f1-8d46-255bd8e286bc (hata mesajından)

INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
VALUES (
    '90e60080-523f-46f1-8d46-255bd8e286bc',
    'Admin User',
    'admin',
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    updated_at = now();

-- Kontrol et
SELECT 
    id, 
    full_name, 
    role, 
    created_at 
FROM public.profiles 
WHERE id = '90e60080-523f-46f1-8d46-255bd8e286bc';