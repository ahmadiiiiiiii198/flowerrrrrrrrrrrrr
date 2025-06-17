import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Image, Database, CheckCircle, RefreshCw } from 'lucide-react';
import { settingsService } from '@/services/settingsService';

const HeroImageFixer = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [fixResults, setFixResults] = useState<string[]>([]);
  const { toast } = useToast();

  const addResult = (message: string) => {
    setFixResults(prev => [...prev, message]);
  };

  const fixHeroImage = async () => {
    setIsFixing(true);
    setFixResults([]);
    
    try {
      addResult('🔄 Starting hero image database fix...');
      
      // Check current hero content
      addResult('📊 Checking current hero content...');
      const currentHeroContent = await settingsService.getSetting('heroContent');
      
      if (currentHeroContent) {
        addResult(`✅ Found hero content: ${JSON.stringify(currentHeroContent)}`);
      } else {
        addResult('⚠️ No hero content found in database');
      }

      // Set proper hero content with a good default image
      const properHeroContent = {
        heading: 'Francesco Fiori & Piante',
        subheading: 'Scopri l\'eleganza floreale firmata Francesco: fiori, piante e creazioni per ogni occasione. 🌸🌿',
        backgroundImage: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80'
      };

      addResult('💾 Updating hero content in database...');
      await settingsService.updateSetting('heroContent', properHeroContent);
      addResult('✅ Hero content updated in database');

      // Update localStorage
      addResult('📱 Updating localStorage...');
      localStorage.setItem('heroContent', JSON.stringify(properHeroContent));
      addResult('✅ localStorage updated');

      // Trigger hero content update event
      addResult('📡 Triggering hero content update event...');
      window.dispatchEvent(new CustomEvent('heroContentUpdated', {
        detail: properHeroContent
      }));
      addResult('✅ Hero content update event triggered');

      // Force page refresh to ensure changes take effect
      addResult('🔄 Refreshing page to apply changes...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);

      addResult('🎉 Hero image fix completed successfully!');
      
      toast({
        title: 'Hero Image Fixed! 🖼️',
        description: 'The hero image should now load properly from the database',
      });

    } catch (error) {
      addResult(`❌ Error fixing hero image: ${error}`);
      toast({
        title: 'Fix Failed',
        description: 'An error occurred while fixing the hero image',
        variant: 'destructive',
      });
    } finally {
      setIsFixing(false);
    }
  };

  const testHeroContent = async () => {
    setIsFixing(true);
    setFixResults([]);
    
    try {
      addResult('🧪 Testing hero content database connection...');
      
      const heroContent = await settingsService.getSetting('heroContent');
      if (heroContent) {
        addResult('✅ Hero content found in database:');
        addResult(`   📝 Heading: ${heroContent.heading}`);
        addResult(`   📝 Subheading: ${heroContent.subheading?.substring(0, 50)}...`);
        addResult(`   🖼️ Background Image: ${heroContent.backgroundImage}`);
      } else {
        addResult('❌ No hero content found in database');
      }

      const logoSettings = await settingsService.getSetting('logoSettings');
      if (logoSettings) {
        addResult('✅ Logo settings found in database:');
        addResult(`   🏷️ Logo URL: ${logoSettings.logoUrl}`);
        addResult(`   📝 Alt Text: ${logoSettings.altText}`);
      } else {
        addResult('❌ No logo settings found in database');
      }

      // Check localStorage
      const localHero = localStorage.getItem('heroContent');
      if (localHero) {
        addResult('✅ Hero content found in localStorage');
      } else {
        addResult('⚠️ No hero content in localStorage');
      }

    } catch (error) {
      addResult(`❌ Error testing hero content: ${error}`);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Hero Image Database Fixer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">Hero Image Issue</h4>
          <p className="text-sm text-yellow-700 mb-3">
            If the hero image is showing the default placeholder instead of the uploaded image, 
            this tool will fix the database connection and ensure proper image loading.
          </p>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Checks database hero content</li>
            <li>• Updates localStorage cache</li>
            <li>• Triggers content refresh events</li>
            <li>• Forces page reload to apply changes</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={testHeroContent}
            disabled={isFixing}
            variant="outline"
            className="flex-1"
          >
            {isFixing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Test Database Connection
              </>
            )}
          </Button>

          <Button
            onClick={fixHeroImage}
            disabled={isFixing}
            className="flex-1"
          >
            {isFixing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Fix Hero Image
              </>
            )}
          </Button>
        </div>

        {fixResults.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
            <h4 className="font-medium mb-2">Fix Progress:</h4>
            <div className="space-y-1 text-sm font-mono">
              {fixResults.map((result, index) => (
                <div key={index} className="text-gray-700">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">How to Upload New Hero Image</h4>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Go to the "Hero Section" tab in admin panel</li>
            <li>2. Click "Upload Hero Image" button</li>
            <li>3. Select your image (recommended: 2000x1000px or larger)</li>
            <li>4. Click "Save Changes"</li>
            <li>5. The new image will appear on the homepage</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeroImageFixer;
