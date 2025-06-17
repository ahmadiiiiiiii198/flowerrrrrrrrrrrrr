-- Create category_sections table
CREATE TABLE IF NOT EXISTS category_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  section_type TEXT NOT NULL CHECK (section_type IN ('categories', 'products')),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_category_sections_slug ON category_sections(slug);
CREATE INDEX IF NOT EXISTS idx_category_sections_type ON category_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_category_sections_active ON category_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_category_sections_sort ON category_sections(sort_order);

-- Enable RLS
ALTER TABLE category_sections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow public read access to active sections
CREATE POLICY "Allow public read access to active category sections" 
  ON category_sections 
  FOR SELECT 
  USING (is_active = true);

-- Allow authenticated users full access (for admin)
CREATE POLICY "Allow authenticated users full access to category sections" 
  ON category_sections 
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_category_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_sections_updated_at
  BEFORE UPDATE ON category_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_category_sections_updated_at();

-- Insert some default sections
INSERT INTO category_sections (name, slug, description, section_type, sort_order) VALUES
  ('Wedding Services', 'wedding-services', 'Beautiful arrangements for your special day', 'categories', 1),
  ('Corporate Events', 'corporate-events', 'Professional floral arrangements for business events', 'categories', 2),
  ('Special Occasions', 'special-occasions', 'Flowers for birthdays, anniversaries, and celebrations', 'categories', 3),
  ('Seasonal Collections', 'seasonal-collections', 'Seasonal flower arrangements and bouquets', 'categories', 4),
  ('Featured Products', 'featured-products', 'Our most popular and recommended products', 'products', 1),
  ('New Arrivals', 'new-arrivals', 'Latest additions to our product collection', 'products', 2),
  ('Best Sellers', 'best-sellers', 'Customer favorite products', 'products', 3),
  ('Seasonal Specials', 'seasonal-specials', 'Limited time seasonal product offerings', 'products', 4)
ON CONFLICT (slug) DO NOTHING;
