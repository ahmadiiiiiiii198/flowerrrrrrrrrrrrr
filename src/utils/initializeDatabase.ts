import { supabase } from '@/integrations/supabase/client';
import { initializeCategories } from './initializeCategories';
import { initializeProducts } from './initializeProducts';

// Initialize settings table structure (CRITICAL - this table is missing!)
async function ensureSettingsTable(): Promise<boolean> {
  try {
    console.log('[InitDB] Ensuring settings table exists...');

    // Try to create the settings table if it doesn't exist
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
        CREATE INDEX IF NOT EXISTS idx_settings_updated_at ON settings(updated_at);

        -- Enable RLS
        ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        DROP POLICY IF EXISTS "Allow public read access to settings" ON settings;
        CREATE POLICY "Allow public read access to settings"
          ON settings
          FOR SELECT
          USING (true);

        DROP POLICY IF EXISTS "Allow authenticated users to update settings" ON settings;
        CREATE POLICY "Allow authenticated users to update settings"
          ON settings
          FOR UPDATE
          USING (auth.role() = 'authenticated')
          WITH CHECK (auth.role() = 'authenticated');

        DROP POLICY IF EXISTS "Allow authenticated users to insert settings" ON settings;
        CREATE POLICY "Allow authenticated users to insert settings"
          ON settings
          FOR INSERT
          WITH CHECK (auth.role() = 'authenticated');
      `
    });

    if (error) {
      console.log('[InitDB] Settings table creation via RPC failed, table might already exist:', error.message);
    } else {
      console.log('[InitDB] Settings table ensured');
    }

    return true;
  } catch (error) {
    console.error('[InitDB] Error ensuring settings table:', error);
    return true; // Continue anyway, table might already exist
  }
}

// Initialize content_sections table structure
async function ensureContentSectionsTable(): Promise<boolean> {
  try {
    console.log('[InitDB] Ensuring content_sections table exists...');

    // Try to create the table if it doesn't exist
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
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

        CREATE INDEX IF NOT EXISTS idx_content_sections_section_key ON content_sections(section_key);
        CREATE INDEX IF NOT EXISTS idx_content_sections_active ON content_sections(is_active);
        CREATE INDEX IF NOT EXISTS idx_content_sections_metadata ON content_sections USING GIN(metadata);
      `
    });

    if (error) {
      console.log('[InitDB] Table creation via RPC failed, table might already exist:', error.message);
    } else {
      console.log('[InitDB] Content sections table ensured');
    }

    return true;
  } catch (error) {
    console.error('[InitDB] Error ensuring content_sections table:', error);
    return true; // Continue anyway, table might already exist
  }
}

// Initialize category content sections in the database
export async function initializeDatabase(): Promise<boolean> {
  try {
    console.log('[InitDB] Starting comprehensive database initialization...');

    // Step 0a: Ensure SETTINGS table exists (CRITICAL!)
    console.log('[InitDB] Step 0a: Ensuring settings table...');
    await ensureSettingsTable();

    // Step 0b: Ensure content_sections table exists
    console.log('[InitDB] Step 0b: Ensuring content_sections table...');
    await ensureContentSectionsTable();

    // Step 1: Initialize categories first
    console.log('[InitDB] Step 1: Initializing categories...');
    const categoriesSuccess = await initializeCategories();
    if (!categoriesSuccess) {
      console.error('[InitDB] Failed to initialize categories');
      return false;
    }
    console.log('[InitDB] Categories initialized successfully');

    // Step 2: Skip product initialization to prevent recreation after deletion
    console.log('[InitDB] Step 2: Skipping product initialization to prevent recreation after deletion');
    console.log('[InitDB] Products initialization skipped successfully');

    // Step 3: Initialize content sections
    console.log('[InitDB] Step 3: Initializing content sections...');

    // Define the content sections for categories and hero
    const categoryContentSections = [
      // Hero content section
      {
        section_key: 'hero_main_content',
        section_name: 'Hero Section - Main Content',
        content_type: 'json',
        content_value: JSON.stringify({
          heading: "Francesco Fiori & Piante",
          subheading: "Scopri l'eleganza floreale firmata Francesco: fiori, piante e creazioni per ogni occasione. 🌸🌿",
          backgroundImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80"
        }),
        metadata: { section: 'hero' },
        is_active: true
      },
      // Category content sections
      {
        section_key: 'category_naturale_images',
        section_name: 'Category Images: Naturale',
        content_type: 'json',
        content_value: JSON.stringify([]), // Empty array to prevent default images
        metadata: { section: 'categories' },
        is_active: true
      },
      {
        section_key: 'category_naturale_features',
        section_name: 'Naturale - Features',
        content_type: 'json',
        content_value: JSON.stringify([
          "Fiori freschi tagliati quotidianamente",
          "Piante da interno e esterno",
          "Composizioni personalizzate",
          "Garanzia di freschezza",
          "Cura e manutenzione inclusa"
        ]),
        metadata: { section: 'categories' },
        is_active: true
      },
      {
        section_key: 'category_naturale_explanation',
        section_name: 'Naturale - Explanation',
        content_type: 'textarea',
        content_value: "Da Francesco Fiori & Piante, troverai un'ampia scelta di fiori freschi di stagione e piante ornamentali per ogni ambiente. Che tu stia cercando una pianta verde per il tuo salotto o un mazzo colorato per sorprendere una persona cara, siamo qui per consigliarti con passione e competenza.",
        metadata: { section: 'categories' },
        is_active: true
      },
      {
        section_key: 'category_finti_images',
        section_name: 'Category Images: Finti',
        content_type: 'json',
        content_value: JSON.stringify([]), // Empty array to prevent default images
        metadata: { section: 'categories' },
        is_active: true
      },
      {
        section_key: 'category_finti_features',
        section_name: 'Finti - Features',
        content_type: 'json',
        content_value: JSON.stringify([
          "Materiali di alta qualità",
          "Aspetto realistico",
          "Nessuna manutenzione richiesta",
          "Durata illimitata",
          "Resistenti agli allergeni",
          "Perfetti per ogni ambiente"
        ]),
        metadata: { section: 'categories' },
        is_active: true
      },
      {
        section_key: 'category_finti_explanation',
        section_name: 'Finti - Explanation',
        content_type: 'textarea',
        content_value: "Per chi desidera la bellezza dei fiori senza pensieri, proponiamo una collezione curata di fiori artificiali di alta qualità. Realistici, eleganti e duraturi, i nostri fiori finti sono perfetti per decorazioni durature, uffici, ristoranti o spazi in cui la manutenzione è difficile.",
        metadata: { section: 'categories' },
        is_active: true
      }
    ];

    // Check if content sections already exist
    const { data: existingSections, error: fetchError } = await supabase
      .from('content_sections')
      .select('section_key')
      .in('section_key', categoryContentSections.map(s => s.section_key));

    if (fetchError) {
      console.error('[InitDB] Error checking existing sections:', fetchError);
      return false;
    }

    const existingKeys = existingSections?.map(s => s.section_key) || [];
    const sectionsToInsert = categoryContentSections.filter(
      section => !existingKeys.includes(section.section_key)
    );

    if (sectionsToInsert.length === 0) {
      console.log('[InitDB] All category content sections already exist');
      return true;
    }

    console.log(`[InitDB] Inserting ${sectionsToInsert.length} new content sections...`);

    // Insert new content sections
    const { data: insertedData, error: insertError } = await supabase
      .from('content_sections')
      .insert(sectionsToInsert)
      .select();

    if (insertError) {
      console.error('[InitDB] Error inserting content sections:', insertError);
      return false;
    }

    console.log('[InitDB] Successfully inserted content sections:', insertedData);

    // Step 4: Initialize default settings
    console.log('[InitDB] Step 4: Initializing default settings...');
    await initializeDefaultSettings();

    return true;
  } catch (error) {
    console.error('[InitDB] Error in initializeDatabase:', error);
    return false;
  }
}

// Initialize default settings in the settings table
async function initializeDefaultSettings(): Promise<boolean> {
  try {
    console.log('[InitDB] Initializing default settings...');

    const defaultSettings = [
      {
        key: 'heroContent',
        value: {
          heading: "Francesco Fiori & Piante",
          subheading: "Scopri l'eleganza floreale firmata Francesco: fiori, piante e creazioni per ogni occasione. 🌸🌿",
          backgroundImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80"
        }
      },
      {
        key: 'logoSettings',
        value: {
          logoUrl: "https://despodpgvkszyexvcbft.supabase.co/storage/v1/object/public/uploads/logos/1749735172947-oi6nr6gnk7.png",
          altText: "Francesco Fiori & Piante Logo"
        }
      },
      {
        key: 'aboutContent',
        value: {
          heading: "Chi Siamo",
          subheading: "Passione per la bellezza naturale e l'arte floreale",
          backgroundImage: "",
          backgroundColor: "#FEF7CD",
          paragraphs: [
            "Francesco Fiori & Piante offre composizioni floreali per ogni occasione. Troverai fiori freschi, piante naturali e composizioni artificiali di alta qualità. Situati all'interno del Mercato di Porta Palazzo a Torino, portiamo esperienza artigianale e passione per la bellezza naturale."
          ]
        }
      },
      {
        key: 'restaurantSettings',
        value: {
          totalSeats: 50,
          reservationDuration: 120,
          openingTime: "11:30",
          closingTime: "22:00",
          languages: ["it", "en", "ar", "fa"],
          defaultLanguage: "it"
        }
      },
      {
        key: 'contactContent',
        value: {
          address: "Piazza della Repubblica, 10100 Torino TO",
          phone: "+393498851455",
          email: "Dbrfnc56m31@gmail.com",
          mapUrl: "https://maps.google.com",
          hours: "Lun-Dom: 08:00 - 19:00"
        }
      },
      {
        key: 'businessHours',
        value: {
          monday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
          tuesday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
          wednesday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
          thursday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
          friday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
          saturday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
          sunday: { isOpen: true, openTime: '08:00', closeTime: '19:00' }
        }
      }
    ];

    // Check which settings already exist
    const { data: existingSettings, error: fetchError } = await supabase
      .from('settings')
      .select('key')
      .in('key', defaultSettings.map(s => s.key));

    if (fetchError) {
      console.error('[InitDB] Error checking existing settings:', fetchError);
      return false;
    }

    const existingKeys = existingSettings?.map(s => s.key) || [];
    const settingsToInsert = defaultSettings.filter(
      setting => !existingKeys.includes(setting.key)
    );

    if (settingsToInsert.length === 0) {
      console.log('[InitDB] All default settings already exist');
      return true;
    }

    console.log(`[InitDB] Inserting ${settingsToInsert.length} new settings...`);

    // Insert new settings
    const { error: insertError } = await supabase
      .from('settings')
      .insert(settingsToInsert);

    if (insertError) {
      console.error('[InitDB] Error inserting settings:', insertError);
      return false;
    }

    console.log('[InitDB] Successfully inserted default settings');
    return true;
  } catch (error) {
    console.error('[InitDB] Error in initializeDefaultSettings:', error);
    return false;
  }
}

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log('[InitDB] Testing database connection...');
    
    const { data, error } = await supabase
      .from('content_sections')
      .select('count')
      .limit(1);

    if (error) {
      console.error('[InitDB] Database connection failed:', error);
      return false;
    }

    console.log('[InitDB] Database connection successful');
    return true;
  } catch (error) {
    console.error('[InitDB] Database connection error:', error);
    return false;
  }
}
