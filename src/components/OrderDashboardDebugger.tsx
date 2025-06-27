import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Database, Wifi, Package } from 'lucide-react';

interface DebugInfo {
  supabaseConnection: boolean;
  ordersTableExists: boolean;
  orderCount: number;
  notificationCount: number;
  componentMounted: boolean;
  routeWorking: boolean;
  errors: string[];
}

const OrderDashboardDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    supabaseConnection: false,
    ordersTableExists: false,
    orderCount: 0,
    notificationCount: 0,
    componentMounted: false,
    routeWorking: false,
    errors: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const errors: string[] = [];
    let info: DebugInfo = {
      supabaseConnection: false,
      ordersTableExists: false,
      orderCount: 0,
      notificationCount: 0,
      componentMounted: true,
      routeWorking: true,
      errors: []
    };

    try {
      // Test 1: Supabase Connection
      console.log('🧪 Testing Supabase connection...');
      const { data: connectionTest, error: connectionError } = await supabase
        .from('orders')
        .select('count', { count: 'exact', head: true });
      
      if (connectionError) {
        errors.push(`Supabase connection failed: ${connectionError.message}`);
      } else {
        info.supabaseConnection = true;
        info.ordersTableExists = true;
        console.log('✅ Supabase connection successful');
      }

      // Test 2: Count Orders
      console.log('🧪 Counting orders...');
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');
      
      if (ordersError) {
        errors.push(`Orders query failed: ${ordersError.message}`);
      } else {
        info.orderCount = orders?.length || 0;
        console.log(`✅ Found ${info.orderCount} orders`);
      }

      // Test 3: Count Notifications
      console.log('🧪 Counting notifications...');
      const { data: notifications, error: notificationsError } = await supabase
        .from('order_notifications')
        .select('*');
      
      if (notificationsError) {
        errors.push(`Notifications query failed: ${notificationsError.message}`);
      } else {
        info.notificationCount = notifications?.length || 0;
        console.log(`✅ Found ${info.notificationCount} notifications`);
      }

    } catch (error) {
      errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    info.errors = errors;
    setDebugInfo(info);
    setLoading(false);
  };

  const createTestOrder = async () => {
    try {
      const testOrder = {
        order_number: `TEST-${Date.now()}`,
        customer_name: 'Debug Test Customer',
        customer_email: 'test@debug.com',
        total_amount: 25.99,
        status: 'pending',
        payment_status: 'pending'
      };

      const { data, error } = await supabase
        .from('orders')
        .insert(testOrder)
        .select();

      if (error) {
        console.error('❌ Test order creation failed:', error);
      } else {
        console.log('✅ Test order created:', data);
        runDiagnostics(); // Refresh counts
      }
    } catch (error) {
      console.error('❌ Unexpected error creating test order:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Running diagnostics...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Order Dashboard Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-3">
            {debugInfo.supabaseConnection ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span>Supabase Connection: {debugInfo.supabaseConnection ? 'Connected' : 'Failed'}</span>
          </div>

          {/* Component Status */}
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Component Mounted: Yes</span>
          </div>

          {/* Route Status */}
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Route Working: Yes (you're seeing this)</span>
          </div>

          {/* Data Counts */}
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-600" />
            <span>Orders in Database: {debugInfo.orderCount}</span>
          </div>

          <div className="flex items-center gap-3">
            <Wifi className="w-5 h-5 text-purple-600" />
            <span>Notifications in Database: {debugInfo.notificationCount}</span>
          </div>

          {/* Errors */}
          {debugInfo.errors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Errors Found:</h4>
              <ul className="space-y-1">
                {debugInfo.errors.map((error, index) => (
                  <li key={index} className="text-red-700 text-sm">• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button onClick={runDiagnostics} variant="outline">
              Re-run Diagnostics
            </Button>
            <Button onClick={createTestOrder} variant="default">
              Create Test Order
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDashboardDebugger;
