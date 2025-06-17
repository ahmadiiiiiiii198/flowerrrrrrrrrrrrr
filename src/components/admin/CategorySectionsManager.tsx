import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Grid3X3,
  Package,
  Eye,
  EyeOff
} from 'lucide-react';

interface CategorySection {
  id: string;
  name: string;
  slug: string;
  description: string;
  section_type: 'categories' | 'products';
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface CategorySectionFormData {
  name: string;
  slug: string;
  description: string;
  section_type: 'categories' | 'products';
  is_active: boolean;
  sort_order: number;
}

const CategorySectionsManager: React.FC = () => {
  const [editingSection, setEditingSection] = useState<CategorySection | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CategorySectionFormData>({
    name: '',
    slug: '',
    description: '',
    section_type: 'categories',
    is_active: true,
    sort_order: 0
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch category sections
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['category-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_sections')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as CategorySection[];
    }
  });

  // Create section mutation
  const createSectionMutation = useMutation({
    mutationFn: async (sectionData: Omit<CategorySection, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('category_sections')
        .insert(sectionData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-sections'] });
      toast({
        title: 'Success',
        description: 'Category section created successfully',
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create section: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Update section mutation
  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, ...sectionData }: Partial<CategorySection> & { id: string }) => {
      const { data, error } = await supabase
        .from('category_sections')
        .update(sectionData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-sections'] });
      toast({
        title: 'Success',
        description: 'Category section updated successfully',
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update section: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Delete section mutation
  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('category_sections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-sections'] });
      toast({
        title: 'Success',
        description: 'Category section deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete section: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      section_type: 'categories',
      is_active: true,
      sort_order: 0
    });
    setEditingSection(null);
    setIsCreating(false);
  };

  const startCreate = () => {
    resetForm();
    setIsCreating(true);
    setFormData(prev => ({
      ...prev,
      sort_order: sections ? sections.length : 0
    }));
  };

  const startEdit = (section: CategorySection) => {
    setFormData({
      name: section.name,
      slug: section.slug,
      description: section.description || '',
      section_type: section.section_type,
      is_active: section.is_active,
      sort_order: section.sort_order
    });
    setEditingSection(section);
    setIsCreating(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const sectionData = {
      ...formData,
      sort_order: Number(formData.sort_order),
    };

    if (editingSection) {
      updateSectionMutation.mutate({ id: editingSection.id, ...sectionData });
    } else {
      createSectionMutation.mutate(sectionData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this category section?')) {
      deleteSectionMutation.mutate(id);
    }
  };

  const toggleActive = (section: CategorySection) => {
    updateSectionMutation.mutate({
      id: section.id,
      is_active: !section.is_active
    });
  };

  if (sectionsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Category Sections Manager</h2>
          <p className="text-gray-600">Create and manage custom category sections for both categories and products</p>
        </div>
        <Button onClick={startCreate} disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSection ? 'Edit Category Section' : 'Create New Category Section'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Section Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Wedding Flowers, Corporate Events"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g., wedding-flowers"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this section"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="section_type">Section Type *</Label>
                  <Select
                    value={formData.section_type}
                    onValueChange={(value: 'categories' | 'products') => 
                      setFormData(prev => ({ ...prev, section_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="categories">Categories Section</SelectItem>
                      <SelectItem value="products">Products Section</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  type="submit"
                  disabled={createSectionMutation.isPending || updateSectionMutation.isPending}
                >
                  {(createSectionMutation.isPending || updateSectionMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  <Save className="h-4 w-4 mr-2" />
                  {editingSection ? 'Update Section' : 'Create Section'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sections List */}
      <Card>
        <CardHeader>
          <CardTitle>Category Sections</CardTitle>
        </CardHeader>
        <CardContent>
          {sections && sections.length > 0 ? (
            <div className="space-y-4">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-white"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {section.section_type === 'categories' ? (
                          <Grid3X3 className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Package className="h-5 w-5 text-green-500" />
                        )}
                        <h3 className="font-semibold">{section.name}</h3>
                      </div>
                      <Badge variant={section.is_active ? 'default' : 'secondary'}>
                        {section.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">
                        {section.section_type === 'categories' ? 'Categories' : 'Products'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Slug: /{section.slug} | Order: {section.sort_order}
                    </p>
                    {section.description && (
                      <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(section)}
                      title={section.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {section.is_active ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(section)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(section.id)}
                      disabled={deleteSectionMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Grid3X3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No category sections found. Create your first section!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CategorySectionsManager;
