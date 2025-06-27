import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CategoryGalleryManager from './CategoryGalleryManager';
import CategoryLabelsManager from './CategoryLabelsManager';
// initializeDatabase import removed to prevent accidental initialization

interface CategoryContent {
  explanation: string;
  features: string[];
}

const CategoriesGalleryAdmin = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState<string | null>(null);
  // isInitializing state removed since initialization button was removed
  const [categoryContent, setCategoryContent] = useState<Record<string, CategoryContent>>({
    matrimoni: { explanation: '', features: [] },
    fiori_piante: { explanation: '', features: [] },
    fiori_finti: { explanation: '', features: [] },
    funerali: { explanation: '', features: [] }
  });
  const { toast } = useToast();

  const categories = [
    { key: 'matrimoni', name: 'Matrimoni', title: 'Matrimoni' },
    { key: 'fiori_piante', name: 'Fiori & Piante', title: 'Fiori & Piante' },
    { key: 'fiori_finti', name: 'Fiori Finti', title: 'Fiori Finti' },
    { key: 'funerali', name: 'Funerali', title: 'Funerali' }
  ];

  useEffect(() => {
    loadCategoryContent();
  }, []);

  const loadCategoryContent = async () => {
    try {
      setIsLoading(true);
      console.log('[CategoriesAdmin] Loading category content...');

      const { data, error } = await supabase
        .from('content_sections')
        .select('*')
        .contains('metadata', { section: 'categories' });

      if (error) {
        console.error('[CategoriesAdmin] Database error:', error);
        throw error;
      }

      console.log('[CategoriesAdmin] Loaded content sections:', data);
      const content: Record<string, CategoryContent> = {};

      categories.forEach(category => {
        const explanationSection = data?.find(
          item => item.section_key === `category_${category.key}_explanation`
        );
        const featuresSection = data?.find(
          item => item.section_key === `category_${category.key}_features`
        );

        let features: string[] = [];
        if (featuresSection?.content_value) {
          try {
            const parsedFeatures = JSON.parse(featuresSection.content_value);
            features = Array.isArray(parsedFeatures) ? parsedFeatures.filter(f => f && f.trim()) : [];
          } catch (parseError) {
            console.error(`[CategoriesAdmin] Error parsing features for ${category.key}:`, parseError);
            features = [];
          }
        }

        content[category.key] = {
          explanation: explanationSection?.content_value || '',
          features: features
        };

        console.log(`[CategoriesAdmin] Content for ${category.key}:`, content[category.key]);
      });

      setCategoryContent(content);
      console.log('[CategoriesAdmin] Category content loaded successfully');
    } catch (error) {
      console.error('[CategoriesAdmin] Error loading category content:', error);
      toast({
        title: 'Error',
        description: `Failed to load category content: ${error.message || error}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveCategoryContent = async (categoryKey: string, field: 'explanation' | 'features') => {
    try {
      setSaving(`${categoryKey}_${field}`);
      const content = categoryContent[categoryKey];

      let value: string;
      if (field === 'explanation') {
        value = content.explanation;
      } else {
        // Filter out empty features before saving
        const filteredFeatures = content.features.filter(feature => feature && feature.trim());
        value = JSON.stringify(filteredFeatures);
      }

      console.log(`[CategoriesAdmin] Saving ${field} for ${categoryKey}:`, value);

      const sectionKey = `category_${categoryKey}_${field}`;
      const sectionName = `${categories.find(c => c.key === categoryKey)?.name} - ${field === 'explanation' ? 'Explanation' : 'Features'}`;

      // Check if section exists first
      const { data: existingSection, error: fetchError } = await supabase
        .from('content_sections')
        .select('id')
        .eq('section_key', sectionKey)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(`[CategoriesAdmin] Error checking existing section:`, fetchError);
        throw fetchError;
      }

      let result;
      if (existingSection) {
        // Update existing section
        result = await supabase
          .from('content_sections')
          .update({
            content_value: value,
            updated_at: new Date().toISOString()
          })
          .eq('section_key', sectionKey);
      } else {
        // Insert new section
        result = await supabase
          .from('content_sections')
          .insert({
            section_key: sectionKey,
            section_name: sectionName,
            content_type: field === 'explanation' ? 'textarea' : 'json',
            content_value: value,
            metadata: { section: 'categories' },
            is_active: true
          });
      }

      if (result.error) {
        console.error(`[CategoriesAdmin] Database error:`, result.error);
        throw result.error;
      }

      console.log(`[CategoriesAdmin] ${field} saved successfully for ${categoryKey}`);
      toast({
        title: 'Success',
        description: `${field} saved successfully`
      });
    } catch (error) {
      console.error(`[CategoriesAdmin] Error saving ${field}:`, error);
      toast({
        title: 'Error',
        description: `Failed to save ${field}: ${error.message || error}`,
        variant: 'destructive'
      });
    } finally {
      setSaving(null);
    }
  };

  const updateCategoryContent = (categoryKey: string, field: 'explanation' | 'features', value: any) => {
    setCategoryContent(prev => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        [field]: value
      }
    }));
  };

  const addFeature = (categoryKey: string) => {
    const newFeatures = [...categoryContent[categoryKey].features, ''];
    updateCategoryContent(categoryKey, 'features', newFeatures);
  };

  const updateFeature = (categoryKey: string, index: number, value: string) => {
    const newFeatures = [...categoryContent[categoryKey].features];
    newFeatures[index] = value;
    updateCategoryContent(categoryKey, 'features', newFeatures);
  };

  const removeFeature = (categoryKey: string, index: number) => {
    try {
      console.log(`[CategoriesAdmin] Removing feature at index ${index} for ${categoryKey}`);
      const currentFeatures = categoryContent[categoryKey].features;
      const newFeatures = currentFeatures.filter((_, i) => i !== index);
      console.log(`[CategoriesAdmin] Features after removal:`, newFeatures);
      updateCategoryContent(categoryKey, 'features', newFeatures);
    } catch (error) {
      console.error(`[CategoriesAdmin] Error removing feature:`, error);
      toast({
        title: 'Error',
        description: 'Failed to remove feature',
        variant: 'destructive'
      });
    }
  };

  // Removed handleInitializeDatabase function to prevent accidental recreation of default content

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento gestione galleria...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-emerald-800">🖼️ Gestione Galleria Categorie</h2>
            <p className="text-gray-600">Gestisci immagini della galleria, descrizioni e caratteristiche per ogni categoria</p>
          </div>
          <div className="text-sm text-gray-500">
            <p>Categorie caricate: {Object.keys(categoryContent).length}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="matrimoni" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          {categories.map(category => (
            <TabsTrigger key={category.key} value={category.key}>
              {category.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.key} value={category.key} className="space-y-6">
            {/* Gallery Management */}
            <CategoryGalleryManager
              categoryKey={category.key}
              categoryName={category.name}
            />

            {/* Labels Management */}
            <CategoryLabelsManager
              categoryKey={category.key}
              categoryName={category.name}
            />

            {/* Content Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Explanation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📝 Descrizione Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={categoryContent[category.key]?.explanation || ''}
                    onChange={(e) => updateCategoryContent(category.key, 'explanation', e.target.value)}
                    rows={6}
                    placeholder="Inserisci la descrizione della categoria..."
                    className="min-h-[150px]"
                  />
                  <Button 
                    onClick={() => saveCategoryContent(category.key, 'explanation')}
                    disabled={isSaving === `${category.key}_explanation`}
                    className="w-full"
                  >
                    {isSaving === `${category.key}_explanation` ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Description
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    ⭐ Caratteristiche
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {categoryContent[category.key]?.features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeature(category.key, index, e.target.value)}
                          placeholder="Enter feature..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeFeature(category.key, index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => addFeature(category.key)}
                      className="flex-1"
                    >
                      Add Feature
                    </Button>
                    <Button 
                      onClick={() => saveCategoryContent(category.key, 'features')}
                      disabled={isSaving === `${category.key}_features`}
                    >
                      {isSaving === `${category.key}_features` ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Features
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default CategoriesGalleryAdmin;
