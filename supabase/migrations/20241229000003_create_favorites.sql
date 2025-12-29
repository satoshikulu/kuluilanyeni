-- Create favorites table for user favorite listings
CREATE TABLE IF NOT EXISTS favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users_min(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique user-listing combination
    UNIQUE(user_id, listing_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON favorites(listing_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can manage their own favorites
CREATE POLICY "Users can manage own favorites" ON favorites
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Service role can do everything
CREATE POLICY "Service role full access" ON favorites
    FOR ALL USING (auth.role() = 'service_role');

-- Function to update listing favorite_count
CREATE OR REPLACE FUNCTION update_listing_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE listings 
        SET favorite_count = favorite_count + 1 
        WHERE id = NEW.listing_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE listings 
        SET favorite_count = favorite_count - 1 
        WHERE id = OLD.listing_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Triggers to update favorite count
CREATE TRIGGER update_favorite_count_on_insert 
    AFTER INSERT ON favorites 
    FOR EACH ROW 
    EXECUTE FUNCTION update_listing_favorite_count();

CREATE TRIGGER update_favorite_count_on_delete 
    AFTER DELETE ON favorites 
    FOR EACH ROW 
    EXECUTE FUNCTION update_listing_favorite_count();