-- Create fee_challans table
CREATE TABLE IF NOT EXISTS fee_challans (
  id SERIAL PRIMARY KEY,
  academy_no VARCHAR(50) NOT NULL,
  fee_plan_id INTEGER NOT NULL REFERENCES fee_plans(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  challan_number VARCHAR(50) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_date DATE,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(academy_no, challan_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fee_challans_academy_no ON fee_challans(academy_no);
CREATE INDEX IF NOT EXISTS idx_fee_challans_fee_plan_id ON fee_challans(fee_plan_id);
CREATE INDEX IF NOT EXISTS idx_fee_challans_student_id ON fee_challans(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_challans_program_id ON fee_challans(program_id);
CREATE INDEX IF NOT EXISTS idx_fee_challans_status ON fee_challans(status);
CREATE INDEX IF NOT EXISTS idx_fee_challans_issue_date ON fee_challans(issue_date);
CREATE INDEX IF NOT EXISTS idx_fee_challans_challan_number ON fee_challans(challan_number);

-- Add trigger for updated_at
CREATE TRIGGER update_fee_challans_updated_at
  BEFORE UPDATE ON fee_challans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

