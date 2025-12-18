-- FCM tokens tablosunu kontrol et
SELECT COUNT(*) as total_tokens FROM fcm_tokens;

-- Örnek FCM token ekle (test için)
INSERT INTO fcm_tokens (phone, token) 
VALUES ('test', 'test-fcm-token-123') 
ON CONFLICT (phone) DO UPDATE SET token = EXCLUDED.token;

-- Tüm tokenları göster
SELECT * FROM fcm_tokens LIMIT 5;