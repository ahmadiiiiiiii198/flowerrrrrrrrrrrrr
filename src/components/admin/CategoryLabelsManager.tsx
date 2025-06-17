import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LabelsManager from './LabelsManager';

interface CategoryLabelsManagerProps {
  categoryKey: string;
  categoryName: string;
}

const CategoryLabelsManager: React.FC<CategoryLabelsManagerProps> = ({ 
  categoryKey, 
  categoryName 
}) => {
  const [labels, setLabels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load labels from database
  useEffect(() => {
    loadLabels();
  }, [categoryKey]);

  const loadLabels = async () => {
    try {
      setIsLoading(true);
      console.log('[CategoryLabels] Loading labels for category:', categoryKey);

      // First, try to find the category by slug (categoryKey)
      const { data: category, error } = await supabase
        .from('categories')
        .select('labels')
        .eq('slug', categoryKey)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[CategoryLabels] Database error:', error);
        throw error;
      }

      if (category?.labels) {
        const categoryLabels = Array.isArray(category.labels) ? category.labels : [];
        console.log('[CategoryLabels] Loaded labels:', categoryLabels);
        setLabels(categoryLabels);
      } else {
        console.log('[CategoryLabels] No existing labels found');
        setLabels([]);
      }
    } catch (error) {
      console.error('[CategoryLabels] Error loading labels:', error);
      toast({
        title: 'Error',
        description: `Failed to load category labels: ${error.message || error}`,
        variant: 'destructive'
      });
      setLabels([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveLabels = async () => {
    try {
      setIsSaving(true);
      console.log('[CategoryLabels] Saving labels for category:', categoryKey, labels);

      // Update the category with new labels
      const { error } = await supabase
        .from('categories')
        .update({
          labels: labels,
          updated_at: new Date().toISOString()
        })
        .eq('slug', categoryKey);

      if (error) {
        console.error('[CategoryLabels] Database error:', error);
        throw error;
      }

      console.log('[CategoryLabels] Labels saved successfully');
      toast({
        title: 'Success',
        description: 'Category labels saved successfully'
      });
    } catch (error) {
      console.error('[CategoryLabels] Error saving labels:', error);
      toast({
        title: 'Error',
        description: `Failed to save category labels: ${error.message || error}`,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{categoryName} Labels</CardTitle>
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
        <CardTitle>{categoryName} Labels</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LabelsManager
          labels={labels}
          onChange={setLabels}
          placeholder={`Add labels for ${categoryName} (e.g., lauree, matrimoni, compleanno)`}
          disabled={isSaving}
        />
        
        <Button 
          onClick={saveLabels}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Labels...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Labels
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CategoryLabelsManager;
