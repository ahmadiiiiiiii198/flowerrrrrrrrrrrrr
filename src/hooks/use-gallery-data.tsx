
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GalleryImage, GalleryContent } from '@/types/gallery';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export function useGalleryData() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();
  
  // Default gallery content
  const [galleryContent, setGalleryContent] = useState<GalleryContent>({
    heading: 'Gallery',
    subheading: "Explore our restaurant's atmosphere and dishes through our gallery."
  });

  // Function to load gallery data
  const loadGalleryData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First try to load gallery content settings
      const { data: contentData, error: contentError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'galleryContent')
        .single();
        
      if (!contentError && contentData?.value) {
        // Type-safe conversion of JSON data
        const rawContent = contentData.value as unknown;
        if (
          typeof rawContent === 'object' && 
          rawContent !== null && 
          'heading' in rawContent && 
          'subheading' in rawContent
        ) {
          setGalleryContent({
            heading: String(rawContent.heading || 'Gallery'),
            subheading: String(rawContent.subheading || "Explore our restaurant's atmosphere and dishes through our gallery.")
          });
        }
      }
      
      // Load gallery images from settings table (gallery table doesn't exist)
      console.log('Loading gallery images from settings table...');
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('value, updated_at')
        .eq('key', 'galleryImages')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (settingsError) {
        console.warn('Error loading from settings table:', settingsError);
        throw settingsError;
      }

      if (settingsData && settingsData.length > 0 && settingsData[0].value) {
        // Type-safe conversion of JSON data
        const rawGalleryData = settingsData[0].value as unknown;

        if (Array.isArray(rawGalleryData)) {
          const validImages = rawGalleryData
            .filter(item =>
              typeof item === 'object' &&
              item !== null &&
              'id' in item &&
              ('src' in item || 'url' in item)
            )
            .map(item => ({
              id: String(item.id || ''),
              src: String(item.src || item.url || ''),
              alt: String(item.alt || item.title || 'Gallery Image'),
              featured: Boolean(item.featured || item.is_featured || false)
            }));

          setImages(validImages);
          if (settingsData[0].updated_at) {
            setLastUpdated(new Date(settingsData[0].updated_at));
          }
          console.log('Loaded gallery images from settings table:', validImages.length);
        }
      } else {
        // No gallery images found in database
        console.log('No gallery images found in database');
        setImages([]);
      }
    } catch (err) {
      console.error('Error loading gallery data:', err);
      setError('Failed to load gallery images. Please try again later.');
      
      // Try to load from localStorage as last resort
      try {
        const localData = localStorage.getItem('galleryImages');
        if (localData) {
          const parsedData = JSON.parse(localData);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            setImages(parsedData);
            console.log('Loaded gallery images from localStorage:', parsedData.length);
          }
        }
      } catch (localError) {
        console.error('Error loading from localStorage:', localError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Listen for storage bucket changes
  useEffect(() => {
    loadGalleryData();
    
    // Listen for localStorage update events (for cross-tab sync)
    const handleStorageUpdate = (event: StorageEvent | CustomEvent) => {
      if (
        (event as StorageEvent).key === 'galleryImages' || 
        ((event as CustomEvent).detail && (event as CustomEvent).detail.key === 'galleryImages')
      ) {
        console.log('Gallery: Detected gallery update, refreshing data');
        loadGalleryData();
      }
    };

    // Listen for both storage events and custom events
    window.addEventListener('storage', handleStorageUpdate as EventListener);
    window.addEventListener('localStorageUpdated', handleStorageUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageUpdate as EventListener);
      window.removeEventListener('localStorageUpdated', handleStorageUpdate as EventListener);
    };
  }, [loadGalleryData]);

  // Function to manually refresh gallery data
  const refreshGalleryData = useCallback(() => {
    toast({
      title: 'Refreshing gallery',
      description: 'Loading the latest images...',
    });
    
    loadGalleryData();
  }, [toast, loadGalleryData]);

  return {
    galleryContent,
    images,
    isLoading,
    error,
    lastUpdated,
    refreshGalleryData
  };
}
