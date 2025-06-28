import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, GripVertical, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import MultipleImageUploader, { ImageWithLabel } from './MultipleImageUploader';

interface CategoryGalleryManagerProps {
  categoryKey: string;
  categoryName: string;
}

interface GalleryImage {
  id: string;
  url: string;
  order: number;
  label?: string;
}

const CategoryGalleryManager: React.FC<CategoryGalleryManagerProps> = ({ 
  categoryKey, 
  categoryName 
}) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const { toast } = useToast();

  // Load images from database
  useEffect(() => {
    loadImages();
  }, [categoryKey]);

  const loadImages = async () => {
    try {
      setIsLoading(true);
      console.log('[CategoryGallery] Loading images for category:', categoryKey);

      const { data, error } = await supabase
        .from('content_sections')
        .select('content_value')
        .eq('section_key', `category_${categoryKey}_images`)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[CategoryGallery] Database error:', error);
        throw error;
      }

      if (data?.content_value) {
        try {
          const parsedData = JSON.parse(data.content_value);
          console.log('[CategoryGallery] Loaded data:', parsedData);

          let galleryImages: GalleryImage[] = [];

          // Handle both old format (array of strings) and new format (array of objects with url and label)
          if (Array.isArray(parsedData)) {
            if (parsedData.length > 0 && typeof parsedData[0] === 'string') {
              // Old format: array of URL strings
              galleryImages = parsedData
                .filter(url => url && url.trim())
                .map((url, index) => ({
                  id: `${index}`,
                  url: url.trim(),
                  order: index,
                  label: ''
                }));
            } else {
              // New format: array of objects with url and label
              galleryImages = parsedData
                .filter(item => item && item.url && item.url.trim())
                .map((item, index) => ({
                  id: `${index}`,
                  url: item.url.trim(),
                  order: index,
                  label: item.label || ''
                }));
            }
          }

          setImages(galleryImages);
          console.log('[CategoryGallery] Set gallery images:', galleryImages);
        } catch (parseError) {
          console.error('[CategoryGallery] JSON parse error:', parseError);
          setImages([]);
        }
      } else {
        console.log('[CategoryGallery] No existing images found');
        setImages([]);
      }
    } catch (error) {
      console.error('[CategoryGallery] Error loading images:', error);
      toast({
        title: 'Error',
        description: `Failed to load gallery images: ${error.message || error}`,
        variant: 'destructive'
      });
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveImages = async (newImages: GalleryImage[]) => {
    try {
      setIsSaving(true);
      const imageData = newImages
        .filter(img => img.url) // Only include images with URLs
        .sort((a, b) => a.order - b.order)
        .map(img => ({
          url: img.url,
          label: img.label || ''
        }));

      console.log('[CategoryGallery] Saving images with labels:', imageData);

      // First, check if the section exists
      const { data: existingSection, error: fetchError } = await supabase
        .from('content_sections')
        .select('id')
        .eq('section_key', `category_${categoryKey}_images`)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('[CategoryGallery] Error checking existing section:', fetchError);
        throw fetchError;
      }

      let result;
      if (existingSection) {
        // Update existing section
        result = await supabase
          .from('content_sections')
          .update({
            content_value: JSON.stringify(imageData),
            updated_at: new Date().toISOString()
          })
          .eq('section_key', `category_${categoryKey}_images`);
      } else {
        // Insert new section
        result = await supabase
          .from('content_sections')
          .insert({
            section_key: `category_${categoryKey}_images`,
            section_name: `Category Images: ${categoryName}`,
            content_type: 'json',
            content_value: JSON.stringify(imageData),
            metadata: { section: 'categories' },
            is_active: true
          });
      }

      if (result.error) {
        console.error('[CategoryGallery] Database error:', result.error);
        throw result.error;
      }

      console.log('[CategoryGallery] Images saved successfully');
      toast({
        title: 'Success',
        description: 'Gallery images saved successfully'
      });
    } catch (error) {
      console.error('[CategoryGallery] Error saving images:', error);
      toast({
        title: 'Error',
        description: `Failed to save gallery images: ${error.message || error}`,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (file: File, index: number) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 52428800) { // 50MB
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 50MB',
        variant: 'destructive'
      });
      return;
    }

    setUploadingIndex(index);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `category-${categoryKey}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `categories/${categoryKey}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('admin-uploads')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('admin-uploads')
        .getPublicUrl(filePath);

      const newImages = [...images];
      if (index < newImages.length) {
        newImages[index] = { ...newImages[index], url: data.publicUrl };
      } else {
        newImages.push({
          id: Date.now().toString(),
          url: data.publicUrl,
          order: newImages.length
        });
      }

      setImages(newImages);
      await saveImages(newImages);

      toast({
        title: 'Success',
        description: 'Image uploaded successfully'
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploadingIndex(null);
    }
  };

  const addImageSlot = () => {
    const newImage: GalleryImage = {
      id: Date.now().toString(),
      url: '',
      order: images.length
    };
    setImages([...images, newImage]);
  };

  const removeImage = async (index: number) => {
    try {
      console.log('[CategoryGallery] Removing image at index:', index);
      const newImages = images.filter((_, i) => i !== index)
        .map((img, i) => ({ ...img, order: i, id: i.toString() }));

      console.log('[CategoryGallery] New images after removal:', newImages);
      setImages(newImages);
      await saveImages(newImages);
    } catch (error) {
      console.error('[CategoryGallery] Error removing image:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove image',
        variant: 'destructive'
      });
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    try {
      console.log('[CategoryGallery] Reordering images');
      const items = Array.from(images);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      const reorderedImages = items.map((item, index) => ({
        ...item,
        order: index,
        id: index.toString()
      }));

      console.log('[CategoryGallery] Reordered images:', reorderedImages);
      setImages(reorderedImages);
      await saveImages(reorderedImages);
    } catch (error) {
      console.error('[CategoryGallery] Error reordering images:', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder images',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{categoryName} Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {categoryName} Gallery
          <Button onClick={addImageSlot} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Image
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Multiple Image Upload Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Multiple Image Upload</h3>
          <MultipleImageUploader
            onImagesSelected={(imageUrls) => {
              // Handle simple image URLs (fallback)
              const newImages = imageUrls.map((url, index) => ({
                id: `${Date.now()}-${index}`,
                url: url,
                label: '',
                order: index
              }));
              setImages(newImages);
              saveImages(newImages);
            }}
            onImagesWithLabelsSelected={(imagesWithLabels) => {
              const newImages = imagesWithLabels.map((item, index) => ({
                id: `${Date.now()}-${index}`,
                url: item.url,
                label: item.label,
                order: index
              }));
              setImages(newImages);
              saveImages(newImages);
            }}
            currentImagesWithLabels={images.map(img => ({ url: img.url, label: img.label || '' }))}
            buttonLabel="Upload Multiple Images with Labels"
            bucketName="admin-uploads"
            folderPath={`categories/${categoryKey}`}
            maxFiles={20}
            enableLabels={true}
            className="border-2 border-dashed border-gray-300 rounded-lg p-4"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-6">
          <p className="text-center text-sm text-gray-500 -mt-3 bg-white px-4 inline-block">
            OR use individual upload slots below
          </p>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="gallery-images">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {images.map((image, index) => (
                  <Draggable key={image.id} draggableId={image.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="border rounded-lg p-4 bg-white"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </div>
                          <span className="text-sm text-gray-500">Image {index + 1}</span>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeImage(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {image.url ? (
                          <div className="relative mb-2">
                            <img
                              src={image.url}
                              alt={`${categoryName} ${index + 1}`}
                              className="w-full h-32 object-cover rounded"
                            />
                            {image.label && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 rounded-b">
                                {image.label}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center mb-2">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, index);
                            }}
                            disabled={uploadingIndex === index}
                            className="w-full"
                          />

                          <Input
                            type="text"
                            placeholder="Image label (optional)"
                            value={image.label || ''}
                            onChange={(e) => {
                              const newImages = [...images];
                              newImages[index] = { ...newImages[index], label: e.target.value };
                              setImages(newImages);
                              saveImages(newImages);
                            }}
                            className="w-full text-sm"
                          />
                        </div>

                        {uploadingIndex === index && (
                          <div className="flex items-center justify-center mt-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm">Uploading...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {isSaving && (
          <div className="flex items-center justify-center mt-4">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">Saving changes...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryGalleryManager;
