// Quick Database Initialization Script
// Run this to initialize the database if the admin panel isn't working

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://despodpgvkszyexvcbft.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlc3BvZHBndmtzenlleHZjYmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTcyMTAsImV4cCI6MjA2MzkzMzIxMH0.zyjFQA-Kr317M5l_6qjV_a-6ED2iU4wraRuYaa0iGEg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function initializeSettings() {
  console.log('🚀 Initializing database settings...');
  
  try {
    // Check if settings table exists by trying to query it
    console.log('📋 Checking settings table...');
    const { data: existingSettings, error: checkError } = await supabase
      .from('settings')
      .select('key')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Settings table does not exist or is not accessible:', checkError.message);
      console.log('💡 Please run the Supabase migrations first or use the /database-setup page');
      return false;
    }
    
    console.log('✅ Settings table exists');
    
    // Initialize default settings
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
        key: 'stripeConfig',
        value: {
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
          secretKey: process.env.STRIPE_SECRET_KEY || '',
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
          isTestMode: false
        }
      }
    ];
    
    console.log('📝 Inserting default settings...');
    
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
    
    console.log('🎉 Database initialization complete!');
    console.log('💡 You can now go to the admin panel and configure Stripe settings');
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
}

async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🌸 Francesco Fiori & Piante - Database Initialization');
  console.log('================================================');
  
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('❌ Cannot proceed without database connection');
    return;
  }
  
  const initOk = await initializeSettings();
  if (initOk) {
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Go to http://localhost:8484/admin');
    console.log('2. Click on the "Stripe" tab');
    console.log('3. Enter your Stripe keys and save');
    console.log('4. Test the payment integration');
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { initializeSettings, testConnection };
