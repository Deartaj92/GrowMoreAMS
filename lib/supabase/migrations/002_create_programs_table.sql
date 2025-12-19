-- Migration: Create programs table
-- Date: 2024-01-XX
-- Description: Create programs table for managing courses/programs offered with multi-tenancy support

-- Create function to automatically update updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE IF NOT EXISTS programs (
  id SERIAL PRIMARY KEY,
  academy_no VARCHAR(50) NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER,
  duration_unit VARCHAR(10) CHECK (duration_unit IN ('years', 'months')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(academy_no, code)
);

CREATE INDEX IF NOT EXISTS idx_programs_academy_no ON programs(academy_no);
CREATE INDEX IF NOT EXISTS idx_programs_code ON programs(code);
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_academy_code ON programs(academy_no, code);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON programs
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

