-- Students table for Grow More AMS
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  academy_no VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  admission_date DATE,
  notification_channel VARCHAR(20) DEFAULT 'whatsapp' CHECK (notification_channel IN ('whatsapp', 'sms')),
  picture_url TEXT,
  dob DATE,
  student_id VARCHAR(100), -- Form B / NIC
  gender VARCHAR(20) DEFAULT 'Male' CHECK (gender IN ('Male', 'Female', 'Other')),
  "cast" VARCHAR(100),
  orphan VARCHAR(255),
  osc VARCHAR(100), -- OSC Number
  id_mark VARCHAR(255), -- Identification Mark
  blood_group VARCHAR(10) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown')),
  qualification_class VARCHAR(255), -- Qualification/Class
  religion VARCHAR(50) DEFAULT 'Muslim' CHECK (religion IN ('Muslim', 'Christianity', 'Hinduism', 'Sikhism', 'Other')),
  nationality VARCHAR(50) DEFAULT 'Pakistani' CHECK (nationality IN ('Pakistani', 'Afghan', 'Other')),
  disease VARCHAR(255),
  additional_note TEXT,
  total_siblings INTEGER,
  address TEXT,
  -- Father/Guardian Information
  father_name VARCHAR(255),
  father_national_id VARCHAR(50),
  father_education VARCHAR(255),
  father_mobile VARCHAR(20),
  father_occupation VARCHAR(255),
  father_income DECIMAL(12, 2),
  -- Mother Information
  mother_name VARCHAR(255),
  mother_national_id VARCHAR(50),
  mother_education VARCHAR(255),
  mother_mobile VARCHAR(20),
  mother_occupation VARCHAR(255),
  mother_income DECIMAL(12, 2),
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index on academy_no for multi-tenancy
CREATE INDEX IF NOT EXISTS idx_students_academy_no ON students(academy_no);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- Create index on father_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_father_name ON students(father_name);

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
-- Adjust this based on your security requirements
CREATE POLICY "Allow all operations for authenticated users" ON students
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Programs table for managing courses/programs offered
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

-- Create index on academy_no for multi-tenancy
CREATE INDEX IF NOT EXISTS idx_programs_academy_no ON programs(academy_no);

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_programs_code ON programs(code);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);

-- Composite index for academy_no and code
CREATE INDEX IF NOT EXISTS idx_programs_academy_code ON programs(academy_no, code);

-- Enable Row Level Security (RLS)
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON programs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger to automatically update updated_at for programs
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

