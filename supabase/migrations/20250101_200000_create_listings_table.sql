-- Create listings table for property listings

-- 1. Create listings table
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Basic listing info
    title TEXT NOT NULL,
    description TEXT,
    
    -- Owner info
    owner_name TEXT NOT NULL,
    owner_phone TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Property details
    property_type TEXT, -- 'Daire', 'Müstakil', 'Dükkan', etc.
    rooms TEXT, -- '2+1', '3+1', etc.
    area_m2 INTEGER,
    neighborhood TEXT,
    
    -- Pricing
    price_tl INTEGER,
    is_for TEXT NOT NULL CHECK (is_for IN ('satilik', 'kiralik')),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Featured listings
    is_featured BOOLEAN NOT NULL DEFAULT false,
    featured_order INTEGER DEFAULT 0,
    featured_until TIMESTAMPTZ,
    
    -- Opportunity listings
    is_opportunity BOOLEAN NOT NULL DEFAULT false,
    opportunity_order INTEGER DEFAULT 0,
    original_price_tl INTEGER,
    discount_percentage INTEGER
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_is_for ON public.listings(is_for);
CREATE INDEX IF NOT EXISTS idx_listings_property_type ON public.listings(property_type);
CREATE INDEX IF NOT EXISTS idx_listings_neighborhood ON public.listings(neighborhood);
CREATE INDEX IF NOT EXISTS idx_listings_price_tl ON public.listings(price_tl);
CREATE INDEX IF NOT EXISTS idx_listings_is_featured ON public.listings(is_featured);
CREATE INDEX IF NOT EXISTS idx_listings_is_opportunity ON public.listings(is_opportunity);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_owner_phone ON public.listings(owner_phone);

-- 3. Enable RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
-- Everyone can view approved listings
CREATE POLICY "Everyone can view approved listings" ON public.listings
    FOR SELECT USING (status = 'approved');

-- Users can view their own listings
CREATE POLICY "Users can view own listings" ON public.listings
    FOR SELECT USING (owner_phone = (SELECT phone FROM users WHERE id = auth.uid()::uuid));

-- Users can insert listings
CREATE POLICY "Users can insert listings" ON public.listings
    FOR INSERT WITH CHECK (true);

-- Users can update their own listings
CREATE POLICY "Users can update own listings" ON public.listings
    FOR UPDATE USING (owner_phone = (SELECT phone FROM users WHERE id = auth.uid()::uuid));

-- Service role can do everything
CREATE POLICY "Service role full access on listings" ON public.listings
    FOR ALL USING (auth.role() = 'service_role');

-- 5. Insert sample listings
INSERT INTO public.listings (
    title, description, owner_name, owner_phone, user_id,
    property_type, rooms, area_m2, neighborhood,
    price_tl, is_for, status, is_featured, is_opportunity
) VALUES 
(
    'Merkez Mahallesi 3+1 Daire',
    'Şehir merkezinde, ulaşım imkanları mükemmel, ferah ve aydınlık daire.',
    'Sevim Copler',
    '5453526056',
    (SELECT id FROM users WHERE phone = '5453526056'),
    'Daire',
    '3+1',
    120,
    'Merkez',
    450000,
    'satilik',
    'approved',
    true,
    false
),
(
    'Yeni Mahalle Müstakil Ev',
    'Bahçeli, geniş, aile için ideal müstakil ev.',
    'Sevim Copler', 
    '5453526056',
    (SELECT id FROM users WHERE phone = '5453526056'),
    'Müstakil',
    '4+1',
    200,
    'Yeni Mahalle',
    650000,
    'satilik',
    'approved',
    false,
    true
),
(
    'Çarşı Merkezi Dükkan',
    'İşlek caddede, yüksek kira getirisi olan dükkan.',
    'Sevim Copler',
    '5453526056', 
    (SELECT id FROM users WHERE phone = '5453526056'),
    'Dükkan',
    '1+0',
    50,
    'Çarşı',
    3500,
    'kiralik',
    'approved',
    false,
    false
);

-- 6. Create admin functions for listings
CREATE OR REPLACE FUNCTION public.approve_listing(
    p_listing_id UUID,
    p_admin_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if admin exists and has admin role
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_admin_id AND role = 'admin'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Admin kullanıcı bulunamadı'
        );
    END IF;
    
    -- Update listing status
    UPDATE public.listings
    SET status = 'approved',
        approved_at = now(),
        approved_by = p_admin_id,
        updated_at = now()
    WHERE id = p_listing_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'İlan bulunamadı'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'İlan onaylandı'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_listing(
    p_listing_id UUID,
    p_admin_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if admin exists and has admin role
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_admin_id AND role = 'admin'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Admin kullanıcı bulunamadı'
        );
    END IF;
    
    -- Update listing status
    UPDATE public.listings
    SET status = 'rejected',
        updated_at = now()
    WHERE id = p_listing_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'İlan bulunamadı'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'İlan reddedildi'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_listing(
    p_listing_id UUID,
    p_admin_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if admin exists and has admin role
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = p_admin_id AND role = 'admin'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Admin kullanıcı bulunamadı'
        );
    END IF;
    
    -- Delete listing
    DELETE FROM public.listings WHERE id = p_listing_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'İlan bulunamadı'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'İlan silindi'
    );
END;
$$;