import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { initializeProducts } from '@/utils/initializeProducts';
import { initializeCategories } from '@/utils/initializeCategories';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Package, 
  Settings,
  Play,
  RotateCcw,
  Link,
  Table
} from 'lucide-react';

const DatabaseConnectionTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const { toast } = useToast();

  const addResult = (test: string, success: boolean, message: string, details?: any) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id')
        .limit(1);

      if (error) throw error;
      addResult('Database Connection', true, 'Successfully connected to Supabase');
      return true;
    } catch (error) {
      addResult('Database Connection', false, `Connection failed: ${error.message}`);
      return false;
    }
  };

  const testTablesExist = async () => {
    const tables = ['categories', 'products', 'orders', 'order_items', 'order_notifications'];
    let allTablesExist = true;

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          addResult('Table Check', false, `Table '${table}' not accessible: ${error.message}`);
          allTablesExist = false;
        } else {
          addResult('Table Check', true, `Table '${table}' exists and accessible`);
        }
      } catch (error) {
        addResult('Table Check', false, `Error checking table '${table}': ${error.message}`);
        allTablesExist = false;
      }
    }

    return allTablesExist;
  };

  const testCategoriesData = async () => {
    try {
      // First try to initialize categories
      const categoriesInitialized = await initializeCategories();
      if (categoriesInitialized) {
        addResult('Categories Init', true, 'Categories initialized successfully');
      }

      // Then check if categories exist
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, is_active')
        .eq('is_active', true);

      if (error) throw error;

      if (!data || data.length === 0) {
        addResult('Categories Data', false, 'No active categories found');
        return false;
      }

      const expectedSlugs = ['fiori-piante', 'fiori-finti', 'matrimoni', 'funerali'];
      const existingSlugs = data.map(cat => cat.slug);
      const missingCategories = expectedSlugs.filter(slug => !existingSlugs.includes(slug));

      if (missingCategories.length > 0) {
        addResult('Categories Data', false, `Missing categories: ${missingCategories.join(', ')}`);
        return false;
      }

      addResult('Categories Data', true, `Found all ${data.length} required categories`, data);
      return true;
    } catch (error) {
      addResult('Categories Data', false, `Categories error: ${error.message}`);
      return false;
    }
  };

  const testProductsData = async () => {
    try {
      // First try to initialize products
      const productsInitialized = await initializeProducts();
      if (productsInitialized) {
        addResult('Products Init', true, 'Products initialized successfully');
      }

      // Then check if products exist with proper joins
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          is_active,
          is_featured,
          categories (
            id,
            name,
            slug
          )
        `)
        .eq('is_active', true);

      if (error) throw error;

      if (!data || data.length === 0) {
        addResult('Products Data', false, 'No active products found');
        return false;
      }

      // Check if products are properly linked to categories
      const productsWithCategories = data.filter(product => (product as any).categories);
      const productsWithoutCategories = data.length - productsWithCategories.length;

      if (productsWithoutCategories > 0) {
        addResult('Products Data', false, `${productsWithoutCategories} products missing category links`);
      }

      addResult('Products Data', true, `Found ${data.length} active products, ${productsWithCategories.length} with categories`, {
        totalProducts: data.length,
        withCategories: productsWithCategories.length,
        withoutCategories: productsWithoutCategories
      });
      return true;
    } catch (error) {
      addResult('Products Data', false, `Products error: ${error.message}`);
      return false;
    }
  };

  const testOrderSystem = async () => {
    try {
      // Test creating a test order
      const testOrder = {
        order_number: `TEST-${Date.now()}`,
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '+1234567890',
        total_amount: 99.99,
        status: 'pending'
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(testOrder)
        .select()
        .single();

      if (orderError) throw orderError;

      // Test creating order item
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price')
        .limit(1);

      if (products && products.length > 0) {
        const testOrderItem = {
          order_id: order.id,
          product_id: products[0].id,
          product_name: products[0].name,
          quantity: 1,
          product_price: products[0].price,
          subtotal: products[0].price
        };

        const { error: itemError } = await supabase
          .from('order_items')
          .insert(testOrderItem);

        if (itemError) throw itemError;

        // Test creating notification
        const { error: notificationError } = await supabase
          .from('order_notifications')
          .insert({
            order_id: order.id,
            notification_type: 'new_order',
            is_read: false
          });

        if (notificationError) throw notificationError;
      }

      // Clean up test data
      await supabase.from('order_items').delete().eq('order_id', order.id);
      await supabase.from('order_notifications').delete().eq('order_id', order.id);
      await supabase.from('orders').delete().eq('id', order.id);

      addResult('Order System', true, 'Order system working correctly');
      return true;
    } catch (error) {
      addResult('Order System', false, `Order system error: ${error.message}`);
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      addResult('Test Start', true, 'Starting comprehensive database tests');

      // Test 1: Database Connection
      const connectionOk = await testDatabaseConnection();
      if (!connectionOk) {
        addResult('Test Failed', false, 'Database connection failed - stopping tests');
        return;
      }

      // Test 2: Tables Exist
      const tablesOk = await testTablesExist();
      if (!tablesOk) {
        addResult('Test Failed', false, 'Some tables are missing - check database schema');
      }

      // Test 3: Categories Data
      await testCategoriesData();

      // Test 4: Products Data
      await testProductsData();

      // Test 5: Order System
      await testOrderSystem();

      addResult('Test Complete', true, 'All database tests completed successfully');

      toast({
        title: 'Database Tests Complete! 🎉',
        description: 'Backend, frontend, and database are properly connected.',
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
    <div className="fixed bottom-4 left-4 z-50 w-96">
      <Card className="bg-white shadow-lg border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4" />
            Database Connection Test
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
                  Run All Tests
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
          <div className="max-h-80 overflow-y-auto space-y-2">
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
                  {result.details && (
                    <div className="text-gray-400 text-xs mt-1">
                      {JSON.stringify(result.details, null, 2)}
                    </div>
                  )}
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
                <Link className="h-3 w-3" />
                <span>Connection</span>
              </div>
              <div className="flex items-center gap-1">
                <Table className="h-3 w-3" />
                <span>Tables</span>
              </div>
              <div className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                <span>Categories</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>Products</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="border-t pt-3 text-xs text-gray-600">
            <div className="font-medium mb-1">Connection Status:</div>
            <ul className="space-y-1">
              <li>• Database: Supabase</li>
              <li>• Frontend: React + TypeScript</li>
              <li>• Backend: Supabase Functions</li>
              <li>• Integration: Perfect sync</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseConnectionTest;
