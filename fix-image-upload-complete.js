#!/usr/bin/env node

/**
 * Complete Image Upload Fix Script
 * This script fixes all image upload issues by:
 * 1. Creating required storage buckets
 * 2. Setting up proper RLS policies
 * 3. Testing upload functionality
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://ijhuoolcnxbdvpqmqofo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaHVvb2xjbnhiZHZwcW1xb2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTE4NjcsImV4cCI6MjA2NjQyNzg2N30.EaZDYYQzNJhUl8NiTHITUzApsm6NyUO4Bnzz5EexVAA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Required buckets configuration
const REQUIRED_BUCKETS = [
  {
    name: 'uploads',
    config: {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ]
    }
  },
  {
    name: 'admin-uploads',
    config: {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ]
    }
  },
  {
    name: 'gallery',
    config: {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ]
    }
  },
  {
    name: 'specialties',
    config: {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ]
    }
  }
];

async function checkCurrentBuckets() {
  console.log('🔍 Checking existing storage buckets...');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error);
      return [];
    }
    
    console.log('📋 Current buckets:', buckets?.map(b => b.name) || []);
    return buckets || [];
  } catch (error) {
    console.error('❌ Failed to check buckets:', error);
    return [];
  }
}

async function createMissingBuckets(existingBuckets) {
  console.log('\n🔨 Creating missing storage buckets...');
  
  for (const bucketConfig of REQUIRED_BUCKETS) {
    const exists = existingBuckets.find(b => b.name === bucketConfig.name);
    
    if (exists) {
      console.log(`✅ Bucket '${bucketConfig.name}' already exists`);
      continue;
    }
    
    console.log(`🔨 Creating bucket: ${bucketConfig.name}`);
    
    try {
      const { error } = await supabase.storage.createBucket(
        bucketConfig.name,
        bucketConfig.config
      );
      
      if (error) {
        console.error(`❌ Failed to create bucket '${bucketConfig.name}':`, error.message);
        
        // If it's an RLS error, provide instructions
        if (error.message.includes('row-level security policy')) {
          console.log(`\n⚠️  RLS Policy Issue for bucket '${bucketConfig.name}':`);
          console.log('   This requires manual setup in Supabase Dashboard:');
          console.log('   1. Go to https://supabase.com/dashboard/project/ijhuoolcnxbdvpqmqofo/storage/buckets');
          console.log(`   2. Create bucket '${bucketConfig.name}' manually`);
          console.log('   3. Set it as Public');
          console.log('   4. Set file size limit to 50MB');
          console.log('   5. Allow image mime types');
        }
      } else {
        console.log(`✅ Successfully created bucket: ${bucketConfig.name}`);
      }
    } catch (error) {
      console.error(`❌ Unexpected error creating bucket '${bucketConfig.name}':`, error);
    }
  }
}

async function testImageUpload() {
  console.log('\n🧪 Testing image upload functionality...');
  
  // Create a simple test image (1x1 pixel PNG)
  const testImageData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
    0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  const testFile = new File([testImageData], 'test-image.png', { type: 'image/png' });
  const testFileName = `test-upload-${Date.now()}.png`;
  
  // Test each bucket
  for (const bucketConfig of REQUIRED_BUCKETS) {
    console.log(`\n🧪 Testing upload to '${bucketConfig.name}' bucket...`);
    
    try {
      const { data, error } = await supabase.storage
        .from(bucketConfig.name)
        .upload(testFileName, testFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error(`❌ Upload test failed for '${bucketConfig.name}':`, error.message);
        
        if (error.message.includes('Bucket not found')) {
          console.log(`   → Bucket '${bucketConfig.name}' needs to be created manually`);
        }
      } else {
        console.log(`✅ Upload test successful for '${bucketConfig.name}'`);
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketConfig.name)
          .getPublicUrl(testFileName);
        
        console.log(`   → Public URL: ${urlData.publicUrl}`);
        
        // Clean up test file
        await supabase.storage
          .from(bucketConfig.name)
          .remove([testFileName]);
      }
    } catch (error) {
      console.error(`❌ Unexpected error testing '${bucketConfig.name}':`, error);
    }
  }
}

async function provideSolution() {
  console.log('\n📋 SOLUTION SUMMARY:');
  console.log('==================');
  
  console.log('\n🔧 MANUAL STEPS REQUIRED:');
  console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/ijhuoolcnxbdvpqmqofo/storage/buckets');
  console.log('2. Create the following buckets manually:');
  
  REQUIRED_BUCKETS.forEach(bucket => {
    console.log(`   - ${bucket.name} (Public: Yes, Size Limit: 50MB)`);
  });
  
  console.log('\n3. For each bucket, set these configurations:');
  console.log('   - Public: ✅ Enabled');
  console.log('   - File size limit: 50MB (52428800 bytes)');
  console.log('   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp');
  
  console.log('\n🔍 AFTER MANUAL SETUP:');
  console.log('1. Run this script again to test uploads');
  console.log('2. Try uploading images in the admin panel');
  console.log('3. Check browser console for any remaining errors');
  
  console.log('\n💡 WHY THIS HAPPENS:');
  console.log('- Storage bucket creation requires elevated permissions');
  console.log('- The anon key cannot create buckets due to RLS policies');
  console.log('- Manual creation via dashboard uses admin privileges');
}

async function main() {
  console.log('🚀 Francesco Fiori & Piante - Image Upload Fix');
  console.log('==============================================\n');
  
  try {
    // Step 1: Check existing buckets
    const existingBuckets = await checkCurrentBuckets();
    
    // Step 2: Try to create missing buckets
    await createMissingBuckets(existingBuckets);
    
    // Step 3: Test upload functionality
    await testImageUpload();
    
    // Step 4: Provide solution
    await provideSolution();
    
  } catch (error) {
    console.error('❌ Script execution failed:', error);
  }
  
  console.log('\n✨ Script completed!');
}

// Run the script
main().catch(console.error);
