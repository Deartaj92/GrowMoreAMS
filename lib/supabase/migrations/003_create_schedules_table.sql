-- Migration: Create schedules table
-- Date: 2024-01-XX
-- Description: Create schedules table for managing class timings per day of week for programs

CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  academy_no VARCHAR(50) NOT NULL,
  program_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_name VARCHAR(255),
  instructor_name VARCHAR(255),
  room_number VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
  -- Note: No unique constraint to allow overlapping schedules
  -- Multiple classes can run at the same time for the same program
);

CREATE INDEX IF NOT EXISTS idx_schedules_academy_no ON schedules(academy_no);
CREATE INDEX IF NOT EXISTS idx_schedules_program_id ON schedules(program_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day_of_week ON schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedules_is_active ON schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_schedules_academy_program ON schedules(academy_no, program_id);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON schedules
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

