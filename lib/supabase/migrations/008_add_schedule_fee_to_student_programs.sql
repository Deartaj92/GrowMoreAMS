-- Migration: Add schedule_id and fee_amount to student_programs table
-- Date: 2024-01-XX
-- Description: Add schedule and fee amount fields to track which schedule and fee for each program assignment

-- Add schedule_id column (nullable, as it's optional)
ALTER TABLE student_programs
ADD COLUMN IF NOT EXISTS schedule_id INTEGER;

-- Add fee_amount column (nullable, as it's optional)
ALTER TABLE student_programs
ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(10, 2);

-- Add foreign key constraint for schedule_id
ALTER TABLE student_programs
ADD CONSTRAINT fk_student_programs_schedule
FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE SET NULL;

-- Create index for schedule_id
CREATE INDEX IF NOT EXISTS idx_student_programs_schedule_id ON student_programs(schedule_id);

