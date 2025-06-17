import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/**
 * This component bypasses all website code and directly tests the database connection
 * for both writing and reading data.
 */
const DatabaseTest = () => {
  const [testData, setTestData] = useState({
    heading: "Test Heading " + new Date().toLocaleTimeString(),
    subheading: "Test Subheading " + new Date().toTimeString(),
    specialties: [
      {
        id: "test-" + Date.now(),
        title: "Test Item " + new Date().getSeconds(),
        description: "Test Description",
        price: "€99.99"
      }
    ]
  });
  
  const [result, setResult] = useState<any>(null);
  const [lastAction, setLastAction] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [allEntries, setAllEntries] = useState<any[]>([]);
  
  // Direct database write operation
  const testWrite = async () => {
    setIsLoading(true);
    setLastAction("Writing to database...");
    
    try {
      // Create random test data for this test
      const uniqueTestData = {
        heading: "Test Heading " + new Date().toLocaleTimeString(),
        subheading: "Test Subheading " + new Date().getTime(),
        specialties: [
          {
            id: "test-" + Date.now(),
            title: "Test Item " + new Date().getSeconds(),
            description: "Test Description created at " + new Date().toISOString(),
            price: "€" + (Math.random() * 100).toFixed(2)
          }
        ]
      };
      
      setTestData(uniqueTestData);
      
      // Insert directly to database
      const { data, error } = await supabase
        .from('settings')
        .insert({
          key: 'specialtiesContent',
          value: uniqueTestData,
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      setResult({
        success: true,
        operation: "write",
        data,
        timestamp: new Date().toISOString()
      });
      
      console.log("Database write successful:", data);
      alert("Test data written successfully!");
      
      // Immediately read back the data
      await testRead();
      
    } catch (err: any) {
      console.error("Database write error:", err);
      setResult({
        success: false,
        operation: "write",
        error: err.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
      setLastAction("Write operation completed");
    }
  };
  
  // Direct database read operation
  const testRead = async () => {
    setIsLoading(true);
    setLastAction("Reading from database...");
    
    try {
      // Direct read from database
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'specialtiesContent')
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        setResult({
          success: false,
          operation: "read",
          error: "No data found",
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      setResult({
        success: true,
        operation: "read",
        data: data[0],
        timestamp: new Date().toISOString()
      });
      
      console.log("Database read successful:", data[0]);
      
    } catch (err: any) {
      console.error("Database read error:", err);
      setResult({
        success: false,
        operation: "read",
        error: err.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
      setLastAction("Read operation completed");
    }
  };
  
  // List all entries in the settings table
  const listAllEntries = async () => {
    setIsLoading(true);
    setLastAction("Listing all entries...");
    
    try {
      // Get all entries
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'specialtiesContent')
        .order('updated_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setAllEntries(data || []);
      console.log("All entries:", data);
      
    } catch (err: any) {
      console.error("Error listing entries:", err);
    } finally {
      setIsLoading(false);
      setLastAction("List operation completed");
    }
  };
  
  // Delete test data
  const cleanupTestData = async () => {
    if (!confirm("Delete ALL test data? This will remove all specialtiesContent entries.")) {
      return;
    }
    
    setIsLoading(true);
    setLastAction("Deleting test data...");
    
    try {
      // Delete all test entries
      const { data, error } = await supabase
        .from('settings')
        .delete()
        .eq('key', 'specialtiesContent');
      
      if (error) {
        throw error;
      }
      
      setResult({
        success: true,
        operation: "delete",
        message: "All test data deleted",
        timestamp: new Date().toISOString()
      });
      
      setAllEntries([]);
      console.log("Test data deleted");
      alert("All test data deleted successfully!");
      
    } catch (err: any) {
      console.error("Error deleting test data:", err);
      setResult({
        success: false,
        operation: "delete",
        error: err.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
      setLastAction("Delete operation completed");
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Database Connection Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Data</h2>
          <Textarea 
            value={JSON.stringify(testData, null, 2)} 
            rows={10}
            readOnly
            className="font-mono text-sm mb-4 bg-gray-50"
          />
          
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={testWrite}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Write Test Data
            </Button>
            
            <Button 
              onClick={testRead}
              disabled={isLoading}
              variant="outline"
            >
              Read Latest Data
            </Button>
            
            <Button 
              onClick={listAllEntries}
              disabled={isLoading}
              variant="outline"
            >
              List All Entries
            </Button>
            
            <Button 
              onClick={cleanupTestData}
              disabled={isLoading}
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Delete All Test Data
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            Result
            {lastAction && <span className="text-sm font-normal text-gray-500 ml-2">({lastAction})</span>}
          </h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : result ? (
            <div className="mb-4">
              <div className={`p-3 rounded-md mb-2 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="font-medium">{result.success ? 'Success' : 'Error'}</div>
                <div className="text-sm">Operation: {result.operation}</div>
                <div className="text-sm">Time: {new Date(result.timestamp).toLocaleTimeString()}</div>
              </div>
              
              {result.data && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Response Data:</h3>
                  <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-64">
                    <pre className="text-xs">{JSON.stringify(result.data, null, 2)}</pre>
                  </div>
                </div>
              )}
              
              {result.error && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2 text-red-600">Error:</h3>
                  <div className="bg-red-50 p-4 rounded-md">
                    <pre className="text-xs text-red-700">{result.error}</pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 italic">No result yet. Run a test operation.</div>
          )}
        </div>
      </div>
      
      {allEntries.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">All Database Entries ({allEntries.length})</h2>
          <div className="overflow-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.key}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.updated_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate">
                        {entry.value?.heading || 'N/A'}
                      </div>
                      <button 
                        className="text-xs text-blue-600 hover:underline mt-1"
                        onClick={() => {
                          setResult({
                            success: true,
                            operation: "view",
                            data: entry,
                            timestamp: new Date().toISOString()
                          });
                        }}
                      >
                        View Full Data
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Help</h2>
        <p className="mb-2">This tool directly tests the database connection without any middleware:</p>
        <ul className="list-disc pl-5 mb-4 text-sm">
          <li><strong>Write Test Data</strong>: Creates a new entry with unique test data</li>
          <li><strong>Read Latest Data</strong>: Retrieves the most recent entry</li>
          <li><strong>List All Entries</strong>: Shows all entries in the database</li>
          <li><strong>Delete All Test Data</strong>: Removes all test entries</li>
        </ul>
        <p className="text-sm text-gray-600">After testing, go to the <a href="/" className="text-blue-600 hover:underline">homepage</a> to verify changes.</p>
      </div>
    </div>
  );
};

export default DatabaseTest;
