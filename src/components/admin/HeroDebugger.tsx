import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const HeroDebugger = () => {
  const [debugResults, setDebugResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const addResult = (message: string) => {
    setDebugResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const debugHeroContent = async () => {
    setIsRunning(true);
    setDebugResults([]);

    addResult('🔍 Starting hero content debug...');

    try {
      // 1. Check database directly
      addResult('🌐 Checking database for hero content...');
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'heroContent')
          .single();

        if (error) {
          addResult(`❌ Database error: ${error.message}`);
        } else if (data) {
          addResult('✅ Found hero content in database:');
          addResult(`   - Heading: ${data.value.heading || 'N/A'}`);
          addResult(`   - Subheading: ${data.value.subheading || 'N/A'}`);
          addResult(`   - Background Image: ${data.value.backgroundImage || 'N/A'}`);

          if (data.value.backgroundImage?.includes('unsplash.com')) {
            addResult('⚠️ Using default Unsplash image');
          } else if (data.value.backgroundImage?.includes('supabase.co')) {
            addResult('✅ Using custom uploaded image');
          }
        } else {
          addResult('⚠️ No hero content found in database');
        }
      } catch (e) {
        addResult(`❌ Error checking database: ${e}`);
      }
      
      // 3. Check what the hook returns
      addResult('🪝 Checking hook data...');
      addResult(`   - Heading: ${heroContent?.heading || 'N/A'}`);
      addResult(`   - Subheading: ${heroContent?.subheading || 'N/A'}`);
      addResult(`   - Background Image: ${heroContent?.backgroundImage || 'N/A'}`);
      
      // 4. Check settings service cache
      addResult('🗄️ Checking settings service...');
      const settingData = await settingsService.getSetting('heroContent', {
        heading: "Default",
        subheading: "Default",
        backgroundImage: "Default"
      });
      addResult(`   - Service Heading: ${settingData?.heading || 'N/A'}`);
      addResult(`   - Service Subheading: ${settingData?.subheading || 'N/A'}`);
      addResult(`   - Service Background Image: ${settingData?.backgroundImage || 'N/A'}`);
      
      // 5. Check content_sections table for hero content
      addResult('📋 Checking content_sections table...');
      const { data: contentSections } = await supabase
        .from('content_sections')
        .select('section_key, section_name, updated_at')
        .contains('metadata', { section: 'hero' });

      if (contentSections && contentSections.length > 0) {
        addResult('✅ Found hero content in content_sections:');
        contentSections.forEach(section => {
          addResult(`   - ${section.section_key}: ${section.section_name} (${section.updated_at})`);
        });
      } else {
        addResult('⚠️ No hero content found in content_sections table');
      }

      // 6. List all settings in database
      addResult('📋 All settings in database:');
      const { data: allSettings } = await supabase
        .from('settings')
        .select('key, updated_at')
        .order('updated_at', { ascending: false });

      allSettings?.forEach(setting => {
        addResult(`   - ${setting.key} (${setting.updated_at})`);
      });
      
      addResult('🎉 Debug complete!');
      
    } catch (error) {
      addResult(`❌ Debug failed: ${error}`);
    }
    
    setIsRunning(false);
  };

  const testHeroUpdate = async () => {
    addResult('🧪 Testing hero content update...');

    try {
      // Use a different test image
      const testImage = 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
      const testContent = {
        heading: 'Francesco Fiori & Piante - Test Update ' + new Date().toLocaleTimeString(),
        subheading: 'Creazioni floreali uniche - Updated at ' + new Date().toLocaleTimeString(),
        backgroundImage: testImage
      };

      addResult('📝 Updating hero content...');
      const success = await updateHeroContent(testContent);

      if (success) {
        addResult('✅ Hero content update successful');
        addResult('🔄 Waiting 3 seconds to verify save...');

        // Wait a moment and check if it was saved
        setTimeout(async () => {
          const { data } = await supabase
            .from('settings')
            .select('*')
            .eq('key', 'heroContent')
            .single();

          if (data) {
            addResult('✅ Verified: Content saved to database');
            addResult(`   - New heading: ${data.value?.heading}`);
            addResult(`   - New background: ${data.value?.backgroundImage}`);
            addResult('🎉 Test completed successfully!');
            addResult('🏠 Go to homepage (http://localhost:8484/) to see changes');
            addResult('🔄 You may need to refresh the page to see the new image');
          } else {
            addResult('❌ Content not found in database after update');
          }
        }, 3000);

      } else {
        addResult('❌ Hero content update failed');
      }

    } catch (error) {
      addResult(`❌ Test update failed: ${error}`);
    }
  };

  const clearResults = () => {
    setDebugResults([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Content Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={debugHeroContent} 
            disabled={isRunning}
            className="flex-1"
          >
            {isRunning ? 'Debugging...' : 'Debug Hero Content'}
          </Button>
          <Button 
            onClick={testHeroUpdate} 
            disabled={isRunning}
            variant="outline"
            className="flex-1"
          >
            Test Update
          </Button>
          <Button 
            onClick={clearResults} 
            variant="ghost"
          >
            Clear
          </Button>
        </div>
        
        {debugResults.length > 0 && (
          <div className="bg-gray-100 p-4 rounded-md max-h-96 overflow-y-auto">
            <h4 className="font-semibold mb-2">Debug Results:</h4>
            {debugResults.map((result, index) => (
              <div key={index} className="text-sm font-mono whitespace-pre-wrap">
                {result}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HeroDebugger;
