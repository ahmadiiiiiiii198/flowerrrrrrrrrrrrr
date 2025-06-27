import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Database, CheckCircle, XCircle, Loader2, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DatabaseTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { toast } = useToast();

  const addTestResult = (test: string, success: boolean, message: string, data?: any) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('orders').select('count').limit(1);
      if (error) throw error;
      addTestResult('Database Connection', true, 'Successfully connected to Supabase');
      return true;
    } catch (error) {
      addTestResult('Database Connection', false, `Connection failed: ${error.message}`);
      return false;
    }
  };

  const testOrderCreation = async () => {
    try {
      const orderNumber = `TEST-${Date.now()}`;
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          customer_phone: '+39 123 456 7890',
          total_amount: 50.00,
          status: 'pending',
          billing_address: {
            street: 'Via Test 123',
            city: 'Milano',
            postalCode: '20100',
            country: 'Italy'
          },
          shipping_address: {
            street: 'Via Test 123',
            city: 'Milano',
            postalCode: '20100',
            country: 'Italy'
          },
          notes: 'Test order for database integration'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: 'test-product',
          product_name: 'Test Product',
          quantity: 1,
          product_price: 50.00,
          subtotal: 50.00
        });

      if (itemError) throw itemError;

      // Create notification
      const { error: notificationError } = await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          notification_type: 'new_order',
          is_read: false
        });

      if (notificationError) throw notificationError;

      addTestResult('Order Creation', true, `Created test order ${orderNumber}`);
      return order;
    } catch (error) {
      addTestResult('Order Creation', false, `Failed to create order: ${error.message}`);
      return null;
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setOrders(data || []);
      addTestResult('Fetch Orders', true, `Retrieved ${data?.length || 0} orders`);
    } catch (error) {
      addTestResult('Fetch Orders', false, `Failed to fetch orders: ${error.message}`);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('order_notifications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setNotifications(data || []);
      addTestResult('Fetch Notifications', true, `Retrieved ${data?.length || 0} unread notifications`);
    } catch (error) {
      addTestResult('Fetch Notifications', false, `Failed to fetch notifications: ${error.message}`);
    }
  };

  const cleanupTestData = async () => {
    try {
      // Delete test orders (this will cascade to order_items and notifications)
      const { error } = await supabase
        .from('orders')
        .delete()
        .like('order_number', 'TEST-%');

      if (error) throw error;
      addTestResult('Cleanup', true, 'Removed test orders from database');
      
      // Refresh data
      await fetchOrders();
      await fetchNotifications();
      
      toast({
        title: 'Cleanup Complete',
        description: 'Test orders have been removed from the database',
      });
    } catch (error) {
      addTestResult('Cleanup', false, `Cleanup failed: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addTestResult('Starting Tests', true, 'Beginning database integration tests');
      
      // Test 1: Database Connection
      const connected = await testDatabaseConnection();
      if (!connected) return;
      
      // Test 2: Order Creation
      await testOrderCreation();
      
      // Test 3: Data Fetching
      await fetchOrders();
      await fetchNotifications();
      
      addTestResult('All Tests Complete', true, 'Database integration tests completed');
      
    } catch (error) {
      addTestResult('Test Error', false, `Unexpected error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md">
      <Card className="bg-white shadow-lg border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4" />
            Database Integration Test
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={runAllTests}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <Plus className="mr-2 h-3 w-3" />
              )}
              Run Tests
            </Button>
            <Button
              onClick={cleanupTestData}
              size="sm"
              variant="outline"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Test Results */}
          <div className="max-h-48 overflow-y-auto space-y-2">
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

          {/* Current Data */}
          {(orders.length > 0 || notifications.length > 0) && (
            <div className="border-t pt-3 space-y-2">
              <div className="text-xs font-medium">Current Data:</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Badge variant="outline" className="text-xs w-full justify-center">
                    Orders: {orders.length}
                  </Badge>
                </div>
                <div>
                  <Badge variant="outline" className="text-xs w-full justify-center">
                    Notifications: {notifications.length}
                  </Badge>
                </div>
              </div>
              
              {orders.length > 0 && (
                <div className="text-xs">
                  <div className="font-medium mb-1">Recent Orders:</div>
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="text-gray-600">
                      #{order.order_number} - €{order.total_amount} - {order.status}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseTest;
