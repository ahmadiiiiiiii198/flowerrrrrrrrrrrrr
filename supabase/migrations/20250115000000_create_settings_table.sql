-- Create settings table (this is the MISSING table that the entire app depends on!)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_updated_at ON settings(updated_at);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow public read access to settings
CREATE POLICY "Allow public read access to settings" 
  ON settings 
  FOR SELECT 
  USING (true);

-- Allow authenticated users to update settings
CREATE POLICY "Allow authenticated users to update settings" 
  ON settings 
  FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to insert settings
CREATE POLICY "Allow authenticated users to insert settings" 
  ON settings 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete settings
CREATE POLICY "Allow authenticated users to delete settings" 
  ON settings 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

-- Insert default hero content and other essential settings
INSERT INTO settings (key, value) VALUES
  (
    'heroContent',
    '{"heading": "Francesco Fiori & Piante", "subheading": "Scopri l\'eleganza floreale firmata Francesco: fiori, piante e creazioni per ogni occasione. 🌸🌿", "backgroundImage": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80"}'
  ),
  (
    'logoSettings',
    '{"logoUrl": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80", "altText": "Francesco Fiori & Piante Logo"}'
  ),
  (
    'aboutContent',
    '{"heading": "Chi Siamo", "subheading": "Passione per la bellezza naturale e l\'arte floreale", "backgroundImage": "", "backgroundColor": "#FEF7CD", "paragraphs": ["Francesco Fiori & Piante offre composizioni floreali per ogni occasione, dai funerali ai matrimoni. Troverai fiori freschi, piante da interno ed esterno, fiori finti di alta qualità e servizi su misura. Situati all\'interno del Mercato di Porta Palazzo a Torino, portiamo esperienza artigianale e passione per la bellezza naturale."]}'
  ),
  (
    'restaurantSettings',
    '{"totalSeats": 50, "reservationDuration": 120, "openingTime": "11:30", "closingTime": "22:00", "languages": ["it", "en", "ar", "fa"], "defaultLanguage": "it"}'
  ),
  (
    'contactContent',
    '{"address": "Piazza della Repubblica, 10100 Torino TO", "phone": "+393498851455", "email": "Dbrfnc56m31@gmail.com", "mapUrl": "https://maps.google.com", "hours": "Lun-Dom: 08:00 - 19:00"}'
  ),
  (
    'businessHours',
    '{"monday": {"isOpen": true, "openTime": "08:00", "closeTime": "19:00"}, "tuesday": {"isOpen": true, "openTime": "08:00", "closeTime": "19:00"}, "wednesday": {"isOpen": true, "openTime": "08:00", "closeTime": "19:00"}, "thursday": {"isOpen": true, "openTime": "08:00", "closeTime": "19:00"}, "friday": {"isOpen": true, "openTime": "08:00", "closeTime": "19:00"}, "saturday": {"isOpen": true, "openTime": "08:00", "closeTime": "19:00"}, "sunday": {"isOpen": true, "openTime": "08:00", "closeTime": "19:00"}}'
  ),
  (
    'galleryContent',
    '{"heading": "La Nostra Galleria", "subheading": "Scopri le nostre creazioni floreali"}'
  ),
  (
    'galleryImages',
    '[]'
  ),
  (
    'popups',
    '[]'
  ),
  (
    'reservations',
    '[]'
  )
ON CONFLICT (key) DO NOTHING;
