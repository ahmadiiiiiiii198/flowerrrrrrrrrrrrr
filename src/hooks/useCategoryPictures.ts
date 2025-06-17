import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CategoryPicture {
  id: string;
  image_url: string;
  alt_text: string | null;
  position: number;
  is_active: boolean;
}

export const useCategoryPictures = () => {
  const [pictures, setPictures] = useState<CategoryPicture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPictures = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('category_pictures')
        .select('*')
        .eq('is_active', true)
        .order('position');

      if (fetchError) {
        console.error('Error loading category pictures:', fetchError);
        setError('Failed to load category pictures');
        return;
      }

      setPictures(data || []);
    } catch (err) {
      console.error('Error loading category pictures:', err);
      setError('Failed to load category pictures');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPictures();
  }, []);

  const refetch = () => {
    loadPictures();
  };

  return {
    pictures,
    isLoading,
    error,
    refetch,
  };
};
