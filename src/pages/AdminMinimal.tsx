import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHeroContent } from '@/hooks/use-settings';
import HeroContentEditor from '@/components/admin/HeroContentEditor';
import HeroDebugger from '@/components/admin/HeroDebugger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminMinimal = () => {
  const { toast } = useToast();
  const [heroContent, updateHeroContent, isHeroLoading] = useHeroContent();

  const { data: contentSections, isLoading, error } = useQuery({
    queryKey: ['content-sections-test'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_sections')
        .select('*')
        .limit(1);

      if (error) {
        console.error('Query error:', error);
        return [];
      }

      return data || [];
    },
    retry: false
  });
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8 md:pt-24 md:py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Minimal Admin Panel</h1>
        <p className="text-gray-600">This is a minimal admin panel to test basic functionality</p>
        
        <div className="mt-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Section</h2>
          <p>If you can see this, the basic React component structure works.</p>
          <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
          <p>Error: {error ? error.message : 'None'}</p>
          <p>Data: {contentSections ? `${contentSections.length} items` : 'None'}</p>
          <p>Hero Loading: {isHeroLoading ? 'Yes' : 'No'}</p>
          <p>Hero Content: {heroContent ? `${heroContent.heading}` : 'None'}</p>
        </div>

        <div className="mt-8">
          <Tabs defaultValue="hero" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="hero">Hero Section</TabsTrigger>
              <TabsTrigger value="test">Test Section</TabsTrigger>
            </TabsList>

            <TabsContent value="hero" className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Hero Section Content</h2>
              <HeroContentEditor />
              <HeroDebugger />
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Test Section</h2>
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p>This is a test tab to verify tabs work correctly</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminMinimal;
