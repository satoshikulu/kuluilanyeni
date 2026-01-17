-- Create listing_interest_counts view for performance optimization
-- Migration: 20250117000002_create_listing_interest_counts_view.sql

-- Drop view if exists (for re-creation)
DROP VIEW IF EXISTS listing_interest_counts;

-- Create view that aggregates interest counts per listing
CREATE VIEW listing_interest_counts AS
SELECT 
  listing_id,
  COUNT(*) as interest_count
FROM listing_interests
GROUP BY listing_id;

-- Add comment for documentation
COMMENT ON VIEW listing_interest_counts IS 'Aggregated view showing interest count per listing for performance optimization';

-- Grant access to authenticated users
GRANT SELECT ON listing_interest_counts TO authenticated;
GRANT SELECT ON listing_interest_counts TO anon;