-- Add paid_amount column to fee_challans table for partial payments
ALTER TABLE fee_challans 
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0;

-- Update status check constraint to include 'partially_paid'
ALTER TABLE fee_challans 
DROP CONSTRAINT IF EXISTS fee_challans_status_check;

ALTER TABLE fee_challans 
ADD CONSTRAINT fee_challans_status_check 
CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'partially_paid'));

-- Update existing records: if status is 'paid', set paid_amount = amount
UPDATE fee_challans 
SET paid_amount = amount 
WHERE status = 'paid' AND (paid_amount IS NULL OR paid_amount = 0);

