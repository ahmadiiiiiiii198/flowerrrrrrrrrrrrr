
-- Add a primary key constraint on the key column if it doesn't exist already
ALTER TABLE IF EXISTS settings 
ADD CONSTRAINT IF NOT EXISTS settings_key_pkey PRIMARY KEY (key);

-- Enable RLS on settings table if not already enabled
ALTER TABLE IF EXISTS settings ENABLE ROW LEVEL SECURITY;

-- Create an RLS policy that allows anyone to read settings
DROP POLICY IF EXISTS "Allow public read access to settings" ON settings;
CREATE POLICY "Allow public read access to settings" 
  ON settings 
  FOR SELECT 
  USING (true);

-- Create an RLS policy that allows authenticated users to update settings
DROP POLICY IF EXISTS "Allow authenticated users to update settings" ON settings;
CREATE POLICY "Allow authenticated users to update settings" 
  ON settings 
  FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create an RLS policy that allows authenticated users to insert settings
DROP POLICY IF EXISTS "Allow authenticated users to insert settings" ON settings;
CREATE POLICY "Allow authenticated users to insert settings" 
  ON settings 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');
