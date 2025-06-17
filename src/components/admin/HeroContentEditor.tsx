import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, RefreshCw } from 'lucide-react';
import ImageUploader from './ImageUploader';
import { useHeroContent } from '@/hooks/use-settings';

const HeroContentEditor = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [heroContent, updateHeroContent, isLoading] = useHeroContent();
  const [localContent, setLocalContent] = useState({
    heading: 'Francesco Fiori & Piante',
    subheading: 'Scopri l\'eleganza floreale firmata Francesco: fiori, piante e creazioni per ogni occasione. 🌸🌿',
    backgroundImage: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80'
  });
  const { toast } = useToast();

  // Sync local content with hook data when it loads
  useEffect(() => {
    if (heroContent && !isLoading) {
      setLocalContent({
        heading: heroContent.heading || 'Francesco Fiori & Piante',
        subheading: heroContent.subheading || 'Scopri l\'eleganza floreale firmata Francesco: fiori, piante e creazioni per ogni occasione. 🌸🌿',
        backgroundImage: heroContent.backgroundImage || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80'
      });
    }
  }, [heroContent, isLoading]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Use the hook to save to database and localStorage
      const success = await updateHeroContent(localContent);

      if (success) {
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('heroContentUpdated', {
          detail: localContent
        }));

        toast({
          title: 'Success! 🎉',
          description: 'Hero content updated successfully',
        });
      } else {
        throw new Error('Failed to save hero content');
      }
    } catch (error) {
      console.error('Error saving hero content:', error);
      toast({
        title: 'Error',
        description: 'Failed to save hero content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (heroContent) {
      setLocalContent({
        heading: heroContent.heading || 'Francesco Fiori & Piante',
        subheading: heroContent.subheading || 'Scopri l\'eleganza floreale firmata Francesco: fiori, piante e creazioni per ogni occasione. 🌸🌿',
        backgroundImage: heroContent.backgroundImage || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80'
      });
    }
  };

  const updateHeading = (value: string) => {
    setLocalContent(prev => ({ ...prev, heading: value }));
  };

  const updateSubheading = (value: string) => {
    setLocalContent(prev => ({ ...prev, subheading: value }));
  };

  const updateBackgroundImage = (imageUrl: string) => {
    console.log('🖼️ HeroContentEditor: Background image updated:', imageUrl);
    setLocalContent(prev => ({ ...prev, backgroundImage: imageUrl }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const hasChanges = 
    localContent.heading !== (heroContent?.heading || '') ||
    localContent.subheading !== (heroContent?.subheading || '') ||
    localContent.backgroundImage !== (heroContent?.backgroundImage || '');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Hero Section Editor
          <div className="flex gap-2">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              disabled={!hasChanges || isSaving}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              size="sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Hero Heading</label>
          <Input
            value={localContent.heading}
            onChange={(e) => updateHeading(e.target.value)}
            placeholder="Enter hero section heading"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Hero Subheading</label>
          <Textarea
            value={localContent.subheading}
            onChange={(e) => updateSubheading(e.target.value)}
            placeholder="Enter hero section subheading"
            className="w-full"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Background Image</label>
          <ImageUploader
            currentImage={localContent.backgroundImage}
            onImageSelected={updateBackgroundImage}
            bucketName="uploads"
            folderPath="hero-images"
            buttonLabel="Upload Hero Image"
          />
          <p className="text-xs text-gray-500 mt-2">
            Upload a high-quality image for the hero section background. Recommended size: 2000x1000px or larger.
          </p>
        </div>

        {/* Preview Section */}
        <div className="border-t pt-6">
          <h4 className="text-sm font-medium mb-3">Preview</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-500">Heading:</span>
                <p className="font-semibold">{localContent.heading || 'No heading set'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Subheading:</span>
                <p className="text-sm">{localContent.subheading || 'No subheading set'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Background Image:</span>
                {localContent.backgroundImage ? (
                  <div className="mt-2">
                    <img 
                      src={localContent.backgroundImage} 
                      alt="Hero background preview" 
                      className="w-full h-24 object-cover rounded border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No background image set</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {hasChanges && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ You have unsaved changes. Click "Save Changes" to apply them to your website.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HeroContentEditor;
