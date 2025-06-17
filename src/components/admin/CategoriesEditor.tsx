import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Plus, Trash, Edit, GripVertical } from 'lucide-react';
import { categoryService } from '@/services/categoryService';
import { Category, CategoryContent } from '@/types/category';
import ImageUploader from './ImageUploader';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const CategoriesEditor = () => {
  const [content, setContent] = useState<CategoryContent>({
    categories: [],
    heading: '',
    subheading: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const { toast } = useToast();

  // Load content on mount
  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      const data = await categoryService.fetchContent();
      setContent(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateHeading = (heading: string) => {
    setContent({ ...content, heading });
    setHasChanges(true);
  };

  const updateSubheading = (subheading: string) => {
    setContent({ ...content, subheading });
    setHasChanges(true);
  };

  const addCategory = () => {
    const newCategory: Category = {
      id: 'new-' + Date.now(),
      name: '',
      slug: '',
      description: '',
      image_url: '',
      is_active: true,
      sort_order: content.categories.length
    };

    setContent({
      ...content,
      categories: [...content.categories, newCategory]
    });
    setEditingCategory(newCategory.id);
    setHasChanges(true);
  };

  const updateCategory = (id: string, field: keyof Category, value: any) => {
    const updatedCategories = content.categories.map(cat =>
      cat.id === id ? { ...cat, [field]: value } : cat
    );
    setContent({ ...content, categories: updatedCategories });
    setHasChanges(true);
  };

  const deleteCategory = async (id: string) => {
    if (id.startsWith('new-')) {
      // Remove from local state if it's a new category
      const updatedCategories = content.categories.filter(cat => cat.id !== id);
      setContent({ ...content, categories: updatedCategories });
      setHasChanges(true);
    } else {
      // Delete from database
      const success = await categoryService.deleteCategory(id);
      if (success) {
        const updatedCategories = content.categories.filter(cat => cat.id !== id);
        setContent({ ...content, categories: updatedCategories });
        setHasChanges(true);
        toast({
          title: 'Success',
          description: 'Category deleted successfully'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete category',
          variant: 'destructive'
        });
      }
    }
  };

  const handleImageUpload = (categoryId: string, imageUrl: string) => {
    updateCategory(categoryId, 'image_url', imageUrl);
    toast({
      title: 'Image updated',
      description: 'Category image has been updated successfully'
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(content.categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort_order for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      sort_order: index
    }));

    setContent({ ...content, categories: updatedItems });
    setHasChanges(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const saveChanges = async () => {
    try {
      setIsSaving(true);

      // Save content settings
      await categoryService.saveContentSettings(content.heading, content.subheading);

      // Save each category
      for (const category of content.categories) {
        if (category.name.trim()) {
          await categoryService.saveCategory({
            ...category,
            slug: category.slug || generateSlug(category.name)
          });
        }
      }

      setHasChanges(false);
      setEditingCategory(null);
      
      toast({
        title: 'Success',
        description: 'Categories saved successfully'
      });

      // Reload content to get fresh data with proper IDs
      await loadContent();
    } catch (error) {
      console.error('Error saving categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to save categories',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
        <Button 
          onClick={saveChanges} 
          disabled={!hasChanges || isSaving} 
          className="flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />} 
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Content Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Section Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="heading" className="text-sm font-medium">
              Heading
            </label>
            <Input
              type="text"
              id="heading"
              value={content.heading}
              onChange={(e) => updateHeading(e.target.value)}
              placeholder="Section heading"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="subheading" className="text-sm font-medium">
              Subheading
            </label>
            <Textarea
              id="subheading"
              value={content.subheading}
              onChange={(e) => updateSubheading(e.target.value)}
              placeholder="Section subheading"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {content.categories.map((category, index) => (
                    <Draggable key={category.id} draggableId={category.id} index={index}>
                      {(provided) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="border rounded-lg p-4 bg-white shadow-sm"
                        >
                          <div className="flex items-start gap-4">
                            <div {...provided.dragHandleProps} className="mt-2">
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>
                            
                            <div className="flex-1 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Name</label>
                                  <Input
                                    value={category.name}
                                    onChange={(e) => {
                                      updateCategory(category.id, 'name', e.target.value);
                                      if (!category.slug) {
                                        updateCategory(category.id, 'slug', generateSlug(e.target.value));
                                      }
                                    }}
                                    placeholder="Category name"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Slug</label>
                                  <Input
                                    value={category.slug}
                                    onChange={(e) => updateCategory(category.id, 'slug', e.target.value)}
                                    placeholder="category-slug"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                  value={category.description || ''}
                                  onChange={(e) => updateCategory(category.id, 'description', e.target.value)}
                                  placeholder="Category description"
                                  rows={2}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium">Category Image</label>
                                {category.image_url ? (
                                  <div className="relative mt-2">
                                    <img 
                                      src={category.image_url} 
                                      alt={category.name}
                                      className="max-h-32 rounded-md object-cover"
                                    />
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="absolute top-2 right-2"
                                      onClick={() => updateCategory(category.id, 'image_url', '')}
                                    >
                                      <Trash size={14} />
                                    </Button>
                                  </div>
                                ) : (
                                  <ImageUploader
                                    onImageSelected={(imageUrl) => handleImageUpload(category.id, imageUrl)}
                                    buttonLabel="Upload Image"
                                    className="w-full mt-2"
                                    bucketName="categories"
                                    folderPath={`category-${category.slug || category.id}`}
                                  />
                                )}
                              </div>
                            </div>

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteCategory(category.id)}
                            >
                              <Trash size={16} />
                            </Button>
                          </div>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>

          <Button onClick={addCategory} variant="outline" className="w-full mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoriesEditor;
