import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const CacheDebugger = () => {
  const [latestData, setLatestData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchLatestData = async () => {
    setIsLoading(true);
    try {
      // Get the most recent specialties content
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'specialtiesContent')
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        setLatestData(data[0]);
        console.log("Latest data from Supabase:", data[0]);
      } else {
        console.log("No specialties data found in database");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchLatestData();
  }, []);

  const clearLocalStorage = () => {
    try {
      localStorage.removeItem('specialtiesContent');
      alert('Local storage cache cleared!');
    } catch (e) {
      alert('Error clearing local storage: ' + e);
    }
  };
  
  const forceReload = () => {
    localStorage.removeItem('specialtiesContent');
    window.location.reload();
  };
  
  const goToHomepage = () => {
    localStorage.removeItem('specialtiesContent');
    window.location.href = '/';
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Cache Debugger</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Latest Data from Supabase</h2>
          {isLoading ? (
            <div className="animate-pulse h-40 bg-gray-100 rounded"></div>
          ) : latestData ? (
            <>
              <div className="mb-2">
                <span className="font-medium">ID:</span> {latestData.id}
              </div>
              <div className="mb-2">
                <span className="font-medium">Updated:</span> {new Date(latestData.updated_at).toLocaleString()}
              </div>
              <div className="overflow-auto max-h-60 bg-gray-50 p-4 rounded">
                <pre className="text-sm">{JSON.stringify(latestData.value, null, 2)}</pre>
              </div>
            </>
          ) : (
            <div className="text-red-500">No data found</div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Local Storage Cache</h2>
          <div className="overflow-auto max-h-60 bg-gray-50 p-4 rounded mb-4">
            <pre className="text-sm">
              {localStorage.getItem('specialtiesContent') 
                ? JSON.stringify(JSON.parse(localStorage.getItem('specialtiesContent') || '{}'), null, 2) 
                : 'No cache found'}
            </pre>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 justify-center">
        <Button onClick={fetchLatestData} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh Data'}
        </Button>
        <Button onClick={clearLocalStorage} variant="outline">
          Clear Local Storage Cache
        </Button>
        <Button onClick={forceReload} variant="outline">
          Clear Cache & Reload Page
        </Button>
        <Button onClick={goToHomepage}>
          Clear Cache & Go to Homepage
        </Button>
      </div>
    </div>
  );
};

export default CacheDebugger;
