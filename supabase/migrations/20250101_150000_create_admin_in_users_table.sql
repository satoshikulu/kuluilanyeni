-- Admin kullanıcısını 'users' tablosuna ekle

-- Önce admin kullanıcısı var mı kontrol et ve varsa sil
DELETE FROM users WHERE phone = '+905551234567' OR role = 'admin';

-- Admin kullanıcısını 'users' tablosuna ekle
INSERT INTO users (full_name, phone, role, status, password_hash, created_at, updated_at)
VALUES (
    'Admin Kullanıcı', 
    '+905551234567', 
    'admin', 
    'approved', 
    'admin123',  -- Basit şifre, sonra değiştirilebilir
    NOW(), 
    NOW()
);

-- Başarı mesajı
DO $$
BEGIN
    RAISE NOTICE 'Admin kullanıcısı oluşturuldu:';
    RAISE NOTICE 'Telefon: +905551234567';
    RAISE NOTICE 'Şifre: admin123';
    RAISE NOTICE 'Rol: admin';
    RAISE NOTICE 'Durum: approved';
END $$;