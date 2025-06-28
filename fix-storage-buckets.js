import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ijhuoolcnxbdvpqmqofo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqaHVvb2xjbnhiZHZwcW1xb2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTE4NjcsImV4cCI6MjA2NjQyNzg2N30.EaZDYYQzNJhUl8NiTHITUzApsm6NyUO4Bnzz5EexVAA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixStorageBuckets() {
  console.log('🔍 Checking storage buckets...');
  
  try {
    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }
    
    console.log('📋 Existing buckets:', buckets?.map(b => b.name) || []);
    
    // Required buckets for the application
    const requiredBuckets = [
      {
        name: 'uploads',
        config: {
          public: true,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: [
            'image/jpeg',
            'image/png', 
            'image/gif',
            'image/webp',
            'audio/mpeg',
            'audio/wav',
            'audio/ogg',
            'audio/mp3',
            'audio/webm'
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
            'image/png',
            'image/gif', 
            'image/webp'
          ]
        }
      }
    ];
    
    // Check and create missing buckets
    for (const bucket of requiredBuckets) {
      const exists = buckets?.find(b => b.name === bucket.name);
      
      if (!exists) {
        console.log(`🔨 Creating bucket: ${bucket.name}`);
        
        const { error: createError } = await supabase.storage.createBucket(
          bucket.name, 
          bucket.config
        );
        
        if (createError) {
          console.error(`❌ Failed to create bucket ${bucket.name}:`, createError);
        } else {
          console.log(`✅ Successfully created bucket: ${bucket.name}`);
        }
      } else {
        console.log(`✅ Bucket ${bucket.name} already exists`);
      }
    }
    
    // Test upload to uploads bucket
    console.log('\n🧪 Testing upload to uploads bucket...');
    
    // Create a small test file
    const testContent = 'test file content';
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    const testPath = `test/test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(testPath, testFile);
    
    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError);
    } else {
      console.log('✅ Test upload successful');
      
      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('uploads')
        .remove([testPath]);
      
      if (deleteError) {
        console.warn('⚠️ Could not clean up test file:', deleteError);
      } else {
        console.log('🧹 Test file cleaned up');
      }
    }
    
    console.log('\n🎉 Storage bucket setup complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixStorageBuckets();
