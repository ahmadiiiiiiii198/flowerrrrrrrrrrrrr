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

    // Step 2: Initialize products (depends on categories)
    console.log('[InitDB] Step 2: Initializing products...');
    const productsSuccess = await initializeProducts();
    if (!productsSuccess) {
      console.error('[InitDB] Failed to initialize products');
      return false;
    }
    console.log('[InitDB] Products initialized successfully');

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
        section_key: 'category_matrimoni_images',
        section_name: 'Category Images: Matrimoni',
        content_type: 'json',
        content_value: JSON.stringify([
          "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1521543298264-785fba19d562?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
        ]),
        metadata: { section: 'categories' },
        is_active: true
      },
      {
        section_key: 'category_matrimoni_features',
        section_name: 'Matrimoni - Features',
        content_type: 'json',
        content_value: JSON.stringify([
          "Consulenza personalizzata",
          "Bouquet sposa e damigelle",
          "Allestimenti chiesa e location",
          "Centrotavola e decorazioni",
          "Addobbi floreali completi",
          "Servizio completo per matrimoni"
        ]),
        metadata: { section: 'categories' },
        is_active: true
      },
      {
        section_key: 'category_matrimoni_explanation',
        section_name: 'Matrimoni - Explanation',
        content_type: 'textarea',
        content_value: "Rendiamo unico il giorno più importante della tua vita con allestimenti floreali personalizzati per matrimoni. Bouquet da sposa, centrotavola, archi floreali e decorazioni per chiesa e location: tutto viene progettato su misura per raccontare la vostra storia d'amore con i fiori.",
        metadata: { section: 'categories' },
        is_active: true
      },
      {
        section_key: 'category_fiori_piante_images',
        section_name: 'Category Images: Fiori & Piante',
        content_type: 'json',
        content_value: JSON.stringify([
          "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1518335935020-cfd6580c1ab4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
        ]),
        metadata: { section: 'categories' },
        is_active: true
      },
      {
        section_key: 'category_fiori_finti_images',
        section_name: 'Category Images: Fiori Finti',
        content_type: 'json',
        content_value: JSON.stringify([
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1502780402662-acc01917738e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
        ]),
        metadata: { section: 'categories' },
        is_active: true
      },
      {
        section_key: 'category_funerali_images',
        section_name: 'Category Images: Funerali',
        content_type: 'json',
        content_value: JSON.stringify([
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1595207759571-3a4df3c49230?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1490750967868-88aa4486c946?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1583160247711-2191776b4b91?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
        ]),
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
            "Francesco Fiori & Piante offre composizioni floreali per ogni occasione, dai funerali ai matrimoni. Troverai fiori freschi, piante da interno ed esterno, fiori finti di alta qualità e servizi su misura. Situati all'interno del Mercato di Porta Palazzo a Torino, portiamo esperienza artigianale e passione per la bellezza naturale."
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
