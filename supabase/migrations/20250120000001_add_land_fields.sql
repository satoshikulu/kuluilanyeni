-- Add land-specific fields to listings table
-- Migration: 20250120000001_add_land_fields.sql

-- Add new columns for land properties
ALTER TABLE public.listings 
ADD COLUMN land_type TEXT,
ADD COLUMN irrigation_status TEXT,
ADD COLUMN electricity_status TEXT,
ADD COLUMN well_status TEXT,
ADD COLUMN road_condition TEXT,
ADD COLUMN machinery_access TEXT,
ADD COLUMN zoning_status TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.listings.land_type IS 'Type of land/field (Buğday Tarlası, Arpa Tarlası, etc.)';
COMMENT ON COLUMN public.listings.irrigation_status IS 'Irrigation status (Sulu, Kuru, Kısmen Sulu, etc.)';
COMMENT ON COLUMN public.listings.electricity_status IS 'Electricity availability (Var, Yok, Yakında, etc.)';
COMMENT ON COLUMN public.listings.well_status IS 'Water well status (Su Kuyusu Var, Artezyen Var, etc.)';
COMMENT ON COLUMN public.listings.road_condition IS 'Road condition (Asfalt Yol, Stabilize Yol, etc.)';
COMMENT ON COLUMN public.listings.machinery_access IS 'Agricultural machinery access (Kolay Erişim, Zor Erişim, etc.)';
COMMENT ON COLUMN public.listings.zoning_status IS 'Zoning/planning status (Tarım Arazisi, İmarlı Arazi, etc.)';