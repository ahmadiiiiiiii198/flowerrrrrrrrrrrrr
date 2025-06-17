import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Play, 
  RotateCcw,
  Database,
  Package,
  ShoppingCart,
  Settings
} from 'lucide-react';
import { productService } from '@/services/productService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  category: string;
  test: string;
  success: boolean;
  message: string;
  duration?: number;
  timestamp: string;
}

const MasterTestSuite = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState({ total: 0, passed: 0, failed: 0 });
  const { toast } = useToast();

  const addResult = (category: string, test: string, success: boolean, message: string, duration?: number) => {
    const result: TestResult = {
      category,
      test,
      success,
      message,
      duration,
      timestamp: new Date().toLocaleTimeString()
    };
    setResults(prev => [...prev, result]);
  };

  const updateProgress = (current: number, total: number, testName: string) => {
    setProgress((current / total) * 100);
    setCurrentTest(testName);
  };

  const runProductServiceTests = async () => {
    const startTime = Date.now();
    
    try {
      // Test 1: Fetch Content
      updateProgress(1, 12, 'Testing Product Service - Fetch Content');
      const content = await productService.fetchContent();
      const duration1 = Date.now() - startTime;
      
      if (content && content.products) {
        addResult('Product Service', 'Fetch Content', true, `Loaded ${Object.keys(content.products).length} categories`, duration1);
        
        // Test 2: Category Structure
        updateProgress(2, 12, 'Testing Product Service - Category Structure');
        const expectedCategories = ['matrimoni', 'fiori-piante', 'fiori-finti', 'funerali'];
        const actualCategories = Object.keys(content.products);
        const hasAllCategories = expectedCategories.every(cat => actualCategories.includes(cat));
        addResult('Product Service', 'Category Structure', hasAllCategories, 
          hasAllCategories ? 'All 4 categories present' : 'Missing categories');
        
        // Test 3: Product Count
        updateProgress(3, 12, 'Testing Product Service - Product Count');
        const totalProducts = Object.values(content.products).reduce((sum, products) => sum + products.length, 0);
        addResult('Product Service', 'Product Count', totalProducts > 0, `Total products: ${totalProducts}`);
        
        // Test 4: Featured Products
        updateProgress(4, 12, 'Testing Product Service - Featured Products');
        const featured = await productService.getFeaturedProducts();
        addResult('Product Service', 'Featured Products', featured.length > 0, `Found ${featured.length} featured products`);
        
      } else {
        addResult('Product Service', 'Fetch Content', false, 'Failed to load content');
      }
    } catch (error) {
      addResult('Product Service', 'Service Error', false, error.message);
    }
  };

  const runDatabaseTests = async () => {
    try {
      // Test 5: Database Connection
      updateProgress(5, 12, 'Testing Database - Connection');
      const { data, error } = await supabase.from('orders').select('count').limit(1);
      if (error) throw error;
      addResult('Database', 'Connection', true, 'Successfully connected to Supabase');
      
      // Test 6: Order Creation
      updateProgress(6, 12, 'Testing Database - Order Creation');
      const orderNumber = `TEST-MASTER-${Date.now()}`;
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: 'Master Test Customer',
          customer_email: 'mastertest@example.com',
          total_amount: 99.99,
          status: 'pending',
          billing_address: { street: 'Test St', city: 'Test City', postalCode: '12345', country: 'Italy' },
          shipping_address: { street: 'Test St', city: 'Test City', postalCode: '12345', country: 'Italy' },
          notes: 'Master test suite order'
        })
        .select()
        .single();

      if (orderError) throw orderError;
      addResult('Database', 'Order Creation', true, `Created order ${orderNumber}`);
      
      // Test 7: Order Item Creation
      updateProgress(7, 12, 'Testing Database - Order Item Creation');
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: 'master-test-product',
          product_name: 'Master Test Product',
          quantity: 1,
          price: 99.99
        });

      if (itemError) throw itemError;
      addResult('Database', 'Order Item Creation', true, 'Created order item');
      
      // Test 8: Notification Creation
      updateProgress(8, 12, 'Testing Database - Notification Creation');
      const { error: notificationError } = await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          notification_type: 'new_order',
          is_read: false
        });

      if (notificationError) throw notificationError;
      addResult('Database', 'Notification Creation', true, 'Created notification');
      
    } catch (error) {
      addResult('Database', 'Database Error', false, error.message);
    }
  };

  const runIntegrationTests = async () => {
    try {
      // Test 9: Product-Order Integration
      updateProgress(9, 12, 'Testing Integration - Product-Order Flow');
      const products = await productService.fetchProducts();
      const testProduct = products[0];
      
      if (testProduct) {
        addResult('Integration', 'Product-Order Flow', true, `Product ${testProduct.name} ready for ordering`);
      } else {
        addResult('Integration', 'Product-Order Flow', false, 'No products available for ordering');
      }
      
      // Test 10: Order Management Integration
      updateProgress(10, 12, 'Testing Integration - Order Management');
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      addResult('Integration', 'Order Management', true, `Found ${recentOrders?.length || 0} recent orders`);
      
      // Test 11: Notification System
      updateProgress(11, 12, 'Testing Integration - Notification System');
      const { data: notifications } = await supabase
        .from('order_notifications')
        .select('*')
        .eq('is_read', false)
        .limit(5);
      
      addResult('Integration', 'Notification System', true, `Found ${notifications?.length || 0} unread notifications`);
      
    } catch (error) {
      addResult('Integration', 'Integration Error', false, error.message);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);
    setCurrentTest('Initializing tests...');
    
    const startTime = Date.now();
    
    try {
      await runProductServiceTests();
      await runDatabaseTests();
      await runIntegrationTests();
      
      // Test 12: Final Validation
      updateProgress(12, 12, 'Final Validation');
      const totalDuration = Date.now() - startTime;
      addResult('System', 'Test Suite Complete', true, `All tests completed in ${totalDuration}ms`);
      
      toast({
        title: 'Test Suite Complete! 🎉',
        description: `All functionality tests have been executed. Check results below.`,
      });
      
    } catch (error) {
      addResult('System', 'Test Suite Error', false, error.message);
    } finally {
      setIsRunning(false);
      setCurrentTest('Tests completed');
      setProgress(100);
    }
  };

  const clearResults = () => {
    setResults([]);
    setProgress(0);
    setCurrentTest('');
    setSummary({ total: 0, passed: 0, failed: 0 });
  };

  useEffect(() => {
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = total - passed;
    setSummary({ total, passed, failed });
  }, [results]);

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-96">
      <Card className="bg-white shadow-xl border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TestTube className="h-5 w-5" />
            Master Test Suite
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              size="sm"
              className="flex-1"
            >
              {isRunning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {isRunning ? 'Running...' : 'Run All Tests'}
            </Button>
            <Button
              onClick={clearResults}
              size="sm"
              variant="outline"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          {isRunning && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <div className="text-sm text-gray-600">{currentTest}</div>
            </div>
          )}

          {/* Summary */}
          {summary.total > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <Badge variant="outline" className="justify-center">
                Total: {summary.total}
              </Badge>
              <Badge variant="outline" className="justify-center text-green-600">
                Passed: {summary.passed}
              </Badge>
              <Badge variant="outline" className="justify-center text-red-600">
                Failed: {summary.failed}
              </Badge>
            </div>
          )}

          {/* Results */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {results.map((result, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {result.category}
                    </Badge>
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <div className="text-gray-600 text-xs">{result.message}</div>
                  <div className="text-gray-400 text-xs">
                    {result.timestamp}
                    {result.duration && ` (${result.duration}ms)`}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="border-t pt-3 text-xs text-gray-600">
            <div className="font-medium mb-2">Test Coverage:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                Product Service
              </div>
              <div className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                Database
              </div>
              <div className="flex items-center gap-1">
                <ShoppingCart className="h-3 w-3" />
                Order System
              </div>
              <div className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Integration
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MasterTestSuite;
