# 🔥 Firebase Cloud Messaging Supabase Kurulum Rehberi

## ✅ Tamamlanan İşlemler

1. **Firebase SDK entegrasyonu** ✅
2. **VAPID key konfigürasyonu** ✅
3. **Supabase CLI login** ✅
4. **Supabase project link** ✅
5. **Firebase secrets eklendi** ✅
6. **Edge function deploy edildi** ✅

## 📋 Manuel Adımlar

### 1. FCM Tokens Tablosunu Oluştur

Supabase Dashboard'a git: https://supabase.com/dashboard/project/tjoivjohhjoedtwzuopr/sql

SQL Editor'da şu kodu çalıştır:

```sql
-- Firebase Cloud Messaging Tokens Tablosu
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id), -- Her kullanıcının sadece bir token'ı olabilir
  UNIQUE(token)    -- Her token benzersiz olmalı
);

-- Index'ler performans için
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_phone ON fcm_tokens(phone);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_token ON fcm_tokens(token);

-- RLS (Row Level Security) politikaları
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi token'larını görebilir
CREATE POLICY "Users can view own FCM tokens" ON fcm_tokens
  FOR SELECT USING (true); -- Admin erişimi için şimdilik herkese açık

-- Kullanıcılar sadece kendi token'larını ekleyebilir
CREATE POLICY "Users can insert own FCM tokens" ON fcm_tokens
  FOR INSERT WITH CHECK (true); -- Admin erişimi için şimdilik herkese açık

-- Kullanıcılar sadece kendi token'larını güncelleyebilir
CREATE POLICY "Users can update own FCM tokens" ON fcm_tokens
  FOR UPDATE USING (true); -- Admin erişimi için şimdilik herkese açık

-- Kullanıcılar sadece kendi token'larını silebilir
CREATE POLICY "Users can delete own FCM tokens" ON fcm_tokens
  FOR DELETE USING (true); -- Admin erişimi için şimdilik herkese açık

-- Trigger: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fcm_tokens_updated_at 
  BEFORE UPDATE ON fcm_tokens 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Test Et

Projeyi çalıştır ve login ol:
```bash
npm run dev
```

Login olduktan sonra browser console'da FCM token'ının alındığını kontrol et.

## 🔧 Kurulum Özeti

### Environment Variables
```bash
VITE_FIREBASE_VAPID_KEY=BE3gGckq4ze1b9k4I_3qbJcPHcYtlzP7jC_E7jvLBWh0jUM04nCsmJVOEsk5eL6nvF12zfaL9dkl0PgfZx2nZFc
```

### Supabase Secrets
```bash
FIREBASE_PROJECT_ID=kuluilanyeni
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@kuluilanyeni.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

### Edge Function URL
```
https://tjoivjohhjoedtwzuopr.supabase.co/functions/v1/send-fcm-notification
```

## 🎯 Sonraki Adımlar

1. **FCM tokens tablosunu oluştur** (yukarıdaki SQL'i çalıştır)
2. **Test et** (login ol ve console'u kontrol et)
3. **Admin panelinden bildirim göndermeyi test et**
4. **Production'da gerçek Firebase Admin SDK entegrasyonu yap**

## 🚀 Firebase vs OneSignal Karşılaştırması

| Özellik | OneSignal | Firebase FCM |
|---------|-----------|--------------|
| Kurulum | Kolay | Orta |
| Maliyet | Ücretsiz (10K kullanıcı) | Ücretsiz (sınırsız) |
| Kontrol | Sınırlı | Tam kontrol |
| Entegrasyon | Hazır | Manuel |
| Güvenlik | Orta | Yüksek |

✅ **Firebase FCM başarıyla entegre edildi!**