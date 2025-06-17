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
  Package,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Upload,
  Image as ImageIcon,
  XCircle,
  Tag
} from 'lucide-react';
import { Product } from '@/types/category';
import { Tables } from '@/integrations/supabase/types';
import { initializeProducts } from '@/utils/initializeProducts';
import { initializeCategories } from '@/utils/initializeCategories';
import ImageUpload from '@/components/ImageUpload';
import LabelsManager from './LabelsManager';

type DatabaseProduct = Tables<'products'>;
type DatabaseCategory = Tables<'categories'>;

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  slug: string;
  category_id: string;
  image_url: string;
  is_active: boolean;
  is_featured: boolean;
  stock_quantity: number;
  compare_price: number;
  sort_order: number;
  meta_title: string;
  meta_description: string;
  labels: string[];
}

const ProductsAdmin = () => {
  const [editingProduct, setEditingProduct] = useState<DatabaseProduct | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    slug: '',
    category_id: '',
    image_url: '',
    is_active: true,
    is_featured: false,
    stock_quantity: 0,
    compare_price: 0,
    sort_order: 0,
    meta_title: '',
    meta_description: '',
    labels: []
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug
          )
        `)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as (DatabaseProduct & { categories: DatabaseCategory | null })[];
    }
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      console.log('[ProductsAdmin] Fetching categories...');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[ProductsAdmin] Categories fetch error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('[ProductsAdmin] No categories found, attempting to initialize...');
        const initSuccess = await initializeCategories();
        if (initSuccess) {
          // Retry fetching after initialization
          const { data: retryData, error: retryError } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

          if (retryError) throw retryError;
          return retryData as DatabaseCategory[];
        } else {
          throw new Error('Failed to initialize categories');
        }
      }

      console.log('[ProductsAdmin] Categories loaded:', data);
      return data as DatabaseCategory[];
    }
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: Omit<DatabaseProduct, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({
        title: 'Success',
        description: 'Product created successfully',
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create product: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...productData }: Partial<DatabaseProduct> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update product: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('[ProductsAdmin] Attempting to delete product with ID:', id);

      // First try to delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[ProductsAdmin] Delete error:', error);
        throw error;
      }

      console.log('[ProductsAdmin] Product deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      // Also invalidate the products service cache
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
    },
    onError: (error) => {
      console.error('[ProductsAdmin] Delete mutation error:', error);
      toast({
        title: 'Error',
        description: `Failed to delete product: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      slug: '',
      category_id: '',
      image_url: '',
      is_active: true,
      is_featured: false,
      stock_quantity: 0,
      compare_price: 0,
      sort_order: 0,
      meta_title: '',
      meta_description: '',
      labels: []
    });
    setEditingProduct(null);
    setIsCreating(false);
  };

  const startEdit = (product: DatabaseProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      slug: product.slug,
      category_id: product.category_id || '',
      image_url: product.image_url || '',
      is_active: product.is_active ?? true,
      is_featured: product.is_featured ?? false,
      stock_quantity: product.stock_quantity || 0,
      compare_price: product.compare_price || 0,
      sort_order: product.sort_order || 0,
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
      labels: (product as any).labels || []
    });
    setIsCreating(false);
  };

  const startCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
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
    
    if (!formData.name || !formData.price || !formData.category_id) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const productData = {
      ...formData,
      price: Number(formData.price),
      stock_quantity: Number(formData.stock_quantity),
      compare_price: Number(formData.compare_price),
      sort_order: Number(formData.sort_order),
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, ...productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(id);
    }
  };

  const toggleActive = (product: DatabaseProduct) => {
    updateProductMutation.mutate({
      id: product.id,
      is_active: !product.is_active
    });
  };

  const toggleFeatured = (product: DatabaseProduct) => {
    updateProductMutation.mutate({
      id: product.id,
      is_featured: !product.is_featured
    });
  };

  const handleInitializeDatabase = async () => {
    // This function is only used when no categories exist at all
    // It initializes both categories and products for first-time setup
    const confirmed = window.confirm(
      '⚠️ WARNING: This will initialize the database with default categories and products.\n\n' +
      'This action will:\n' +
      '• Add default categories if none exist\n' +
      '• Add default products if none exist\n' +
      '• Only run during initial setup\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    setIsInitializing(true);
    try {
      // First ensure categories exist
      console.log('[ProductsAdmin] Initializing categories...');
      const categoriesSuccess = await initializeCategories();
      if (!categoriesSuccess) {
        throw new Error('Failed to initialize categories');
      }

      // Then initialize products (only if none exist)
      const productsSuccess = await initializeProducts(false);
      if (productsSuccess) {
        // Invalidate both queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
        toast({
          title: 'Success! 🎉',
          description: 'Database initialized with default categories and products',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to initialize products. Check console for details.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[ProductsAdmin] Initialization error:', error);
      toast({
        title: 'Error',
        description: `Failed to initialize: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  if (productsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {categoriesLoading ? 'Loading categories...' : 'Loading products...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state if categories failed to load
  if (categoriesError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Failed to load categories</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-categories'] })}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile-optimized header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-center md:text-left">
          <h2 className="text-lg md:text-2xl font-bold tracking-tight">Products Management</h2>
          <p className="text-sm md:text-base text-gray-600">Manage your product catalog</p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          {(!categories || categories.length === 0) && (
            <Button
              onClick={handleInitializeDatabase}
              disabled={isInitializing}
              variant="outline"
              className="w-full md:w-auto text-xs md:text-sm"
              size="sm"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                  <span className="hidden sm:inline">Initializing...</span>
                  <span className="sm:hidden">Init...</span>
                </>
              ) : (
                <>
                  <Package className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Add Default Categories & Products</span>
                  <span className="sm:hidden">Add Defaults</span>
                </>
              )}
            </Button>
          )}
          <Button
            onClick={startCreate}
            disabled={isCreating || editingProduct || !categories || categories.length === 0}
            className="w-full md:w-auto text-xs md:text-sm"
            size="sm"
          >
            <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Mobile-optimized Product Form */}
      {(isCreating || editingProduct) && (
        <Card className="mx-1 md:mx-0">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center justify-between text-base md:text-lg">
              <span>{editingProduct ? 'Edit Product' : 'Create New Product'}</span>
              <Button variant="ghost" size="sm" onClick={resetForm} className="h-8 w-8 md:h-9 md:w-9">
                <X className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6">
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter product name"
                    required
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="slug" className="text-sm font-medium">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="product-slug"
                    className="text-sm md:text-base"
                  />
                </div>
              </div>

              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description"
                  rows={3}
                  className="text-sm md:text-base resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium">Price (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    required
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="compare_price" className="text-sm font-medium">Compare Price (€)</Label>
                  <Input
                    id="compare_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.compare_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, compare_price: parseFloat(e.target.value) || 0 }))}
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="stock_quantity" className="text-sm font-medium">Stock Quantity</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                    className="text-sm md:text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="category_id" className="text-sm font-medium">Category *</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger className="text-sm md:text-base">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories && categories.length > 0 ? (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id} className="text-sm md:text-base">
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled className="text-sm md:text-base">
                          No categories available - Initialize first
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="sort_order" className="text-sm font-medium">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    className="text-sm md:text-base"
                  />
                </div>
              </div>

              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="image_url" className="text-sm font-medium">Product Image</Label>
                <ImageUpload
                  currentValue={formData.image_url}
                  onUpload={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="meta_title" className="text-sm font-medium">Meta Title (SEO)</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="SEO title"
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="meta_description" className="text-sm font-medium">Meta Description (SEO)</Label>
                  <Input
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="SEO description"
                    className="text-sm md:text-base"
                  />
                </div>
              </div>

              {/* Labels Management */}
              <LabelsManager
                labels={formData.labels}
                onChange={(labels) => setFormData(prev => ({ ...prev, labels }))}
                placeholder="Add a label (e.g., lauree, matrimoni, compleanno)"
              />

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:space-x-6 md:gap-0">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active" className="text-sm font-medium">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                  />
                  <Label htmlFor="is_featured" className="text-sm font-medium">Featured</Label>
                </div>
              </div>

              <div className="flex flex-col gap-2 md:flex-row">
                <Button
                  type="submit"
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  className="w-full md:w-auto text-sm"
                  size="sm"
                >
                  {(createProductMutation.isPending || updateProductMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                      {editingProduct ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="w-full md:w-auto text-sm"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Mobile-optimized Products List */}
      <Card className="mx-1 md:mx-0">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Package className="h-4 w-4 md:h-5 md:w-5" />
            Products ({products?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          {products && products.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 border rounded-lg hover:bg-gray-50 space-y-3 md:space-y-0"
                >
                  <div className="flex items-start space-x-3 md:space-x-4">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="h-4 w-4 md:h-6 md:w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base truncate">{product.name}</h3>
                      <p className="text-xs md:text-sm text-gray-600 truncate">
                        {(product as any).categories?.name || 'No category'}
                      </p>
                      <p className="text-base md:text-lg font-bold text-emerald-600">€{product.price.toFixed(2)}</p>
                      <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                        {product.is_featured && (
                          <Badge variant="secondary" className="text-xs">
                            Featured
                          </Badge>
                        )}
                        {product.is_active ? (
                          <Badge variant="outline" className="text-xs text-green-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-red-600">
                            Inactive
                          </Badge>
                        )}
                        {product.stock_quantity !== null && (
                          <Badge variant="outline" className="text-xs">
                            Stock: {product.stock_quantity}
                          </Badge>
                        )}
                      </div>
                      {/* Display labels */}
                      {(product as any).labels && (product as any).labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(product as any).labels.map((label: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              <Tag className="w-3 h-3 mr-1" />
                              {label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-1 md:space-x-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(product)}
                      title={product.is_active ? 'Deactivate' : 'Activate'}
                      className="h-8 w-8 md:h-9 md:w-9"
                    >
                      {product.is_active ? (
                        <Eye className="h-3 w-3 md:h-4 md:w-4" />
                      ) : (
                        <EyeOff className="h-3 w-3 md:h-4 md:w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFeatured(product)}
                      title={product.is_featured ? 'Remove from featured' : 'Add to featured'}
                      className="h-8 w-8 md:h-9 md:w-9"
                    >
                      {product.is_featured ? (
                        <Star className="h-3 w-3 md:h-4 md:w-4 fill-current text-yellow-500" />
                      ) : (
                        <StarOff className="h-3 w-3 md:h-4 md:w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(product)}
                      className="h-8 w-8 md:h-9 md:w-9"
                    >
                      <Edit className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      disabled={deleteProductMutation.isPending}
                      className="h-8 w-8 md:h-9 md:w-9"
                    >
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 md:py-8">
              <Package className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-3 md:mb-4" />
              <p className="text-sm md:text-base text-gray-600">No products found. Create your first product!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductsAdmin;
