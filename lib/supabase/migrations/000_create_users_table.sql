-- Migration: Create users table
-- Date: 2024-01-XX
-- Description: Create users table for authentication and multi-tenancy support

-- Create function to automatically update updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  academy_no VARCHAR(50) NOT NULL,
  full_name VARCHAR(255),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_academy_no ON users(academy_no);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default user: username 'aa', password 'aa', academy_no '1'
-- Note: In production, use proper password hashing (bcrypt)
-- For now, storing plain text for simplicity (NOT RECOMMENDED FOR PRODUCTION)
-- You should hash passwords properly before storing
INSERT INTO users (username, password_hash, academy_no, full_name, is_active)
VALUES ('aa', 'aa', '1', 'Default Admin', TRUE)
ON CONFLICT (username) DO NOTHING;

