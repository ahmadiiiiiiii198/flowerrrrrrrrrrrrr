import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ImageUploader from './ImageUploader';
import { Trash2, Save, RefreshCw } from 'lucide-react';

interface CategoryPicture {
  id: string;
  image_url: string;
  alt_text: string | null;
  position: number;
  is_active: boolean;
}

const CategoryPicturesManager: React.FC = () => {
  const [pictures, setPictures] = useState<CategoryPicture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPictures();
  }, []);

  const loadPictures = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('category_pictures')
        .select('*')
        .order('position');

      if (error) {
        console.error('Error loading pictures:', error);
        toast({
          title: 'Error',
          description: 'Failed to load category pictures',
          variant: 'destructive',
        });
        return;
      }

      // Ensure we have 3 positions
      const existingPictures = data || [];
      const allPositions = [1, 2, 3];
      const fullPictures: CategoryPicture[] = allPositions.map(position => {
        const existing = existingPictures.find(p => p.position === position);
        return existing || {
          id: `temp-${position}`,
          image_url: '',
          alt_text: '',
          position,
          is_active: true,
        };
      });

      setPictures(fullPictures);
    } catch (error) {
      console.error('Error loading pictures:', error);
      toast({
        title: 'Error',
        description: 'Failed to load category pictures',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePicture = (position: number, field: keyof CategoryPicture, value: any) => {
    setPictures(prev => prev.map(pic => 
      pic.position === position 
        ? { ...pic, [field]: value }
        : pic
    ));
    setHasChanges(true);
  };

  const handleImageUpload = (position: number, imageUrl: string) => {
    updatePicture(position, 'image_url', imageUrl);
  };

  const deletePicture = async (position: number) => {
    const picture = pictures.find(p => p.position === position);
    if (!picture || picture.id.startsWith('temp-')) {
      // Just clear the local state for new pictures
      updatePicture(position, 'image_url', '');
      updatePicture(position, 'alt_text', '');
      return;
    }

    try {
      const { error } = await supabase
        .from('category_pictures')
        .delete()
        .eq('id', picture.id);

      if (error) {
        console.error('Error deleting picture:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete picture',
          variant: 'destructive',
        });
        return;
      }

      updatePicture(position, 'image_url', '');
      updatePicture(position, 'alt_text', '');
      updatePicture(position, 'id', `temp-${position}`);
      
      toast({
        title: 'Success',
        description: 'Picture deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting picture:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete picture',
        variant: 'destructive',
      });
    }
  };

  const savePictures = async () => {
    try {
      setIsSaving(true);

      for (const picture of pictures) {
        if (!picture.image_url) continue; // Skip empty pictures

        if (picture.id.startsWith('temp-')) {
          // Insert new picture
          const { error } = await supabase
            .from('category_pictures')
            .insert({
              image_url: picture.image_url,
              alt_text: picture.alt_text || null,
              position: picture.position,
              is_active: true,
            });

          if (error) {
            console.error('Error inserting picture:', error);
            throw error;
          }
        } else {
          // Update existing picture
          const { error } = await supabase
            .from('category_pictures')
            .update({
              image_url: picture.image_url,
              alt_text: picture.alt_text || null,
              is_active: picture.is_active,
            })
            .eq('id', picture.id);

          if (error) {
            console.error('Error updating picture:', error);
            throw error;
          }
        }
      }

      setHasChanges(false);
      toast({
        title: 'Success',
        description: 'Category pictures saved successfully',
      });

      // Reload to get fresh data with proper IDs
      await loadPictures();
    } catch (error) {
      console.error('Error saving pictures:', error);
      toast({
        title: 'Error',
        description: 'Failed to save category pictures',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile-optimized header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-center md:text-left">
          <h2 className="text-lg md:text-2xl font-bold">Category Pictures Manager</h2>
          <p className="text-sm md:text-base text-gray-600">Manage the 3 pictures displayed in the Categories section</p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <Button
            onClick={loadPictures}
            variant="outline"
            disabled={isSaving}
            className="w-full md:w-auto text-xs md:text-sm"
            size="sm"
          >
            <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            Refresh
          </Button>
          <Button
            onClick={savePictures}
            disabled={!hasChanges || isSaving}
            className="w-full md:w-auto text-xs md:text-sm"
            size="sm"
          >
            <Save className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {pictures.map((picture) => (
          <Card key={picture.position} className="overflow-hidden">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-base md:text-lg">Picture {picture.position}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 px-3 md:px-6">
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor={`alt-${picture.position}`} className="text-sm font-medium">Alt Text</Label>
                <Input
                  id={`alt-${picture.position}`}
                  value={picture.alt_text || ''}
                  onChange={(e) => updatePicture(picture.position, 'alt_text', e.target.value)}
                  placeholder="Describe the image..."
                  className="text-sm md:text-base"
                />
              </div>

              <div className="space-y-1 md:space-y-2">
                <Label className="text-sm font-medium">Image</Label>
                {picture.image_url ? (
                  <div className="relative">
                    <img
                      src={picture.image_url}
                      alt={picture.alt_text || `Picture ${picture.position}`}
                      className="w-full h-40 md:h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 md:h-9 md:w-9"
                      onClick={() => deletePicture(picture.position)}
                    >
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                ) : (
                  <ImageUploader
                    onImageSelected={(imageUrl) => handleImageUpload(picture.position, imageUrl)}
                    buttonLabel="Upload Image"
                    className="w-full"
                    bucketName="gallery"
                    folderPath="category-pictures"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CategoryPicturesManager;
