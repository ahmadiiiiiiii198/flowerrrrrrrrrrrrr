
import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { GalleryImage } from '@/types/gallery';
import { Json } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

export const useGalleryManager = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeGalleryItem, setActiveGalleryItem] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Load gallery images from database
  const loadImages = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('[GalleryManager] Loading images from database...');

      // Load from settings table (gallery table doesn't exist)
      console.log('[GalleryManager] Loading images from settings table...');
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('value, updated_at')
        .eq('key', 'galleryImages')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!settingsError && settingsData && settingsData.length > 0) {
        const rawData = settingsData[0].value;
        if (Array.isArray(rawData)) {
          const validImages: GalleryImage[] = rawData
            .filter(img =>
              typeof img === 'object' &&
              img !== null &&
              'id' in img &&
              ('src' in img || 'url' in img)
            )
            .map(img => ({
              id: String(img.id || uuidv4()),
              url: String(img.src || img.url || ''),
              title: String(img.title || img.alt || 'Gallery Image'),
              description: String(img.description || ''),
              order: Number(img.order || 0),
              is_featured: Boolean(img.featured || img.is_featured || false),
              created_at: String(img.created_at || new Date().toISOString()),
              updated_at: String(img.updated_at || new Date().toISOString())
            }));

          setImages(validImages);
          console.log(`[GalleryManager] Loaded ${validImages.length} images from settings table`);
        } else {
          console.log('[GalleryManager] No valid images found in settings table');
          setImages([]);
        }
      } else {
        console.log('[GalleryManager] No images found in database');
        setImages([]);
      }
    } catch (error) {
      console.error('[GalleryManager] Error loading images:', error);
      toast({
        title: "Error loading gallery",
        description: "Could not load gallery images. Please try again later.",
        variant: "destructive",
      });
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Save images to database (settings table only)
  const saveImages = useCallback(async (newImages: GalleryImage[]) => {
    try {
      console.log(`[GalleryManager] Saving ${newImages.length} images to settings table...`);

      // Save to localStorage for immediate feedback
      localStorage.setItem('galleryImages', JSON.stringify(newImages));

      // Save to settings table
      const { error: settingsError } = await supabase
        .from('settings')
        .upsert({
          key: 'galleryImages',
          value: newImages as unknown as Json,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (settingsError) {
        throw settingsError;
      }

      console.log(`[GalleryManager] Successfully saved ${newImages.length} images to settings table`);

      // Dispatch update event
      const event = new CustomEvent('localStorageUpdated', {
        detail: {
          key: 'galleryImages',
          timestamp: Date.now(),
          source: 'gallery-manager'
        }
      });
      window.dispatchEvent(event);

      return true;
    } catch (error) {
      console.error('[GalleryManager] Error saving images:', error);
      toast({
        title: "Error saving gallery",
        description: "Could not save gallery changes. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);
  
  // Add a new image to the gallery
  const addImage = useCallback((image: GalleryImage) => {
    setImages(prev => {
      const newImages = [...prev, { ...image, id: image.id || uuidv4() }];
      // Save asynchronously but don't wait for it
      saveImages(newImages).catch(error => {
        console.error('[GalleryManager] Error saving after adding image:', error);
      });
      return newImages;
    });
  }, [saveImages]);

  // Remove an image from the gallery
  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const newImages = prev.filter(img => img.id !== id);
      // Save asynchronously but don't wait for it
      saveImages(newImages).catch(error => {
        console.error('[GalleryManager] Error saving after removing image:', error);
      });
      return newImages;
    });
  }, [saveImages]);
  
  // Handle the drop event for reordering images
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    
    // Get the dragged image ID from dataTransfer
    const draggedImageId = e.dataTransfer.getData("text");
    
    if (!draggedImageId) {
      console.warn("No image ID found in drop event");
      return;
    }
    
    setImages(prev => {
      // Find the image that was dragged
      const draggedImageIndex = prev.findIndex(img => img.id === draggedImageId);
      
      if (draggedImageIndex === -1) {
        console.warn(`Image with ID ${draggedImageId} not found`);
        return prev;
      }
      
      // Create a new array with the reordered images
      const newImages = [...prev];
      const [movedImage] = newImages.splice(draggedImageIndex, 1);
      newImages.splice(targetIndex, 0, movedImage);
      
      // Save the new order
      saveImages(newImages).catch(error => {
        console.error('[GalleryManager] Error saving after reordering:', error);
      });
      
      return newImages;
    });
  }, [saveImages]);
  
  // Handle the dragover event
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);
  
  // Handle the drag start event
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("text", id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);
  
  // Initialize by loading images
  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Update image order and expose it to consumers
  const updateImageOrder = useCallback((newOrder: GalleryImage[]) => {
    setImages(newOrder);
    saveImages(newOrder).catch(error => {
      console.error('[GalleryManager] Error saving after updating order:', error);
    });
  }, [saveImages]);

  // Save changes explicitly - needed for external components
  const saveChanges = useCallback(async () => {
    return await saveImages(images);
  }, [saveImages, images]);
  
  return {
    images,
    isLoading,
    addImage,
    removeImage,
    handleDrop,
    handleDragOver,
    handleDragStart,
    activeGalleryItem,
    setActiveGalleryItem,
    reloadImages: loadImages,
    updateImages: (newImages: GalleryImage[]) => {
      setImages(newImages);
      saveImages(newImages).catch(error => {
        console.error('[GalleryManager] Error saving after updating images:', error);
      });
    },
    toggleFeatured: (id: string) => {
      setImages(prev => {
        const newImages = prev.map(img =>
          img.id === id ? { ...img, is_featured: !img.is_featured } : img
        );
        saveImages(newImages).catch(error => {
          console.error('[GalleryManager] Error saving after toggling featured:', error);
        });
        return newImages;
      });
    },
    // Add these explicitly to fix TypeScript errors
    updateImageOrder,
    saveChanges
  };
};
