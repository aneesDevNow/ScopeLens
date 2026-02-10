-- Migration: Add claim_hours and claim_deadline columns to license_keys
-- Run this in Supabase SQL Editor or via psql

ALTER TABLE license_keys ADD COLUMN IF NOT EXISTS claim_hours INTEGER DEFAULT 24;
ALTER TABLE license_keys ADD COLUMN IF NOT EXISTS claim_deadline TIMESTAMPTZ;

-- Verify
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'license_keys' 
AND column_name IN ('claim_hours', 'claim_deadline');
