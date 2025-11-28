-- Listing Interests (İlan İlgileri) Tablosu
-- Her ilan için kimlerin ilgilendiğini takip eder

CREATE TABLE IF NOT EXISTS listing_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  interested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_ip TEXT, -- Opsiyonel: IP adresi ile tekrar sayımı önle
  user_agent TEXT, -- Opsiyonel: Tarayıcı bilgisi
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler (Performans için)
CREATE INDEX IF NOT EXISTS idx_listing_interests_listing_id ON listing_interests(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_interests_created_at ON listing_interests(created_at);

-- İlan başına ilgi sayısını hızlıca almak için view
CREATE OR REPLACE VIEW listing_interest_counts AS
SELECT 
  listing_id,
  COUNT(*) as interest_count,
  MAX(interested_at) as last_interest_at
FROM listing_interests
GROUP BY listing_id;

-- RLS (Row Level Security) Politikaları
ALTER TABLE listing_interests ENABLE ROW LEVEL SECURITY;

-- Herkes ilgi kaydı ekleyebilir
CREATE POLICY "Anyone can record interest"
  ON listing_interests
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Herkes ilgi sayılarını görebilir
CREATE POLICY "Anyone can view interest counts"
  ON listing_interests
  FOR SELECT
  TO public
  USING (true);

-- Admin her şeyi görebilir ve silebilir
CREATE POLICY "Admins can do everything"
  ON listing_interests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE listing_interests IS 'İlanlara gösterilen ilgiyi takip eder';
COMMENT ON COLUMN listing_interests.listing_id IS 'İlgilenilen ilan ID';
COMMENT ON COLUMN listing_interests.user_ip IS 'Kullanıcı IP adresi (tekrar sayımı önlemek için)';
COMMENT ON COLUMN listing_interests.interested_at IS 'İlgilenme zamanı';
