// Script to add business hours to existing database
// Run this if you already have a database and need to add the business hours setting

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ijhuoolcnxbdvpqmqofo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaHVvb2xjbnhiZHZwcW1xb2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTE4NjcsImV4cCI6MjA2NjQyNzg2N30.EaZDYYQzNJhUl8NiTHITUzApsm6NyUO4Bnzz5EexVAA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function addBusinessHours() {
  console.log('🕒 Adding business hours to database...');
  
  try {
    // Check if business hours already exist
    const { data: existingHours, error: checkError } = await supabase
      .from('settings')
      .select('key')
      .eq('key', 'businessHours')
      .single();
    
    if (existingHours) {
      console.log('✅ Business hours already exist in database');
      return true;
    }
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking for existing business hours:', checkError.message);
      return false;
    }
    
    // Default business hours - open 8:00-19:00 every day
    const defaultBusinessHours = {
      monday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
      tuesday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
      wednesday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
      thursday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
      friday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
      saturday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
      sunday: { isOpen: true, openTime: '08:00', closeTime: '19:00' }
    };
    
    console.log('📝 Inserting default business hours...');
    
    const { data, error } = await supabase
      .from('settings')
      .insert({
        key: 'businessHours',
        value: defaultBusinessHours,
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('❌ Failed to insert business hours:', error.message);
      return false;
    }
    
    console.log('✅ Business hours added successfully!');
    console.log('📋 Default hours: Monday-Sunday 08:00-19:00 (all days open)');
    
    // Also update the contact content hours string to match
    console.log('🔄 Updating contact content hours string...');
    
    const { data: contactData, error: contactError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'contactContent')
      .single();
    
    if (contactData?.value) {
      const updatedContact = {
        ...contactData.value,
        hours: 'Lun-Dom: 08:00 - 19:00'
      };
      
      await supabase
        .from('settings')
        .update({
          value: updatedContact,
          updated_at: new Date().toISOString()
        })
        .eq('key', 'contactContent');
      
      console.log('✅ Contact content hours updated');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to add business hours:', error.message);
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
  console.log('🌸 Francesco Fiori & Piante - Add Business Hours');
  console.log('===============================================');
  
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('❌ Cannot proceed without database connection');
    return;
  }
  
  const success = await addBusinessHours();
  if (success) {
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Go to http://localhost:8484/admin');
    console.log('2. Click on the "Orari" tab');
    console.log('3. Configure your business hours for each day');
    console.log('4. Save the settings');
    console.log('');
    console.log('✨ Your website will now show:');
    console.log('- Real-time business status (open/closed)');
    console.log('- Dynamic hours in footer and contact sections');
    console.log('- Business hours management in admin panel');
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { addBusinessHours, testConnection };
