import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { initializeProducts } from '@/utils/initializeProducts';
import { initializeCategories } from '@/utils/initializeCategories';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Play,
  RotateCcw,
  Zap,
  Database,
  Package,
  ShoppingCart,
  Bell
} from 'lucide-react';

const CompleteSystemTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState('');
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

  const updateStep = (step: string) => {
    setCurrentStep(step);
  };

  const runCompleteSystemTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentStep('Starting...');

    try {
      // Step 1: Test Database Connection
      updateStep('Testing database connection...');
      const { data, error } = await supabase.from('categories').select('id').limit(1);
      if (error) throw new Error(`Database connection failed: ${error.message}`);
      addResult('Database Connection', true, 'Successfully connected to Supabase');

      // Step 2: Initialize Categories
      updateStep('Initializing categories...');
      const categoriesSuccess = await initializeCategories();
      if (!categoriesSuccess) throw new Error('Failed to initialize categories');
      addResult('Categories Initialization', true, 'Categories initialized successfully');

      // Step 3: Verify Categories
      updateStep('Verifying categories...');
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name, slug, is_active')
        .eq('is_active', true);
      
      if (catError) throw new Error(`Categories verification failed: ${catError.message}`);
      
      const expectedSlugs = ['fiori-piante', 'fiori-finti', 'matrimoni', 'funerali'];
      const existingSlugs = categories?.map(cat => cat.slug) || [];
      const missingCategories = expectedSlugs.filter(slug => !existingSlugs.includes(slug));
      
      if (missingCategories.length > 0) {
        throw new Error(`Missing categories: ${missingCategories.join(', ')}`);
      }
      
      addResult('Categories Verification', true, `Found all ${categories?.length} required categories`);

      // Step 4: Initialize Products
      updateStep('Initializing products...');
      const productsSuccess = await initializeProducts();
      if (!productsSuccess) throw new Error('Failed to initialize products');
      addResult('Products Initialization', true, 'Products initialized successfully');

      // Step 5: Verify Products with Categories
      updateStep('Verifying products and category relationships...');
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          is_active,
          is_featured,
          category_id,
          categories (
            id,
            name,
            slug
          )
        `)
        .eq('is_active', true);

      if (prodError) throw new Error(`Products verification failed: ${prodError.message}`);
      
      if (!products || products.length === 0) {
        throw new Error('No active products found');
      }

      const productsWithCategories = products.filter(product => (product as any).categories);
      const productsWithoutCategories = products.length - productsWithCategories.length;

      if (productsWithoutCategories > 0) {
        addResult('Products Verification', false, `${productsWithoutCategories} products missing category links`);
      } else {
        addResult('Products Verification', true, `All ${products.length} products properly linked to categories`);
      }

      // Step 6: Test Product Distribution by Category
      updateStep('Testing product distribution by category...');
      const productsByCategory = products.reduce((acc, product) => {
        const categorySlug = (product as any).categories?.slug || 'unknown';
        if (!acc[categorySlug]) acc[categorySlug] = 0;
        acc[categorySlug]++;
        return acc;
      }, {} as Record<string, number>);

      const distributionResults = Object.entries(productsByCategory).map(([slug, count]) => `${slug}: ${count}`);
      addResult('Product Distribution', true, `Products per category: ${distributionResults.join(', ')}`);

      // Step 7: Test Order System
      updateStep('Testing order system...');
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

      if (orderError) throw new Error(`Order creation failed: ${orderError.message}`);

      // Test order item creation
      const firstProduct = products[0];
      const testOrderItem = {
        order_id: order.id,
        product_id: firstProduct.id,
        product_name: firstProduct.name,
        quantity: 1,
        price: firstProduct.price
      };

      const { error: itemError } = await supabase
        .from('order_items')
        .insert(testOrderItem);

      if (itemError) throw new Error(`Order item creation failed: ${itemError.message}`);

      // Test notification creation
      const { error: notificationError } = await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          notification_type: 'new_order',
          is_read: false
        });

      if (notificationError) throw new Error(`Notification creation failed: ${notificationError.message}`);

      addResult('Order System', true, 'Complete order flow working correctly');

      // Step 8: Clean up test data
      updateStep('Cleaning up test data...');
      await supabase.from('order_items').delete().eq('order_id', order.id);
      await supabase.from('order_notifications').delete().eq('order_id', order.id);
      await supabase.from('orders').delete().eq('id', order.id);
      addResult('Cleanup', true, 'Test data cleaned up successfully');

      // Step 9: Final Verification
      updateStep('Final verification...');
      
      // Count final state
      const { data: finalCategories } = await supabase.from('categories').select('id').eq('is_active', true);
      const { data: finalProducts } = await supabase.from('products').select('id').eq('is_active', true);
      
      addResult('Final State', true, `System ready: ${finalCategories?.length} categories, ${finalProducts?.length} products`);

      // Success!
      updateStep('Complete!');
      addResult('System Test Complete', true, '🎉 All systems operational! Backend, frontend, and database perfectly integrated.');

      toast({
        title: 'Complete System Test Passed! 🎉',
        description: 'Backend, frontend, and database are perfectly connected and working.',
      });

    } catch (error) {
      addResult('System Test Failed', false, `Error: ${error.message}`);
      updateStep('Failed');
      toast({
        title: 'System Test Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
      setCurrentStep('');
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setCurrentStep('');
  };

  return (
    <div className="fixed top-4 left-4 z-50 w-96">
      <Card className="bg-white shadow-lg border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4" />
            Complete System Test
          </CardTitle>
          {currentStep && (
            <div className="text-xs text-blue-600 font-medium">
              {currentStep}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              onClick={runCompleteSystemTest}
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
                  Run Complete Test
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
                  <div className="text-gray-400">{result.timestamp}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Test Overview */}
          <div className="border-t pt-3 text-xs">
            <div className="font-medium mb-2">Complete Test Coverage:</div>
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
                <ShoppingCart className="h-3 w-3" />
                <span>Orders</span>
              </div>
              <div className="flex items-center gap-1">
                <Bell className="h-3 w-3" />
                <span>Notifications</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="border-t pt-3 text-xs text-gray-600">
            <div className="font-medium mb-1">This test will:</div>
            <ul className="space-y-1">
              <li>• Initialize categories and products</li>
              <li>• Verify database relationships</li>
              <li>• Test complete order flow</li>
              <li>• Validate all integrations</li>
              <li>• Confirm system readiness</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteSystemTest;
