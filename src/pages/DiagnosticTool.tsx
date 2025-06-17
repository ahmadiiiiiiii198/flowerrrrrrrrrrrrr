import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DiagnosticTool: React.FC = () => {
  const [settingsRecords, setSettingsRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSpecialty, setNewSpecialty] = useState({
    title: 'Test Specialty',
    description: 'This is a test specialty',
    price: '€9.99',
    id: Date.now().toString()
  });
  const [saveResult, setSaveResult] = useState<any>(null);
  const [readResult, setReadResult] = useState<any>(null);
  const [testPhase, setTestPhase] = useState<string>('idle');

  // Fetch all settings data
  const loadAllSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      
      setSettingsRecords(data || []);
    } catch (err: any) {
      console.error('Error loading settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // On load, fetch current data
  useEffect(() => {
    loadAllSettings();
  }, []);

  // Test write operation
  const testWriteOperation = async () => {
    try {
      setTestPhase('writing');
      
      // Create a specialties object with the test specialty
      const testData = {
        heading: 'Test Specialties',
        subheading: 'Testing the save operation',
        specialties: [newSpecialty]
      };
      
      // Convert to string and back to ensure proper JSON format
      const jsonValue = JSON.parse(JSON.stringify(testData));
      
      // Write to settings table
      const { data, error } = await supabase
        .from('settings')
        .insert({
          key: 'specialtiesContent',
          value: jsonValue,
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (error) throw error;
      
      setSaveResult({
        success: true,
        data
      });
      
      // Reload data to see the new record
      await loadAllSettings();
      
      // Proceed to read test
      setTimeout(() => {
        testReadOperation();
      }, 1000);
    } catch (err: any) {
      console.error('Write test failed:', err);
      setSaveResult({
        success: false,
        error: err.message
      });
      setTestPhase('error');
    }
  };
  
  // Test read operation
  const testReadOperation = async () => {
    try {
      setTestPhase('reading');
      
      // Read from settings table
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'specialtiesContent')
        .order('updated_at', { ascending: false })
        .limit(1);
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('No specialties content found');
      }
      
      // Parse the value
      const specialtiesData = data[0].value;
      
      setReadResult({
        success: true,
        record: data[0],
        parsedValue: specialtiesData
      });
      
      setTestPhase('complete');
    } catch (err: any) {
      console.error('Read test failed:', err);
      setReadResult({
        success: false,
        error: err.message
      });
      setTestPhase('error');
    }
  };
  
  // Clear all specialties records (dangerous!)
  const clearAllSpecialties = async () => {
    if (!window.confirm('WARNING: This will delete ALL specialtiesContent records! Continue?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Get all specialtiesContent records
      const { data: records } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'specialtiesContent');
        
      if (records && records.length > 0) {
        const ids = records.map(r => r.id);
        
        // Delete all records
        const { error } = await supabase
          .from('settings')
          .delete()
          .in('id', ids);
          
        if (error) throw error;
        
        alert(`Deleted ${ids.length} specialties records`);
        await loadAllSettings();
      } else {
        alert('No specialties records found');
      }
    } catch (err: any) {
      console.error('Error clearing specialties:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Run a complete test cycle
  const runFullTest = () => {
    testWriteOperation();
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Database Diagnostics Tool</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            Error: {error}
          </div>
        )}
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Test Operations</h2>
            <div className="space-y-4">
              <div className="p-4 border rounded-md bg-gray-50">
                <h3 className="font-medium mb-2">Test Specialty Data</h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <input
                    type="text"
                    value={newSpecialty.title}
                    onChange={e => setNewSpecialty({...newSpecialty, title: e.target.value})}
                    className="px-3 py-2 border rounded"
                    placeholder="Title"
                  />
                  <input
                    type="text"
                    value={newSpecialty.price}
                    onChange={e => setNewSpecialty({...newSpecialty, price: e.target.value})}
                    className="px-3 py-2 border rounded"
                    placeholder="Price"
                  />
                </div>
                <textarea
                  value={newSpecialty.description}
                  onChange={e => setNewSpecialty({...newSpecialty, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded mb-3"
                  placeholder="Description"
                  rows={2}
                />
              </div>
              
              <button
                onClick={runFullTest}
                disabled={testPhase === 'writing' || testPhase === 'reading'}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
              >
                {testPhase === 'idle' ? 'Run Full Test' : 
                 testPhase === 'writing' ? 'Writing...' : 
                 testPhase === 'reading' ? 'Reading...' : 
                 testPhase === 'complete' ? 'Test Complete' : 'Error Occurred'}
              </button>
              
              <button
                onClick={loadAllSettings}
                disabled={loading}
                className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md"
              >
                {loading ? 'Loading...' : 'Refresh Data'}
              </button>
              
              <button
                onClick={clearAllSpecialties}
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md"
              >
                Clear All Specialties Records
              </button>
            </div>
            
            {testPhase !== 'idle' && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Test Results</h3>
                <div className="space-y-3">
                  {saveResult && (
                    <div className={`p-3 border rounded ${saveResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <p className="font-medium">{saveResult.success ? 'Write Success' : 'Write Failed'}</p>
                      <pre className="text-xs mt-2 overflow-auto max-h-40">
                        {JSON.stringify(saveResult, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {readResult && (
                    <div className={`p-3 border rounded ${readResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <p className="font-medium">{readResult.success ? 'Read Success' : 'Read Failed'}</p>
                      <pre className="text-xs mt-2 overflow-auto max-h-40">
                        {JSON.stringify(readResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Settings Records</h2>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading...</span>
              </div>
            ) : settingsRecords.length === 0 ? (
              <p className="text-gray-500 py-4">No settings records found</p>
            ) : (
              <div className="overflow-auto max-h-[600px]">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Key</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {settingsRecords.map(record => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm border-b">{record.key}</td>
                        <td className="px-4 py-2 text-sm font-mono border-b">{record.id}</td>
                        <td className="px-4 py-2 text-sm border-b">
                          {new Date(record.updated_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Selected Record Preview</h3>
              {settingsRecords.length > 0 && (
                <div className="p-3 border rounded bg-gray-50 overflow-auto max-h-60">
                  <p className="font-mono text-xs mb-1">ID: {settingsRecords[0].id}</p>
                  <p className="font-mono text-xs mb-1">Key: {settingsRecords[0].key}</p>
                  <p className="font-mono text-xs mb-2">Updated: {new Date(settingsRecords[0].updated_at).toLocaleString()}</p>
                  <div className="border-t pt-2">
                    <p className="font-medium text-xs mb-1">Value:</p>
                    <pre className="text-xs overflow-auto max-h-40">
                      {JSON.stringify(settingsRecords[0].value, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticTool;
