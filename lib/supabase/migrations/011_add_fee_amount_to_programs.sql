-- Migration: Add fee_amount to programs table
-- Date: 2024-01-XX
-- Description: Add fee amount field to programs for default program fee

ALTER TABLE programs
ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(10, 2);

COMMENT ON COLUMN programs.fee_amount IS 'Default fee amount for this program';

