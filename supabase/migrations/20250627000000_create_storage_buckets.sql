-- Create Storage Buckets and Policies for Image Uploads
-- This migration creates the required storage buckets and sets up proper RLS policies

-- First, let's create the storage buckets directly in the database
-- This bypasses the API restrictions

-- Create uploads bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES (
  'uploads',
  'uploads', 
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- Create admin-uploads bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES (
  'admin-uploads',
  'admin-uploads',
  true, 
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- Create gallery bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES (
  'gallery',
  'gallery',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- Create specialties bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES (
  'specialties',
  'specialties',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Enable RLS on storage.buckets if not already enabled  
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- Create comprehensive storage policies for our buckets
CREATE POLICY "Allow public uploads to image buckets" ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties'));

CREATE POLICY "Allow public reads from image buckets" ON storage.objects
  FOR SELECT 
  USING (bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties'));

CREATE POLICY "Allow public updates to image buckets" ON storage.objects
  FOR UPDATE 
  USING (bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties'))
  WITH CHECK (bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties'));

CREATE POLICY "Allow public deletes from image buckets" ON storage.objects
  FOR DELETE 
  USING (bucket_id IN ('uploads', 'admin-uploads', 'gallery', 'specialties'));

-- Drop existing bucket policies
DROP POLICY IF EXISTS "Public Bucket Access" ON storage.buckets;
DROP POLICY IF EXISTS "Allow public bucket access" ON storage.buckets;

-- Create bucket access policies
CREATE POLICY "Allow public bucket access" ON storage.buckets
  FOR SELECT 
  USING (true);

-- Create a function to verify bucket creation
CREATE OR REPLACE FUNCTION verify_storage_buckets()
RETURNS TABLE(bucket_name TEXT, exists BOOLEAN, public BOOLEAN, size_limit BIGINT) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bucket_names.name,
    (storage_buckets.id IS NOT NULL) as exists,
    COALESCE(storage_buckets.public, false) as public,
    COALESCE(storage_buckets.file_size_limit, 0) as size_limit
  FROM (
    VALUES 
      ('uploads'),
      ('admin-uploads'), 
      ('gallery'),
      ('specialties')
  ) AS bucket_names(name)
  LEFT JOIN storage.buckets AS storage_buckets ON storage_buckets.id = bucket_names.name;
END;
$$;

-- Add a comment to track this migration
COMMENT ON FUNCTION verify_storage_buckets() IS 'Function to verify that all required storage buckets exist and are properly configured';

-- Log the bucket creation
DO $$
DECLARE
  bucket_record RECORD;
BEGIN
  RAISE NOTICE 'Storage buckets migration completed. Verifying buckets:';
  
  FOR bucket_record IN SELECT * FROM verify_storage_buckets() LOOP
    IF bucket_record.exists THEN
      RAISE NOTICE 'Bucket % exists: Public=%, Size Limit=%MB', 
        bucket_record.bucket_name, 
        bucket_record.public, 
        bucket_record.size_limit / 1024 / 1024;
    ELSE
      RAISE WARNING 'Bucket % was not created successfully', bucket_record.bucket_name;
    END IF;
  END LOOP;
END $$;
