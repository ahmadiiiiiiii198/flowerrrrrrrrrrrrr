import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DiagnosticTest = () => {
  const [settingsData, setSettingsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSetting, setSelectedSetting] = useState<any>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const fetchAllSettingsData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get all settings rows ordered by most recent first
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setSettingsData(data);
          // Auto-select the most recent 'specialtiesContent' entry
          const specialtiesEntry = data.find(item => item.key === 'specialtiesContent');
          if (specialtiesEntry) {
            setSelectedSetting(specialtiesEntry);
          }
        }
      } catch (err: any) {
        setError(`Error fetching settings: ${err.message}`);
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllSettingsData();
  }, [refreshCount]);
  
  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };
  
  const handleSelectSetting = (setting: any) => {
    setSelectedSetting(setting);
  };
  
  // Function to forcefully update the specialties data
  const handleReset = async () => {
    if (!window.confirm('This will reset the specialties data to defaults. Continue?')) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Default specialties content
      const defaultContent = {
        heading: "Our Specialties",
        subheading: "Discover authentic Central Asian flavors crafted with centuries-old recipes",
        specialties: [
          {
            id: "1",
            title: "Plov (Uzbek Rice Pilaf)",
            description: "Our signature dish featuring fragrant rice cooked with tender lamb, carrots, and a blend of traditional spices.",
            image: "/lovable-uploads/73eb78dc-53a2-4ec9-b660-6ffec6bff8bb.png",
            price: "€14.90",
          },
          {
            id: "2",
            title: "Shashlik (Central Asian Skewers)",
            description: "Marinated meat skewers grilled to perfection over an open flame. Served with tangy yogurt sauce and fresh herbs.",
            image: "/lovable-uploads/05335902-cb3d-4760-aab2-46a1292ac614.png",
            price: "€13.90",
          },
          {
            id: "3",
            title: "Shurpa (Lamb Soup)",
            description: "Hearty lamb soup with vegetables and herbs, slow-cooked to extract rich flavors. Perfect for starting your Central Asian feast.",
            image: "/lovable-uploads/bbf20df5-b0f5-4add-bf53-5675c1993c9b.png",
            price: "€12.90",
          },
        ]
      };
      
      // Insert a new row with the fresh data
      const { error } = await supabase
        .from('settings')
        .insert({
          key: 'specialtiesContent',
          value: defaultContent,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        throw error;
      }
      
      alert('Specialties data has been reset successfully!');
      handleRefresh();
    } catch (err: any) {
      setError(`Error resetting data: ${err.message}`);
      console.error('Error resetting data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Supabase Database Diagnostic</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex justify-between mb-6">
        <button 
          onClick={handleRefresh}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
        
        <button 
          onClick={handleReset}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
          disabled={loading}
        >
          Reset Specialties Data
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-gray-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Settings Keys</h2>
          {loading ? (
            <p>Loading settings...</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {settingsData.map((setting, index) => (
                <li 
                  key={`${setting.key}-${index}`}
                  className={`py-2 px-3 cursor-pointer hover:bg-gray-100 rounded ${selectedSetting && selectedSetting.id === setting.id ? 'bg-blue-100' : ''}`}
                  onClick={() => handleSelectSetting(setting)}
                >
                  <div className="font-medium">{setting.key}</div>
                  <div className="text-xs text-gray-500">{formatDate(setting.updated_at)}</div>
                  <div className="text-xs text-gray-400">ID: {setting.id}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="md:col-span-2 bg-gray-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Value Preview</h2>
          {selectedSetting ? (
            <div>
              <div className="bg-white p-4 rounded shadow mb-4">
                <h3 className="font-bold">{selectedSetting.key}</h3>
                <p className="text-sm text-gray-500">Updated: {formatDate(selectedSetting.updated_at)}</p>
                <p className="text-sm text-gray-500">Created: {formatDate(selectedSetting.created_at)}</p>
                <p className="text-sm text-gray-500">ID: {selectedSetting.id}</p>
              </div>
              
              <div className="bg-gray-800 text-green-400 p-4 rounded overflow-auto max-h-96">
                <pre>{JSON.stringify(selectedSetting.value, null, 2)}</pre>
              </div>
              
              {selectedSetting.key === 'specialtiesContent' && selectedSetting.value?.specialties && (
                <div className="mt-4">
                  <h3 className="font-bold mb-2">Specialties Count: {selectedSetting.value.specialties.length}</h3>
                  <ul className="list-disc pl-5">
                    {selectedSetting.value.specialties.map((specialty: any, index: number) => (
                      <li key={specialty.id || index} className="mb-2">
                        <strong>{specialty.title}</strong> - {specialty.price}
                        {specialty.image && <span className="ml-2 text-blue-500">(Has image)</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p>Select a setting to view its value</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagnosticTest;
