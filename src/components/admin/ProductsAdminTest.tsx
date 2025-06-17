import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { initializeProducts } from '@/utils/initializeProducts';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Database, 
  Package, 
  Settings,
  Play,
  RotateCcw
} from 'lucide-react';

const ProductsAdminTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const { toast } = useToast();

  const addResult = (test: string, success: boolean, message: string) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testDatabaseSchema = async () => {
    try {
      // Test products table structure
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1);

      if (error) throw error;
      addResult('Database Schema', true, 'Products table accessible');
      return true;
    } catch (error) {
      addResult('Database Schema', false, `Schema error: ${error.message}`);
      return false;
    }
  };

  const testCategoriesExist = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        addResult('Categories Check', false, 'No active categories found');
        return false;
      }

      const expectedSlugs = ['fiori-piante', 'fiori-finti', 'matrimoni', 'funerali'];
      const existingSlugs = data.map(cat => cat.slug);
      const missingCategories = expectedSlugs.filter(slug => !existingSlugs.includes(slug));

      if (missingCategories.length > 0) {
        addResult('Categories Check', false, `Missing categories: ${missingCategories.join(', ')}`);
        return false;
      }

      addResult('Categories Check', true, `Found all ${data.length} required categories`);
      return true;
    } catch (error) {
      addResult('Categories Check', false, `Categories error: ${error.message}`);
      return false;
    }
  };

  const testProductInitialization = async () => {
    try {
      const success = await initializeProducts();
      if (success) {
        addResult('Product Initialization', true, 'Default products initialized successfully');
        return true;
      } else {
        addResult('Product Initialization', false, 'Failed to initialize products');
        return false;
      }
    } catch (error) {
      addResult('Product Initialization', false, `Initialization error: ${error.message}`);
      return false;
    }
  };

  const testProductsQuery = async () => {
    try {
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
        .eq('is_active', true);

      if (error) throw error;

      if (!data || data.length === 0) {
        addResult('Products Query', false, 'No products found in database');
        return false;
      }

      addResult('Products Query', true, `Found ${data.length} active products`);
      return true;
    } catch (error) {
      addResult('Products Query', false, `Query error: ${error.message}`);
      return false;
    }
  };

  const testProductCRUD = async () => {
    try {
      // Test creating a product
      const testProduct = {
        name: 'Test Product Admin',
        description: 'Test product for admin functionality',
        price: 99.99,
        slug: 'test-product-admin',
        is_active: true,
        is_featured: false,
        stock_quantity: 1,
        sort_order: 999
      };

      // Get first category for testing
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .limit(1);

      if (!categories || categories.length === 0) {
        addResult('Product CRUD', false, 'No categories available for testing');
        return false;
      }

      testProduct['category_id'] = categories[0].id;

      // Create
      const { data: created, error: createError } = await supabase
        .from('products')
        .insert(testProduct)
        .select()
        .single();

      if (createError) throw createError;

      // Update
      const { error: updateError } = await supabase
        .from('products')
        .update({ name: 'Test Product Admin Updated' })
        .eq('id', created.id);

      if (updateError) throw updateError;

      // Delete
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', created.id);

      if (deleteError) throw deleteError;

      addResult('Product CRUD', true, 'Create, Update, Delete operations successful');
      return true;
    } catch (error) {
      addResult('Product CRUD', false, `CRUD error: ${error.message}`);
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      addResult('Test Start', true, 'Starting Products Admin tests');

      // Test 1: Database Schema
      const schemaOk = await testDatabaseSchema();
      if (!schemaOk) return;

      // Test 2: Categories
      const categoriesOk = await testCategoriesExist();
      if (!categoriesOk) return;

      // Test 3: Product Initialization
      await testProductInitialization();

      // Test 4: Products Query
      await testProductsQuery();

      // Test 5: CRUD Operations
      await testProductCRUD();

      addResult('Test Complete', true, 'All Products Admin tests completed');

      toast({
        title: 'Tests Complete! 🎉',
        description: 'Products Admin functionality has been tested successfully.',
      });

    } catch (error) {
      addResult('Test Error', false, `Unexpected error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <Card className="bg-white shadow-lg border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TestTube className="h-4 w-4" />
            Products Admin Test
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              size="sm"
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-3 w-3" />
                  Run Tests
                </>
              )}
            </Button>
            <Button
              onClick={clearResults}
              size="sm"
              variant="outline"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Test Results */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start gap-2 text-xs">
                {result.success ? (
                  <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{result.test}</div>
                  <div className="text-gray-600">{result.message}</div>
                  <div className="text-gray-400">{result.timestamp}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Test Categories */}
          <div className="border-t pt-3 text-xs">
            <div className="font-medium mb-2">Test Categories:</div>
            <div className="grid grid-cols-2 gap-1">
              <div className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                <span>Database</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>Products</span>
              </div>
              <div className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                <span>CRUD</span>
              </div>
              <div className="flex items-center gap-1">
                <TestTube className="h-3 w-3" />
                <span>Integration</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="border-t pt-3 text-xs text-gray-600">
            <div className="font-medium mb-1">Admin Features:</div>
            <ul className="space-y-1">
              <li>• Initialize default products</li>
              <li>• Create/edit/delete products</li>
              <li>• Manage categories and pricing</li>
              <li>• Toggle active/featured status</li>
              <li>• SEO and inventory management</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductsAdminTest;
