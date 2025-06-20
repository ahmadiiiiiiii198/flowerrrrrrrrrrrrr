
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// This service handles file uploads to Supabase Storage
export class StorageService {
  private bucketName: string;
  
  constructor(bucketName: string = 'uploads') {
    this.bucketName = bucketName;
  }
  
  /**
   * Upload a file to storage
   */
  async uploadFile(file: File, path?: string, customBucketName?: string): Promise<string | null> {
    try {
      // Use custom bucket name if provided, otherwise use default
      const bucketName = customBucketName || this.bucketName;
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;
      
      console.log(`Uploading file to ${bucketName}/${filePath}`);
      
      // Check if bucket exists first
      const { data: buckets, error: listBucketsError } = await supabase.storage.listBuckets();
      
      if (listBucketsError) {
        console.error('Error listing buckets:', listBucketsError);
        return null;
      }
      
      const bucketExists = buckets?.some(b => b.name === bucketName);
      
      if (!bucketExists) {
        console.log(`Bucket ${bucketName} does not exist, creating it...`);
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 50 * 1024 * 1024, // 50MB
        });
        
        if (createError) {
          console.error(`Failed to create bucket ${bucketName}:`, createError);
          return null;
        }
        
        // Wait a moment for bucket creation to propagate
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Upload the file with retry logic
      let retries = 3;
      let uploadSuccess = false;
      let data;
      let error;
      
      while (retries > 0 && !uploadSuccess) {
        const result = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
        
        data = result.data;
        error = result.error;
        
        if (!error) {
          uploadSuccess = true;
        } else {
          console.warn(`Upload attempt failed (${retries} retries left):`, error);
          retries--;
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (error) {
        console.error('All upload attempts failed:', error);
        return null;
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
        
      console.log('File uploaded successfully, public URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      return null;
    }
  }
  
  /**
   * Delete a file from storage
   */
  async deleteFile(path: string, customBucketName?: string): Promise<boolean> {
    try {
      // Use custom bucket name if provided, otherwise use default
      const bucketName = customBucketName || this.bucketName;
      
      // Handle different path formats
      let filePath = path;
      
      // If it's a full URL, extract just the filename part
      if (path.includes('storage/v1/object/public/')) {
        // Extract path pattern for Supabase URLs
        const pathMatch = path.match(/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
        if (pathMatch && pathMatch.length >= 3) {
          // Use the extracted values
          filePath = pathMatch[2];
        }
      } else if (path.includes('/')) {
        // If it's just a path with slashes but not a full URL
        filePath = path.split('/').slice(-2).join('/');
      }
      
      console.log(`Deleting file from ${bucketName}/${filePath}`);
      
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);
        
      if (error) {
        console.error('Error deleting file:', error);
        return false;
      }
      
      console.log('File deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in deleteFile:', error);
      return false;
    }
  }
  
  /**
   * List files in a bucket or folder
   */
  async listFiles(path?: string, customBucketName?: string): Promise<string[] | null> {
    try {
      const bucketName = customBucketName || this.bucketName;
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(path || '');
        
      if (error) {
        console.error('Error listing files:', error);
        return null;
      }
      
      return data.map(item => item.name);
    } catch (error) {
      console.error('Error in listFiles:', error);
      return null;
    }
  }
}

// Export a singleton instance
export const storageService = new StorageService();
