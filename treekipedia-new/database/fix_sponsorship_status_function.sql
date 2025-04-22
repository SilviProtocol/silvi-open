-- Fix sponsorship_status function
-- This script ensures that the get_sponsorship_status function exists and has the correct signature

-- Drop the existing function first to allow changing the return type
DROP FUNCTION IF EXISTS get_sponsorship_status(TEXT);

-- Create or replace the function to fix any potential issues
CREATE OR REPLACE FUNCTION get_sponsorship_status(tx_hash TEXT)
RETURNS TABLE (
  transaction_hash TEXT,
  status CHARACTER VARYING(50),  -- Changed from TEXT to match column type
  total_amount NUMERIC,
  wallet_address TEXT,
  chain TEXT,
  payment_timestamp TIMESTAMP WITH TIME ZONE,
  species_count BIGINT,
  completed_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.transaction_hash,
    s.status,
    s.total_amount,
    s.wallet_address,
    s.chain,
    s.payment_timestamp,
    COUNT(si.id) AS species_count,
    COUNT(CASE WHEN si.research_status = 'completed' THEN 1 END) AS completed_count
  FROM 
    sponsorships s
  LEFT JOIN 
    sponsorship_items si ON s.id = si.sponsorship_id
  WHERE 
    s.transaction_hash = tx_hash
  GROUP BY 
    s.id, s.transaction_hash, s.status, s.total_amount, s.wallet_address, s.chain, s.payment_timestamp;
END;
$$ LANGUAGE plpgsql;

-- Add comment to the function for documentation
COMMENT ON FUNCTION get_sponsorship_status(TEXT) IS 'Returns detailed status for a sponsorship by transaction hash';

-- Verify function exists after creation
SELECT pg_get_functiondef('get_sponsorship_status'::regproc);

