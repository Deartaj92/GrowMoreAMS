-- Migration: Create student_programs table
-- Date: 2024-01-XX
-- Description: Junction table to track which students are enrolled in which programs

CREATE TABLE IF NOT EXISTS student_programs (
  id SERIAL PRIMARY KEY,
  academy_no VARCHAR(50) NOT NULL,
  student_id INTEGER NOT NULL,
  program_id INTEGER NOT NULL,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(academy_no, student_id, program_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_student_programs_academy_no ON student_programs(academy_no);
CREATE INDEX IF NOT EXISTS idx_student_programs_student_id ON student_programs(student_id);
CREATE INDEX IF NOT EXISTS idx_student_programs_program_id ON student_programs(program_id);
CREATE INDEX IF NOT EXISTS idx_student_programs_status ON student_programs(status);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_student_programs_updated_at
  BEFORE UPDATE ON student_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

