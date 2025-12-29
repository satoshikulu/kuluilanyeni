-- Create listings table for property listings
CREATE TABLE IF NOT EXISTS listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users_min(id) ON DELETE CASCADE,
    
    -- Basic listing info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price_tl DECIMAL(12,2) NOT NULL,
    
    -- Property details
    property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('house', 'apartment', 'land', 'commercial', 'other')),
    listing_type VARCHAR(20) NOT NULL CHECK (listing_type IN ('sale', 'rent')),
    
    -- Location
    neighborhood VARCHAR(100),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Property specifications
    rooms INTEGER,
    bathrooms INTEGER,
    area_sqm INTEGER,
    floor_number INTEGER,
    total_floors INTEGER,
    building_age INTEGER,
    
    -- Features
    has_parking BOOLEAN DEFAULT false,
    has_balcony BOOLEAN DEFAULT false,
    has_garden BOOLEAN DEFAULT false,
    has_elevator BOOLEAN DEFAULT false,
    is_furnished BOOLEAN DEFAULT false,
    
    -- Status and flags
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'sold', 'rented', 'inactive')),
    is_featured BOOLEAN DEFAULT false,
    is_opportunity BOOLEAN DEFAULT false,
    is_urgent BOOLEAN DEFAULT false,
    
    -- Media
    images JSONB DEFAULT '[]'::jsonb,
    video_url TEXT,
    
    -- Contact
    contact_phone VARCHAR(15),
    contact_name VARCHAR(255),
    show_phone BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Stats
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    contact_count INTEGER DEFAULT 0
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_property_type ON listings(property_type);
CREATE INDEX IF NOT EXISTS idx_listings_listing_type ON listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_listings_neighborhood ON listings(neighborhood);
CREATE INDEX IF NOT EXISTS idx_listings_price_tl ON listings(price_tl);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);
CREATE INDEX IF NOT EXISTS idx_listings_is_featured ON listings(is_featured);
CREATE INDEX IF NOT EXISTS idx_listings_is_opportunity ON listings(is_opportunity);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings USING GIST (point(longitude, latitude));

-- Enable RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view approved listings
CREATE POLICY "Anyone can view approved listings" ON listings
    FOR SELECT USING (status = 'approved');

-- Users can view and manage their own listings
CREATE POLICY "Users can manage own listings" ON listings
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Service role can do everything
CREATE POLICY "Service role full access" ON listings
    FOR ALL USING (auth.role() = 'service_role');

-- Trigger to automatically update updated_at
CREATE TRIGGER update_listings_updated_at 
    BEFORE UPDATE ON listings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to set published_at when status changes to approved
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        NEW.published_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to set published_at
CREATE TRIGGER set_listings_published_at 
    BEFORE UPDATE ON listings 
    FOR EACH ROW 
    EXECUTE FUNCTION set_published_at();

-- Insert some test data
INSERT INTO listings (user_id, title, description, price_tl, property_type, listing_type, neighborhood, rooms, bathrooms, area_sqm, status) VALUES
((SELECT id FROM users_min WHERE phone = '5551234567' LIMIT 1), 'Merkez''de Satılık Daire', 'Şehir merkezinde, ulaşım imkanları çok iyi olan 3+1 daire.', 450000, 'apartment', 'sale', 'Merkez', 4, 2, 120, 'approved'),
((SELECT id FROM users_min WHERE phone = '5551234567' LIMIT 1), 'Yeni Mahalle''de Kiralık Ev', 'Bahçeli, müstakil ev. Aile için ideal.', 3500, 'house', 'rent', 'Yeni Mahalle', 5, 3, 200, 'approved'),
((SELECT id FROM users_min WHERE phone = '5551234568' LIMIT 1), 'Fırsat! Satılık Arsa', 'İmarlı arsa, yatırım için ideal.', 250000, 'land', 'sale', 'Kırsal', 0, 0, 1000, 'approved')
ON CONFLICT DO NOTHING;