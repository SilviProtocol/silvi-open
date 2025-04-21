-- Payment Schema Update for Treekipedia
-- Creates tables to track sponsorships and link them to species and NFTs

-- Add sponsorship flag to species table
ALTER TABLE public.species
ADD COLUMN IF NOT EXISTS sponsored BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sponsored_by TEXT,
ADD COLUMN IF NOT EXISTS sponsored_at TIMESTAMP WITH TIME ZONE;

-- Create sponsorships table (one record per payment transaction)
CREATE TABLE IF NOT EXISTS public.sponsorships (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  transaction_hash TEXT NOT NULL UNIQUE,
  total_amount NUMERIC NOT NULL,
  payment_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sponsorship_items table (one record per species funded)
CREATE TABLE IF NOT EXISTS public.sponsorship_items (
  id SERIAL PRIMARY KEY,
  sponsorship_id INTEGER NOT NULL REFERENCES sponsorships(id) ON DELETE CASCADE,
  taxon_id TEXT NOT NULL REFERENCES species(taxon_id),
  amount NUMERIC NOT NULL DEFAULT 3, -- Default to 3 USDC
  research_status VARCHAR(50) DEFAULT 'pending',
  nft_token_id BIGINT,
  ipfs_cid TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sponsorship_id, taxon_id) -- Prevent duplicate species in the same sponsorship
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_sponsorships_wallet_address ON public.sponsorships(wallet_address);
CREATE INDEX IF NOT EXISTS idx_sponsorships_transaction_hash ON public.sponsorships(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_sponsorship_items_taxon_id ON public.sponsorship_items(taxon_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_items_sponsorship_id ON public.sponsorship_items(sponsorship_id);

-- Create function to update species sponsorship status when a sponsorship item is completed
CREATE OR REPLACE FUNCTION update_species_sponsorship_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If the research status is changed to 'completed'
  IF NEW.research_status = 'completed' AND OLD.research_status != 'completed' THEN
    -- Get the sponsorship record to access wallet_address and timestamp
    DECLARE
      sp_record RECORD;
    BEGIN
      SELECT * INTO sp_record FROM sponsorships WHERE id = NEW.sponsorship_id;
      
      -- Update the species table to show it's been sponsored
      UPDATE species 
      SET sponsored = TRUE, 
          sponsored_by = sp_record.wallet_address,
          sponsored_at = sp_record.payment_timestamp
      WHERE taxon_id = NEW.taxon_id;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS trigger_update_species_sponsorship ON public.sponsorship_items;

-- Create trigger to call the function when a sponsorship item is updated
CREATE TRIGGER trigger_update_species_sponsorship
AFTER UPDATE ON sponsorship_items
FOR EACH ROW
EXECUTE FUNCTION update_species_sponsorship_status();

-- Create a function to get sponsorship status by transaction hash
CREATE OR REPLACE FUNCTION get_sponsorship_status(tx_hash TEXT)
RETURNS TABLE (
  transaction_hash TEXT,
  status TEXT,
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

-- Create a view for easier querying of sponsorship summary data
CREATE OR REPLACE VIEW sponsorship_summary AS
SELECT 
  s.id AS sponsorship_id,
  s.wallet_address,
  s.chain,
  s.transaction_hash,
  s.total_amount,
  s.payment_timestamp,
  s.status AS payment_status,
  COUNT(si.id) AS species_count,
  SUM(CASE WHEN si.research_status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
  array_agg(si.taxon_id) AS taxon_ids
FROM 
  sponsorships s
LEFT JOIN 
  sponsorship_items si ON s.id = si.sponsorship_id
GROUP BY 
  s.id, s.wallet_address, s.chain, s.transaction_hash, s.total_amount, s.payment_timestamp, s.status;

-- Comment on new objects
COMMENT ON TABLE sponsorships IS 'Records of payment transactions for species research sponsorship';
COMMENT ON TABLE sponsorship_items IS 'Individual species funded through sponsorship transactions';
COMMENT ON FUNCTION update_species_sponsorship_status() IS 'Updates species table when research for a sponsored species is completed';
COMMENT ON FUNCTION get_sponsorship_status(TEXT) IS 'Returns detailed status for a sponsorship by transaction hash';
COMMENT ON VIEW sponsorship_summary IS 'Provides a summary view of all sponsorships with species counts';