
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ContentSection {
  id: string;
  section_key: string;
  section_name: string;
  content_type: string;
  content_value: string | null;
  metadata: any;
  is_active: boolean;
}

export const useContent = (sectionKey?: string) => {
  return useQuery({
    queryKey: ['content-sections', sectionKey],
    queryFn: async () => {
      let query = supabase
        .from('content_sections')
        .select('*')
        .eq('is_active', true);
      
      if (sectionKey) {
        query = query.eq('section_key', sectionKey);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (sectionKey) {
        return data?.[0] as ContentSection | null;
      }
      
      return data as ContentSection[];
    }
  });
};

export const useContentBySection = (section: string) => {
  return useQuery({
    queryKey: ['content-sections-by-section', section],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_sections')
        .select('*')
        .eq('is_active', true)
        .contains('metadata', { section });
      
      if (error) throw error;
      return data as ContentSection[];
    }
  });
};
