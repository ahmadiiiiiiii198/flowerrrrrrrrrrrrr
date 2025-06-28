#!/usr/bin/env node

/**
 * Execute Storage Migration Script
 * This script runs the storage bucket creation SQL directly through Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://ijhuoolcnxbdvpqmqofo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaHVvb2xjbnhiZHZwcW1xb2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTE4NjcsImV4cCI6MjA2NjQyNzg2N30.EaZDYYQzNJhUl8NiTHITUzApsm6NyUO4Bnzz5EexVAA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function executeMigration() {
  console.log('🚀 Executing Storage Bucket Migration');
  console.log('====================================\n');

  try {
    // Read the migration file
    const migrationSQL = readFileSync('./supabase/migrations/20250627000000_create_storage_buckets.sql', 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    console.log('📝 Executing SQL commands...\n');

    // Split the SQL into individual commands
    const sqlCommands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      
      if (command.length === 0) continue;
      
      console.log(`📋 Executing command ${i + 1}/${sqlCommands.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: command + ';'
        });

        if (error) {
          console.log(`❌ Command ${i + 1} failed:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Command ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (error) {
        console.log(`❌ Command ${i + 1} error:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Results:`);
    console.log(`✅ Successful commands: ${successCount}`);
    console.log(`❌ Failed commands: ${errorCount}`);

    // Verify bucket creation
    await verifyBuckets();

  } catch (error) {
    console.error('❌ Migration execution failed:', error.message);
  }
}

async function verifyBuckets() {
  console.log('\n🔍 Verifying Storage Buckets');
  console.log('============================');

  try {
    // Try to list buckets using the storage API
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log('❌ Error listing buckets:', error.message);
      return;
    }

    const requiredBuckets = ['uploads', 'admin-uploads', 'gallery', 'specialties'];
    
    console.log('📋 Current buckets:', buckets?.map(b => b.name) || []);
    
    for (const bucketName of requiredBuckets) {
      const bucket = buckets?.find(b => b.name === bucketName);
      
      if (bucket) {
        console.log(`✅ ${bucketName}: Public=${bucket.public}, Size=${Math.round(bucket.file_size_limit / 1024 / 1024)}MB`);
      } else {
        console.log(`❌ ${bucketName}: Not found`);
      }
    }

    // Test uploads
    await testUploads(buckets || []);

  } catch (error) {
    console.log('❌ Verification failed:', error.message);
  }
}

async function testUploads(buckets) {
  console.log('\n🧪 Testing Image Uploads');
  console.log('========================');

  // Create a simple test image (1x1 pixel PNG)
  const testImageData = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
    0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);

  const testFile = new File([testImageData], 'test.png', { type: 'image/png' });
  const requiredBuckets = ['uploads', 'admin-uploads', 'gallery', 'specialties'];

  for (const bucketName of requiredBuckets) {
    const bucket = buckets.find(b => b.name === bucketName);
    
    if (!bucket) {
      console.log(`⏭️  Skipping ${bucketName} - bucket not found`);
      continue;
    }

    console.log(`🧪 Testing upload to ${bucketName}...`);
    
    try {
      const testFileName = `test-${Date.now()}.png`;
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(testFileName, testFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.log(`   ❌ Upload failed: ${error.message}`);
      } else {
        console.log(`   ✅ Upload successful`);
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(testFileName);
        
        console.log(`   🔗 Public URL: ${urlData.publicUrl}`);
        
        // Clean up test file
        await supabase.storage
          .from(bucketName)
          .remove([testFileName]);
      }
    } catch (error) {
      console.log(`   ❌ Upload test error: ${error.message}`);
    }
  }
}

async function createBucketsManually() {
  console.log('\n🔧 Manual Bucket Creation Fallback');
  console.log('==================================');

  const buckets = [
    { name: 'uploads', public: true, fileSizeLimit: 52428800 },
    { name: 'admin-uploads', public: true, fileSizeLimit: 52428800 },
    { name: 'gallery', public: true, fileSizeLimit: 52428800 },
    { name: 'specialties', public: true, fileSizeLimit: 52428800 }
  ];

  for (const bucket of buckets) {
    console.log(`🔨 Creating bucket: ${bucket.name}`);
    
    try {
      const { error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      });

      if (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      } else {
        console.log(`   ✅ Created successfully`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

async function main() {
  try {
    // First try to execute the migration
    await executeMigration();
    
    // If that doesn't work, try manual bucket creation
    console.log('\n🔄 Attempting manual bucket creation as fallback...');
    await createBucketsManually();
    
    // Final verification
    await verifyBuckets();
    
    console.log('\n✨ Storage setup completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Go to your admin panel');
    console.log('2. Navigate to the "immagini" section');
    console.log('3. Try uploading an image');
    console.log('4. Check browser console for any remaining errors');
    
  } catch (error) {
    console.error('❌ Script execution failed:', error);
  }
}

main().catch(console.error);
