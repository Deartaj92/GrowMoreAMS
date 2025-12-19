-- Create fee_payments table to track individual payment transactions
CREATE TABLE IF NOT EXISTS fee_payments (
  id SERIAL PRIMARY KEY,
  academy_no VARCHAR(50) NOT NULL,
  challan_id INTEGER NOT NULL REFERENCES fee_challans(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fee_payments_academy_no ON fee_payments(academy_no);
CREATE INDEX IF NOT EXISTS idx_fee_payments_challan_id ON fee_payments(challan_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_payment_date ON fee_payments(payment_date);

-- Add trigger for updated_at
CREATE TRIGGER update_fee_payments_updated_at
  BEFORE UPDATE ON fee_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

