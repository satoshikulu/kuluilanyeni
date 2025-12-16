-- Firebase Cloud Messaging Tokens Tablosu
-- Bu tabloyu Supabase SQL Editor'da çalıştırın

CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(phone),   -- Her telefon numarasının sadece bir token'ı olabilir (UPSERT için)
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