-- Migration: Update students table fields
-- Date: 2024-01-XX
-- Description: Update students table to replace previous_school/previous_id with qualification_class and update nationality constraint

-- Drop old columns if they exist
ALTER TABLE students DROP COLUMN IF EXISTS previous_school;
ALTER TABLE students DROP COLUMN IF EXISTS previous_id;

-- Add new qualification_class column if it doesn't exist
ALTER TABLE students ADD COLUMN IF NOT EXISTS qualification_class VARCHAR(255);

-- Update nationality constraint
-- First, update any existing records that don't match the new constraint
UPDATE students 
SET nationality = 'Other' 
WHERE nationality IS NOT NULL AND nationality NOT IN ('Pakistani', 'Afghan', 'Other');

-- Drop any existing nationality constraint (handle different constraint names)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'students' 
        AND constraint_type = 'CHECK'
        AND constraint_name LIKE '%nationality%'
    ) LOOP
        EXECUTE 'ALTER TABLE students DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- Add new nationality constraint
ALTER TABLE students ADD CONSTRAINT students_nationality_check 
  CHECK (nationality IS NULL OR nationality IN ('Pakistani', 'Afghan', 'Other'));

-- Set default if not already set
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' 
        AND column_name = 'nationality' 
        AND column_default = '''Pakistani''::character varying'
    ) THEN
        ALTER TABLE students ALTER COLUMN nationality SET DEFAULT 'Pakistani';
    END IF;
END $$;

