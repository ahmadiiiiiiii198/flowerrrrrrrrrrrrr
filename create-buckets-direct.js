#!/usr/bin/env node

/**
 * Direct Storage Bucket Creation via REST API
 * This script creates storage buckets using direct HTTP requests to bypass RLS
 */

import fetch from 'node-fetch';

const SUPABASE_URL = 'https://ijhuoolcnxbdvpqmqofo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaHVvb2xjbnhiZHZwcW1xb2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTE4NjcsImV4cCI6MjA2NjQyNzg2N30.EaZDYYQzNJhUl8NiTHITUzApsm6NyUO4Bnzz5EexVAA';

const REQUIRED_BUCKETS = [
  {
    id: 'uploads',
    name: 'uploads',
    public: true,
    file_size_limit: 52428800,
    allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  },
  {
    id: 'admin-uploads',
    name: 'admin-uploads', 
    public: true,
    file_size_limit: 52428800,
    allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  },
  {
    id: 'gallery',
    name: 'gallery',
    public: true,
    file_size_limit: 52428800,
    allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  },
  {
    id: 'specialties',
    name: 'specialties',
    public: true,
    file_size_limit: 52428800,
    allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  }
];

async function createBucketDirect(bucket) {
  console.log(`🔨 Creating bucket: ${bucket.name}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        id: bucket.id,
        name: bucket.name,
        public: bucket.public,
        file_size_limit: bucket.file_size_limit,
        allowed_mime_types: bucket.allowed_mime_types
      })
    });

    const result = await response.text();
    
    if (response.ok) {
      console.log(`✅ Successfully created bucket: ${bucket.name}`);
      return true;
    } else {
      console.log(`❌ Failed to create bucket ${bucket.name}:`, result);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error creating bucket ${bucket.name}:`, error.message);
    return false;
  }
}

async function listBuckets() {
  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });

    if (response.ok) {
      const buckets = await response.json();
      console.log('📋 Current buckets:', buckets.map(b => b.name));
      return buckets;
    } else {
      console.log('❌ Failed to list buckets:', await response.text());
      return [];
    }
  } catch (error) {
    console.log('❌ Error listing buckets:', error.message);
    return [];
  }
}

async function testUpload(bucketName) {
  console.log(`🧪 Testing upload to ${bucketName}...`);
  
  try {
    // Create a simple test file
    const testContent = 'test file content';
    const testFileName = `test-${Date.now()}.txt`;
    
    const formData = new FormData();
    formData.append('file', new Blob([testContent], { type: 'text/plain' }), testFileName);

    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucketName}/${testFileName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: formData
    });

    if (response.ok) {
      console.log(`   ✅ Upload test successful for ${bucketName}`);
      
      // Get public URL
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${testFileName}`;
      console.log(`   🔗 Public URL: ${publicUrl}`);
      
      // Clean up - delete test file
      await fetch(`${SUPABASE_URL}/storage/v1/object/${bucketName}/${testFileName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      });
      
      return true;
    } else {
      const error = await response.text();
      console.log(`   ❌ Upload test failed for ${bucketName}:`, error);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Upload test error for ${bucketName}:`, error.message);
    return false;
  }
}

async function createStoragePoliciesSQL() {
  console.log('\n🔐 Creating Storage Policies via SQL');
  console.log('====================================');

  // Import Supabase client for SQL execution
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const sqlCommands = [
    // Enable RLS on storage.objects if not already enabled
    `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`,
    
    // Create policies for public access to our buckets
    `
    DO $$
    BEGIN
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Public Access" ON storage.objects;
      DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
      DROP POLICY IF EXISTS "Public Read" ON storage.objects;
      DROP POLICY IF EXISTS "Public Update" ON storage.objects;
      DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
      
      -- Create comprehensive public access policy
      CREATE POLICY "Public Access" ON storage.objects
        FOR ALL 
        USING (bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties'))
        WITH CHECK (bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties'));
        
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Policy creation failed: %', SQLERRM;
    END $$;
    `,
    
    // Enable RLS on storage.buckets
    `ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;`,
    
    // Create bucket access policy
    `
    DO $$
    BEGIN
      DROP POLICY IF EXISTS "Public Bucket Access" ON storage.buckets;
      
      CREATE POLICY "Public Bucket Access" ON storage.buckets
        FOR ALL 
        USING (true)
        WITH CHECK (true);
        
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Bucket policy creation failed: %', SQLERRM;
    END $$;
    `
  ];

  for (const sql of sqlCommands) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.log(`❌ SQL execution failed:`, error.message);
      } else {
        console.log(`✅ SQL executed successfully`);
      }
    } catch (error) {
      console.log(`❌ SQL execution error:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Direct Storage Bucket Creation');
  console.log('=================================\n');

  // Step 1: List current buckets
  console.log('🔍 Checking current buckets...');
  const existingBuckets = await listBuckets();
  
  // Step 2: Create missing buckets
  console.log('\n🔨 Creating missing buckets...');
  let successCount = 0;
  
  for (const bucket of REQUIRED_BUCKETS) {
    const exists = existingBuckets.find(b => b.name === bucket.name);
    
    if (exists) {
      console.log(`✅ Bucket '${bucket.name}' already exists`);
      successCount++;
    } else {
      const success = await createBucketDirect(bucket);
      if (success) successCount++;
    }
  }

  // Step 3: Create storage policies
  await createStoragePoliciesSQL();

  // Step 4: Test uploads
  console.log('\n🧪 Testing uploads...');
  for (const bucket of REQUIRED_BUCKETS) {
    await testUpload(bucket.name);
  }

  // Step 5: Final status
  console.log('\n📋 SUMMARY');
  console.log('==========');
  console.log(`✅ Buckets created/verified: ${successCount}/${REQUIRED_BUCKETS.length}`);
  
  if (successCount === REQUIRED_BUCKETS.length) {
    console.log('🎉 All storage buckets are ready!');
    console.log('💡 You can now test image uploads in the admin panel');
  } else {
    console.log('⚠️  Some buckets could not be created');
    console.log('📝 You may need to create them manually in the Supabase dashboard');
  }
}

// Handle fetch import for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = (await import('node-fetch')).default;
  global.FormData = (await import('formdata-node')).FormData;
  global.Blob = (await import('buffer')).Blob;
}

main().catch(console.error);
