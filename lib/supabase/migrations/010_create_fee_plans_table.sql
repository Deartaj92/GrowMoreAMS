-- Migration: Create fee_plans table (simplified - no fee heads)
-- Date: 2024-01-XX
-- Description: Create fee plans table for managing student-specific fee plans with discounts based on program fee

CREATE TABLE IF NOT EXISTS fee_plans (
  id SERIAL PRIMARY KEY,
  academy_no VARCHAR(50) NOT NULL,
  student_id INTEGER NOT NULL,
  program_id INTEGER NOT NULL,
  actual_fee DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  fee_after_discount DECIMAL(10,2) NOT NULL,
  effective_from DATE NOT NULL,
  discount_type VARCHAR(50),
  discount_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  created_by INTEGER,
  updated_by INTEGER,
  UNIQUE(academy_no, student_id, program_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fee_plans_academy_no ON fee_plans(academy_no);
CREATE INDEX IF NOT EXISTS idx_fee_plans_student_id ON fee_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_plans_program_id ON fee_plans(program_id);

CREATE TRIGGER update_fee_plans_updated_at
  BEFORE UPDATE ON fee_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
