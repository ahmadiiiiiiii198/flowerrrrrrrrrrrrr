-- Create content_sections table
CREATE TABLE IF NOT EXISTS content_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  section_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_value TEXT,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_sections_section_key ON content_sections(section_key);
CREATE INDEX IF NOT EXISTS idx_content_sections_active ON content_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_content_sections_metadata ON content_sections USING GIN(metadata);

-- Enable RLS
ALTER TABLE content_sections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow public read access to active sections
CREATE POLICY "Allow public read access to active content sections" 
  ON content_sections 
  FOR SELECT 
  USING (is_active = true);

-- Allow authenticated users full access (for admin)
CREATE POLICY "Allow authenticated users full access to content sections" 
  ON content_sections 
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_sections_updated_at
  BEFORE UPDATE ON content_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_content_sections_updated_at();

-- Insert some default hero content sections
INSERT INTO content_sections (section_key, section_name, content_type, content_value, metadata, is_active) VALUES
  (
    'hero_main_content',
    'Hero Section - Main Content',
    'json',
    '{"heading": "Francesco Fiori & Piante", "subheading": "Scopri l\'eleganza floreale firmata Francesco: fiori, piante e creazioni per ogni occasione. 🌸🌿", "backgroundImage": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80"}',
    '{"section": "hero"}',
    true
  ),
  (
    'about_main_content',
    'About Section - Main Content',
    'json',
    '{"heading": "Chi Siamo", "content": "Francesco Fiori & Piante offre composizioni floreali per ogni occasione, dai funerali ai matrimoni. Troverai fiori freschi, piante da interno ed esterno, fiori finti di alta qualità e servizi su misura. Situati all\'interno del Mercato di Porta Palazzo a Torino, portiamo esperienza artigianale e passione per la bellezza naturale."}',
    '{"section": "about"}',
    true
  ),
  (
    'categories_main_content',
    'Categories Section - Main Content',
    'json',
    '{"heading": "Le Nostre Categorie", "subheading": "Scopri la nostra ampia gamma di prodotti e servizi"}',
    '{"section": "categories"}',
    true
  )
ON CONFLICT (section_key) DO NOTHING;
