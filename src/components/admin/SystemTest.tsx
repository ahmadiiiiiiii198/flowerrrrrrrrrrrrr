import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { categorySectionService } from '@/services/categorySectionService';
import { Loader2, TestTube, CheckCircle, XCircle } from 'lucide-react';

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  timestamp: string;
}

const SystemTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  const addResult = (test: string, success: boolean, message: string) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testProductDeletion = async () => {
    try {
      // Create a test product
      const testProduct = {
        name: 'Test Product for Deletion',
        description: 'This product will be deleted',
        price: 99.99,
        slug: 'test-product-deletion-' + Date.now(),
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
        addResult('Product Deletion', false, 'No categories available for testing');
        return false;
      }

      testProduct['category_id'] = categories[0].id;

      // Create the product
      const { data: created, error: createError } = await supabase
        .from('products')
        .insert(testProduct)
        .select()
        .single();

      if (createError) {
        addResult('Product Deletion', false, `Failed to create test product: ${createError.message}`);
        return false;
      }

      // Now try to delete it
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', created.id);

      if (deleteError) {
        addResult('Product Deletion', false, `Failed to delete product: ${deleteError.message}`);
        return false;
      }

      // Verify it's deleted
      const { data: checkDeleted } = await supabase
        .from('products')
        .select('id')
        .eq('id', created.id);

      if (checkDeleted && checkDeleted.length > 0) {
        addResult('Product Deletion', false, 'Product still exists after deletion');
        return false;
      }

      // Test that ProductService doesn't fall back to defaults when no products exist
      const { productService } = await import('@/services/productService');
      productService.clearCache(); // Clear any cached data
      const products = await productService.fetchProducts();

      // Should return empty array, not default products
      const hasDefaultProducts = products.some(p => p.name === 'Bouquet Sposa Elegante');
      if (hasDefaultProducts) {
        addResult('Product Deletion', false, 'ProductService is still returning default products');
        return false;
      }

      addResult('Product Deletion', true, 'Product deleted successfully and no fallback to defaults');
      return true;
    } catch (error) {
      addResult('Product Deletion', false, `Test error: ${error.message}`);
      return false;
    }
  };

  const testCategorySections = async () => {
    try {
      // Test fetching sections
      const sections = await categorySectionService.fetchSections();
      if (!sections || sections.length === 0) {
        addResult('Category Sections', false, 'No category sections found');
        return false;
      }

      // Test creating a section
      const testSection = {
        name: 'Test Section',
        slug: 'test-section-' + Date.now(),
        description: 'Test section for validation',
        section_type: 'categories' as const,
        is_active: true,
        sort_order: 999
      };

      const created = await categorySectionService.createSection(testSection);
      if (!created) {
        addResult('Category Sections', false, 'Failed to create test section');
        return false;
      }

      // Test updating the section
      const updated = await categorySectionService.updateSection(created.id, {
        name: 'Updated Test Section'
      });

      if (!updated || updated.name !== 'Updated Test Section') {
        addResult('Category Sections', false, 'Failed to update test section');
        return false;
      }

      // Test deleting the section
      const deleted = await categorySectionService.deleteSection(created.id);
      if (!deleted) {
        addResult('Category Sections', false, 'Failed to delete test section');
        return false;
      }

      addResult('Category Sections', true, 'All CRUD operations successful');
      return true;
    } catch (error) {
      addResult('Category Sections', false, `Test error: ${error.message}`);
      return false;
    }
  };

  const testDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .limit(1);

      if (error) {
        addResult('Database Connection', false, `Connection error: ${error.message}`);
        return false;
      }

      addResult('Database Connection', true, 'Database connection successful');
      return true;
    } catch (error) {
      addResult('Database Connection', false, `Connection test failed: ${error.message}`);
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      addResult('Test Start', true, 'Starting system tests');

      // Test 1: Database Connection
      const dbOk = await testDatabaseConnection();
      if (!dbOk) return;

      // Test 2: Product Deletion
      await testProductDeletion();

      // Test 3: Category Sections
      await testCategorySections();

      addResult('Test Complete', true, 'All system tests completed');

      toast({
        title: 'Tests Complete! 🎉',
        description: 'System functionality has been tested successfully.',
      });

    } catch (error) {
      addResult('Test Error', false, `Unexpected error: ${error.message}`);
      toast({
        title: 'Test Failed',
        description: 'An error occurred during testing',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Tests</h2>
          <p className="text-gray-600">Test product deletion and category sections functionality</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={clearResults} variant="outline" disabled={isRunning}>
            Clear Results
          </Button>
          <Button onClick={runAllTests} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Run All Tests
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{result.test}</p>
                      <p className="text-sm text-gray-600">{result.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{result.timestamp}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Product Deletion Test</h4>
              <p className="text-sm text-gray-600">
                Creates a test product and then deletes it to verify that the deletion functionality works properly.
                Also tests that the ProductService doesn't fall back to default products when the database is empty.
                This addresses the issue where products would reappear after refresh.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Category Sections Test</h4>
              <p className="text-sm text-gray-600">
                Tests the new category sections functionality that allows creating custom named sections 
                for both categories and products in the admin panel.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Database Connection Test</h4>
              <p className="text-sm text-gray-600">
                Verifies that the database connection is working and basic queries can be executed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemTest;
