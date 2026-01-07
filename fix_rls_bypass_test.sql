-- ============================================
-- RLS GEÇİCİ BYPASS - TEST İÇİN
-- ============================================
-- Bu dosya sorunu test etmek için RLS'i geçici olarak kapatır
-- Eğer bu çalışırsa, sorun RLS politikalarında
-- Eğer bu da çalışmazsa, sorun başka bir yerde
-- ============================================

-- 1. RLS'İ GEÇİCİ OLARAK KAPAT
-- ============================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. TEST SORGUSU
-- ============================================
-- Bu sorgu artık çalışmalı (RLS kapalı)
SELECT 
    'RLS DISABLED - TEST' as status,
    id,
    full_name,
    role,
    created_at,
    updated_at
FROM public.profiles 
WHERE id = '90e60080-523f-46f1-8d46-255bd8e286bc';

-- ============================================
-- NOT: Bu dosyayı çalıştırdıktan sonra:
-- 1. Uygulamada çıkış yapın
-- 2. Tekrar giriş yapın
-- 3. Eğer artık çalışıyorsa, sorun RLS politikalarında
-- 4. Eğer hala çalışmıyorsa, sorun başka bir yerde
-- ============================================
