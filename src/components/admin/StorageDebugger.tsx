import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const StorageDebugger = () => {
  const [buckets, setBuckets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { toast } = useToast();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const checkBuckets = async () => {
    setLoading(true);
    addLog('🔍 Checking storage buckets...');
    
    try {
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        addLog(`❌ Error listing buckets: ${error.message}`);
        toast({
          title: 'Error',
          description: `Failed to list buckets: ${error.message}`,
          variant: 'destructive'
        });
      } else {
        setBuckets(data || []);
        addLog(`📋 Found ${data?.length || 0} buckets: ${data?.map(b => b.name).join(', ') || 'none'}`);
        
        if (data && data.length > 0) {
          data.forEach(bucket => {
            addLog(`  - ${bucket.name}: public=${bucket.public}, size_limit=${bucket.file_size_limit}`);
          });
        }
      }
    } catch (error) {
      addLog(`❌ Unexpected error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testUpload = async () => {
    setLoading(true);
    addLog('🧪 Testing image upload...');
    
    try {
      // Create a small test image
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText('TEST', 30, 55);
      }
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });
      
      const testFile = new File([blob], 'test-image.png', { type: 'image/png' });
      const filePath = `test/test-${Date.now()}.png`;
      
      // Try different bucket names
      const bucketsToTry = ['uploads', 'admin-uploads', 'gallery', 'images'];
      
      for (const bucketName of bucketsToTry) {
        addLog(`  Trying bucket: ${bucketName}`);
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, testFile);
        
        if (error) {
          addLog(`    ❌ Failed: ${error.message}`);
        } else {
          addLog(`    ✅ Success! Uploaded to ${bucketName}`);
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
          
          addLog(`    📎 URL: ${urlData.publicUrl}`);
          
          // Clean up
          await supabase.storage.from(bucketName).remove([filePath]);
          addLog(`    🧹 Cleaned up test file`);
          
          toast({
            title: 'Success!',
            description: `Upload works with bucket: ${bucketName}`,
          });
          break;
        }
      }
      
    } catch (error) {
      addLog(`❌ Test upload error: ${error.message}`);
      toast({
        title: 'Upload Test Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createBucket = async (bucketName: string) => {
    setLoading(true);
    addLog(`🔨 Attempting to create bucket: ${bucketName}`);
    
    try {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
      
      if (error) {
        addLog(`❌ Failed to create ${bucketName}: ${error.message}`);
        toast({
          title: 'Bucket Creation Failed',
          description: `${bucketName}: ${error.message}`,
          variant: 'destructive'
        });
      } else {
        addLog(`✅ Successfully created bucket: ${bucketName}`);
        toast({
          title: 'Success!',
          description: `Bucket ${bucketName} created successfully`,
        });
        // Refresh bucket list
        await checkBuckets();
      }
    } catch (error) {
      addLog(`❌ Unexpected error creating ${bucketName}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    checkBuckets();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🔧 Storage Debugger</span>
          <div className="flex gap-2">
            <Button onClick={checkBuckets} disabled={loading} size="sm">
              Refresh Buckets
            </Button>
            <Button onClick={testUpload} disabled={loading} size="sm">
              Test Upload
            </Button>
            <Button onClick={clearLogs} variant="outline" size="sm">
              Clear Logs
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Buckets List */}
          <div>
            <h3 className="font-semibold mb-2">Available Buckets ({buckets.length}):</h3>
            {buckets.length === 0 ? (
              <p className="text-gray-500 text-sm">No buckets found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {buckets.map((bucket) => (
                  <div key={bucket.name} className="p-2 border rounded text-sm">
                    <div className="font-medium">{bucket.name}</div>
                    <div className="text-gray-600">
                      Public: {bucket.public ? 'Yes' : 'No'} | 
                      Size: {Math.round(bucket.file_size_limit / 1024 / 1024)}MB
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Bucket Buttons */}
          <div>
            <h3 className="font-semibold mb-2">Create Missing Buckets:</h3>
            <div className="flex flex-wrap gap-2">
              {['uploads', 'admin-uploads', 'gallery'].map((bucketName) => (
                <Button
                  key={bucketName}
                  onClick={() => createBucket(bucketName)}
                  disabled={loading || buckets.some(b => b.name === bucketName)}
                  size="sm"
                  variant="outline"
                >
                  Create {bucketName}
                </Button>
              ))}
            </div>
          </div>

          {/* Logs */}
          <div>
            <h3 className="font-semibold mb-2">Debug Logs:</h3>
            <div className="bg-gray-100 p-3 rounded max-h-60 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-sm">No logs yet...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageDebugger;
