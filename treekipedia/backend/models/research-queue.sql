-- Create the research queue tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS species_research_queue (
  taxon_id VARCHAR(255) PRIMARY KEY,
  species_scientific_name VARCHAR(255) NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  transaction_hash VARCHAR(255) NOT NULL,
  chain VARCHAR(50) NOT NULL,
  research_status VARCHAR(50) NOT NULL DEFAULT 'queued',  -- queued, processing, completed, failed
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on status for quick lookups
CREATE INDEX IF NOT EXISTS idx_research_queue_status ON species_research_queue(research_status);

-- Create index on wallet_address for quick lookups
CREATE INDEX IF NOT EXISTS idx_research_queue_wallet ON species_research_queue(wallet_address);

-- Add tracking table functions and triggers
CREATE OR REPLACE FUNCTION update_species_research_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger
DROP TRIGGER IF EXISTS update_species_research_queue_timestamp ON species_research_queue;
CREATE TRIGGER update_species_research_queue_timestamp
BEFORE UPDATE ON species_research_queue
FOR EACH ROW
EXECUTE FUNCTION update_species_research_queue_updated_at();