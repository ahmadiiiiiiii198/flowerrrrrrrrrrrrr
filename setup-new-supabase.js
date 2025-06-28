#!/usr/bin/env node

/**
 * Automated Supabase Project Setup Script
 * This script will completely set up your new Supabase database with all required tables and data
 * Run this after getting your anon key from the Supabase dashboard
 */

import { createClient } from '@supabase/supabase-js';

// New Supabase project configuration
const SUPABASE_URL = 'https://ijhuoolcnxbdvpqmqofo.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'; // Get this from: https://supabase.com/dashboard/project/ijhuoolcnxbdvpqmqofo/settings/api

console.log('🚀 Automated Supabase Project Setup');
console.log('=====================================');
console.log('📍 Project URL:', SUPABASE_URL);
console.log('🎯 This will set up your complete flower shop database');
console.log('');

async function setupDatabase() {
  if (SUPABASE_ANON_KEY === 'YOUR_ANON_KEY_HERE') {
    console.log('❌ Please update the SUPABASE_ANON_KEY in this script first!');
    console.log('📝 Get your anon key from: https://supabase.com/dashboard/project/ijhuoolcnxbdvpqmqofo/settings/api');
    return false;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    console.log('📋 Creating database tables...');

    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('settings')
      .select('*')
      .limit(1);

    if (testError && testError.message.includes('relation "settings" does not exist')) {
      console.log('⚠️  Tables do not exist yet. You need to run the SQL migrations first.');
      console.log('📝 Please run the following SQL in your Supabase SQL editor:');
      console.log('');
      console.log('-- 1. Create settings table');
      console.log(`CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to settings"
  ON settings FOR SELECT USING (true);`);
      
      console.log('');
      console.log('-- 2. Create categories table');
      console.log(`CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to categories"
  ON categories FOR SELECT USING (true);`);

      console.log('');
      console.log('-- 3. Create products table');
      console.log(`CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT USING (true);`);

      console.log('');
      console.log('-- 4. Create orders table');
      console.log(`CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  paid_amount DECIMAL(10,2),
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to orders"
  ON orders FOR SELECT USING (true);`);

      console.log('');
      console.log('-- 5. Create order_items table');
      console.log(`CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to order_items"
  ON order_items FOR SELECT USING (true);`);

      console.log('');
      console.log('🔄 After running the SQL above, run this script again to populate data.');
      return false;
    }

    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return false;
    }

    console.log('✅ Database connection successful!');

    // Insert default settings
    console.log('📝 Inserting default settings...');
    
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
          logoUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
          altText: "Francesco Fiori & Piante Logo"
        }
      },
      {
        key: 'contactContent',
        value: {
          phone: "+393498851455",
          email: "Dbrfnc56m31@gmail.com",
          address: "Piazza della Repubblica, 10100 Torino TO",
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
      },
      {
        key: 'stripeConfig',
        value: {
          publishableKey: "YOUR_STRIPE_PUBLISHABLE_KEY_HERE",
          secretKey: "YOUR_STRIPE_SECRET_KEY_HERE",
          webhookSecret: "",
          isTestMode: false
        }
      }
    ];

    for (const setting of defaultSettings) {
      const { data, error } = await supabase
        .from('settings')
        .upsert({
          key: setting.key,
          value: setting.value,
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error(`❌ Failed to insert ${setting.key}:`, error.message);
      } else {
        console.log(`✅ Inserted/updated ${setting.key}`);
      }
    }

    // Insert default categories
    console.log('📂 Inserting default categories...');
    
    const defaultCategories = [
      { name: 'Matrimoni', description: 'Bouquet e decorazioni floreali per matrimoni', image_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', sort_order: 1 },
      { name: 'Funerali', description: 'Composizioni floreali per cerimonie funebri', image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', sort_order: 2 },
      { name: 'Compleanni', description: 'Bouquet e composizioni per compleanni', image_url: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', sort_order: 3 },
      { name: 'Anniversari', description: 'Fiori romantici per anniversari', image_url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', sort_order: 4 },
      { name: 'San Valentino', description: 'Rose e bouquet romantici per San Valentino', image_url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', sort_order: 5 },
      { name: 'Piante da Interno', description: 'Piante verdi per decorare gli interni', image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', sort_order: 6 }
    ];

    for (const category of defaultCategories) {
      const { data, error } = await supabase
        .from('categories')
        .upsert(category)
        .select();
      
      if (error) {
        console.error(`❌ Failed to insert category ${category.name}:`, error.message);
      } else {
        console.log(`✅ Inserted/updated category: ${category.name}`);
      }
    }

    console.log('🎉 Database setup complete!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Update your project configuration with the new Supabase URL');
    console.log('2. Deploy Edge Functions for Stripe integration');
    console.log('3. Test the application');
    
    return true;
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// Run the setup
setupDatabase().then(success => {
  if (success) {
    console.log('✅ Setup completed successfully!');
  } else {
    console.log('❌ Setup failed. Please check the instructions above.');
  }
});
