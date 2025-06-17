import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SettingsTableTest = () => {
  const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [settings, setSettings] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    testSettingsTable();
  }, []);

  const testSettingsTable = async () => {
    try {
      setStatus('testing');
      setError('');
      setSettings([]);

      console.log('🔍 Testing settings table...');

      // Test settings table access
      const { data, error: settingsError } = await supabase
        .from('settings')
        .select('key, value, created_at, updated_at')
        .order('key');

      if (settingsError) {
        throw new Error(`Settings table error: ${settingsError.message}`);
      }

      console.log('✅ Settings table data:', data);
      setSettings(data || []);

      // Check for required settings
      const requiredSettings = ['logoSettings', 'heroContent'];
      const existingKeys = (data || []).map(s => s.key);
      const missingSettings = requiredSettings.filter(key => !existingKeys.includes(key));

      if (missingSettings.length > 0) {
        console.warn('⚠️ Missing required settings:', missingSettings);
        
        // Try to create missing settings
        await createMissingSettings(missingSettings);
      }

      setStatus('success');
    } catch (err) {
      console.error('❌ Settings table test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  const createMissingSettings = async (missingKeys: string[]) => {
    try {
      const defaultSettings = {
        logoSettings: {
          logoUrl: "https://despodpgvkszyexvcbft.supabase.co/storage/v1/object/public/uploads/logos/1749735172947-oi6nr6gnk7.png",
          altText: "Francesco Fiori & Piante Logo"
        },
        heroContent: {
          heading: 'Francesco Fiori & Piante',
          subheading: 'Scopri l\'eleganza floreale firmata Francesco: fiori, piante e creazioni per ogni occasione. 🌸🌿',
          backgroundImage: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80'
        }
      };

      for (const key of missingKeys) {
        if (defaultSettings[key as keyof typeof defaultSettings]) {
          const { error } = await supabase
            .from('settings')
            .insert({
              key,
              value: defaultSettings[key as keyof typeof defaultSettings]
            });

          if (error) {
            console.error(`❌ Failed to create ${key}:`, error);
          } else {
            console.log(`✅ Created missing setting: ${key}`);
          }
        }
      }

      // Refresh the settings after creation
      await testSettingsTable();
    } catch (err) {
      console.error('❌ Error creating missing settings:', err);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border max-w-sm max-h-96 overflow-y-auto">
      <h3 className="font-bold text-sm mb-2">Settings Table Test</h3>
      
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span>Status:</span>
          <span className={`px-2 py-1 rounded text-white ${
            status === 'testing' ? 'bg-yellow-500' :
            status === 'success' ? 'bg-green-500' :
            'bg-red-500'
          }`}>
            {status.toUpperCase()}
          </span>
        </div>

        {error && (
          <div className="text-red-600 bg-red-50 p-2 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {settings.length > 0 && (
          <div className="bg-green-50 p-2 rounded">
            <strong>Settings Found ({settings.length}):</strong>
            <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
              {settings.map((setting, index) => (
                <div key={index} className="border-b border-green-200 pb-1">
                  <div className="font-medium">{setting.key}</div>
                  <div className="text-gray-600 text-xs">
                    {setting.key === 'logoSettings' && (
                      <div>
                        URL: {setting.value?.logoUrl ? '✅' : '❌'}<br/>
                        Alt: {setting.value?.altText || 'N/A'}
                      </div>
                    )}
                    {setting.key === 'heroContent' && (
                      <div>
                        Heading: {setting.value?.heading ? '✅' : '❌'}<br/>
                        Background: {setting.value?.backgroundImage ? '✅' : '❌'}
                      </div>
                    )}
                    {!['logoSettings', 'heroContent'].includes(setting.key) && (
                      <div className="truncate">
                        {typeof setting.value === 'object' 
                          ? JSON.stringify(setting.value).substring(0, 30) + '...'
                          : String(setting.value).substring(0, 30)
                        }
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button 
          onClick={testSettingsTable}
          className="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
        >
          Retest Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsTableTest;
