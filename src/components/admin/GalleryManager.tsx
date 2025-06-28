
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import GalleryImageCard from './GalleryImageCard';
import GalleryUploadDialog from './GalleryUploadDialog';
import MultipleImageUploader, { ImageWithLabel } from './MultipleImageUploader';
import { Plus, Save, Upload } from 'lucide-react';
import { useGalleryManager } from '@/hooks/use-gallery-manager';
import { GalleryImage } from '@/types/gallery';

const GalleryManager: React.FC = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const { 
    images, 
    isLoading,
    addImage,
    removeImage,
    handleDrop,
    updateImageOrder,
    saveChanges,
    toggleFeatured
  } = useGalleryManager();

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    setDragOverId(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverId(null);
  };

  const handleDelete = (id: string) => {
    removeImage(id);
    setHasChanges(true);
    toast({
      title: "Image removed",
      description: "The image has been removed from the gallery",
    });
  };

  const handleUpload = (image: GalleryImage) => {
    addImage(image);
    setHasChanges(true);
    setIsDialogOpen(false);
    toast({
      title: "Image added",
      description: "The image has been added to the gallery",
    });
  };

  const handleMultipleUpload = (imageUrls: string[]) => {
    imageUrls.forEach((url, index) => {
      const newImage: GalleryImage = {
        id: `${Date.now()}-${index}`,
        url,
        title: `Gallery Image ${images.length + index + 1}`,
        description: '',
        order: images.length + index,
        is_featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      addImage(newImage);
    });

    setHasChanges(true);
    toast({
      title: `${imageUrls.length} images added`,
      description: `Successfully uploaded ${imageUrls.length} images to the gallery`,
    });
  };

  const handleSaveChanges = async () => {
    setIsUploading(true);
    try {
      await saveChanges();
      setHasChanges(false);
      toast({
        title: "Gallery saved",
        description: "Your gallery has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save gallery changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Custom implementation of onDrop that works with our hook
  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    
    if (!sourceId || sourceId === targetId) return;
    
    // Find the indexes of the source and target images
    const sourceIndex = images.findIndex(img => img.id === sourceId);
    const targetIndex = images.findIndex(img => img.id === targetId);
    
    if (sourceIndex === -1 || targetIndex === -1) return;
    
    // Use our own implementation instead of calling the hook directly
    const newImages = [...images];
    const [movedImage] = newImages.splice(sourceIndex, 1);
    newImages.splice(targetIndex, 0, movedImage);
    
    // Update the image order
    updateImageOrder(newImages);
    setHasChanges(true);
    setDragOverId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Gallery Manager</h2>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsDialogOpen(true)} 
            variant="outline" 
            className="flex items-center gap-1"
          >
            <Plus size={16} />
            Add Image
          </Button>
          <Button 
            onClick={handleSaveChanges} 
            disabled={!hasChanges || isUploading} 
            className="flex items-center gap-2"
          >
            <Save size={16} />
            Save Changes
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gallery Images</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Multiple Image Upload Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Multiple Image Upload
            </h3>
            <MultipleImageUploader
              onImagesSelected={(imageUrls) => {
                // Handle simple image URLs (fallback)
                imageUrls.forEach((url, index) => {
                  const newImage: GalleryImage = {
                    id: `${Date.now()}-${index}`,
                    url: url,
                    title: `Gallery Image ${images.length + index + 1}`,
                    description: '',
                    order: images.length + index,
                    is_featured: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };
                  addImage(newImage);
                });

                setHasChanges(true);
                toast({
                  title: `${imageUrls.length} images added`,
                  description: `Successfully uploaded ${imageUrls.length} images to the gallery`,
                });
              }}
              onImagesWithLabelsSelected={(imagesWithLabels) => {
                imagesWithLabels.forEach((item, index) => {
                  const newImage: GalleryImage = {
                    id: `${Date.now()}-${index}`,
                    url: item.url,
                    title: item.label || `Gallery Image ${images.length + index + 1}`,
                    description: '',
                    order: images.length + index,
                    is_featured: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };
                  addImage(newImage);
                });

                setHasChanges(true);
                toast({
                  title: `${imagesWithLabels.length} images added`,
                  description: `Successfully uploaded ${imagesWithLabels.length} images with labels to the gallery`,
                });
              }}
              buttonLabel="Upload Multiple Images with Labels"
              bucketName="gallery"
              folderPath=""
              maxFiles={50}
              enableLabels={true}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-6">
            <p className="text-center text-sm text-gray-500 -mt-3 bg-white px-4 inline-block">
              Current Gallery Images
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-persian-gold"></div>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-gray-500">No images in the gallery yet. Add some images to get started.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <GalleryImageCard 
                  key={image.id}
                  image={image}
                  index={index} // Added index prop
                  onDelete={() => handleDelete(image.id)}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={onDrop}
                  isDragOver={dragOverId === image.id}
                  onToggleFeatured={() => {
                    toggleFeatured(image.id);
                    setHasChanges(true);
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-500">
            Drag and drop images to reorder them. Featured images will appear first in the gallery.
          </p>
        </CardFooter>
      </Card>

      <GalleryUploadDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        onUploadComplete={handleUpload}
      />
    </div>
  );
};

export default GalleryManager;
