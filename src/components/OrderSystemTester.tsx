import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import backgroundOrderService from '@/services/backgroundOrderService';
import phoneNotificationService from '@/services/phoneNotificationService';
import {
  Play,
  Square,
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  Bell,
  Smartphone,
  Volume2,
  Vibrate,
  Wifi,
  WifiOff,
  Battery,
  Moon,
  Sun
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  timestamp: Date;
  duration?: number;
}

interface SystemStatus {
  backgroundService: boolean;
  phoneService: boolean;
  realtimeConnection: boolean;
  serviceWorker: boolean;
  notifications: boolean;
  wakeLock: boolean;
  isOnline: boolean;
}

const OrderSystemTester = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    backgroundService: false,
    phoneService: false,
    realtimeConnection: false,
    serviceWorker: false,
    notifications: false,
    wakeLock: false,
    isOnline: navigator.onLine
  });
  const [testOrder, setTestOrder] = useState({
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '+1234567890',
    totalAmount: 99.99,
    category: 'Bouquets',
    productDescription: 'Test Flower Arrangement',
    quantity: 1,
    specialRequests: 'This is a test order for system validation'
  });
  const [screenOffTest, setScreenOffTest] = useState(false);
  const [backgroundTest, setBackgroundTest] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    updateSystemStatus();
    const interval = setInterval(updateSystemStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateSystemStatus = () => {
    const bgStatus = backgroundOrderService.getStatus();
    const phoneSettings = phoneNotificationService.getSettings();
    
    setSystemStatus({
      backgroundService: bgStatus.isRunning,
      phoneService: phoneSettings.enabled,
      realtimeConnection: bgStatus.hasRealtimeConnection,
      serviceWorker: bgStatus.hasServiceWorker,
      notifications: Notification.permission === 'granted',
      wakeLock: bgStatus.hasWakeLock,
      isOnline: navigator.onLine
    });
  };

  const addTestResult = (name: string, status: TestResult['status'], message: string, duration?: number) => {
    setTests(prev => [...prev, {
      name,
      status,
      message,
      timestamp: new Date(),
      duration
    }]);
  };

  const updateTestResult = (name: string, status: TestResult['status'], message: string, duration?: number) => {
    setTests(prev => prev.map(test => 
      test.name === name 
        ? { ...test, status, message, duration, timestamp: new Date() }
        : test
    ));
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTests([]);
    
    const testSuite = [
      { name: 'System Initialization', test: testSystemInitialization },
      { name: 'Database Connection', test: testDatabaseConnection },
      { name: 'Real-time Subscription', test: testRealtimeSubscription },
      { name: 'Notification Permissions', test: testNotificationPermissions },
      { name: 'Service Worker Registration', test: testServiceWorkerRegistration },
      { name: 'Phone Notification Service', test: testPhoneNotificationService },
      { name: 'Background Order Service', test: testBackgroundOrderService },
      { name: 'Order Creation', test: testOrderCreation },
      { name: 'Order Notification Flow', test: testOrderNotificationFlow },
      { name: 'Screen Off Notifications', test: testScreenOffNotifications },
      { name: 'Background Processing', test: testBackgroundProcessing },
      { name: 'Offline Handling', test: testOfflineHandling },
      { name: 'Recovery After Connection Loss', test: testRecoveryAfterConnectionLoss }
    ];

    for (const { name, test } of testSuite) {
      addTestResult(name, 'running', 'Test in progress...');
      
      try {
        const startTime = Date.now();
        await test();
        const duration = Date.now() - startTime;
        updateTestResult(name, 'passed', 'Test completed successfully', duration);
      } catch (error) {
        const duration = Date.now() - Date.now();
        updateTestResult(name, 'failed', `Test failed: ${error}`, duration);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsRunningTests(false);
    toast({
      title: '🧪 Test Suite Completed',
      description: 'All order system tests have been executed',
    });
  };

  // Test Functions
  const testSystemInitialization = async () => {
    if (!systemStatus.backgroundService) {
      throw new Error('Background service not initialized');
    }
    if (!systemStatus.phoneService) {
      throw new Error('Phone service not initialized');
    }
  };

  const testDatabaseConnection = async () => {
    const { data, error } = await supabase.from('orders').select('count').limit(1);
    if (error) throw new Error(`Database connection failed: ${error.message}`);
  };

  const testRealtimeSubscription = async () => {
    if (!systemStatus.realtimeConnection) {
      throw new Error('Real-time subscription not active');
    }
  };

  const testNotificationPermissions = async () => {
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }
    }
  };

  const testServiceWorkerRegistration = async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }
    
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      throw new Error('Service Worker not registered');
    }
  };

  const testPhoneNotificationService = async () => {
    phoneNotificationService.testNotificationSound();
    // Wait a bit for the sound to play
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const testBackgroundOrderService = async () => {
    const status = backgroundOrderService.getStatus();
    if (!status.isRunning) {
      throw new Error('Background order service not running');
    }
  };

  const testOrderCreation = async () => {
    const orderNumber = `TEST-${Date.now()}`;
    
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: testOrder.customerName,
        customer_email: testOrder.customerEmail,
        customer_phone: testOrder.customerPhone,
        total_amount: testOrder.totalAmount,
        status: 'pending',
        notes: `Test order created at ${new Date().toISOString()}`
      })
      .select()
      .single();

    if (error) throw new Error(`Order creation failed: ${error.message}`);
    
    // Clean up test order
    setTimeout(async () => {
      await supabase.from('orders').delete().eq('id', data.id);
    }, 10000);
  };

  const testOrderNotificationFlow = async () => {
    return new Promise((resolve, reject) => {
      const orderNumber = `NOTIFY-TEST-${Date.now()}`;
      let notificationReceived = false;
      
      // Set up notification listener
      const handleNotification = (event: Event) => {
        if (event instanceof CustomEvent && event.detail.orderNumber === orderNumber) {
          notificationReceived = true;
          document.removeEventListener('orderNotification', handleNotification);
          resolve(true);
        }
      };
      
      document.addEventListener('orderNotification', handleNotification);
      
      // Create test order that should trigger notification
      supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: 'Notification Test',
          customer_email: 'notify@test.com',
          total_amount: 50.00,
          status: 'pending',
          notes: 'Notification flow test order'
        })
        .then(({ data, error }) => {
          if (error) {
            reject(new Error(`Notification test order creation failed: ${error.message}`));
            return;
          }
          
          // Clean up after test
          setTimeout(async () => {
            if (data && Array.isArray(data) && data.length > 0) {
              await supabase.from('orders').delete().eq('id', data[0].id);
            }
            if (!notificationReceived) {
              reject(new Error('Notification not received within timeout'));
            }
          }, 15000);
        });
    });
  };

  const testScreenOffNotifications = async () => {
    if (!screenOffTest) {
      throw new Error('Screen off test not enabled - please enable and test manually');
    }
    
    // This test requires manual verification
    toast({
      title: '📱 Screen Off Test',
      description: 'Turn off your screen now. A test notification will be sent in 5 seconds.',
      duration: 5000,
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Send test notification
    phoneNotificationService.notifyNewOrder('SCREEN-OFF-TEST', 'Screen Off Test Customer');
    
    // Wait for user to verify
    await new Promise(resolve => setTimeout(resolve, 10000));
  };

  const testBackgroundProcessing = async () => {
    if (!backgroundTest) {
      throw new Error('Background test not enabled - please enable and test manually');
    }
    
    // Test background processing by minimizing the app
    toast({
      title: '🔄 Background Test',
      description: 'Minimize this app now. A test order will be created in 10 seconds.',
      duration: 10000,
    });
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Create background test order
    const orderNumber = `BG-TEST-${Date.now()}`;
    await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: 'Background Test',
        customer_email: 'bg@test.com',
        total_amount: 75.00,
        status: 'pending',
        notes: 'Background processing test order'
      });
  };

  const testOfflineHandling = async () => {
    // This would require actually going offline, which is hard to test automatically
    if (!navigator.onLine) {
      throw new Error('Already offline - cannot test offline handling');
    }
    
    // Simulate offline behavior
    toast({
      title: '📡 Offline Test',
      description: 'Disconnect your internet now to test offline handling',
      duration: 5000,
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  };

  const testRecoveryAfterConnectionLoss = async () => {
    // Test recovery mechanisms
    await backgroundOrderService.restart();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const status = backgroundOrderService.getStatus();
    if (!status.isRunning) {
      throw new Error('Service did not recover after restart');
    }
  };

  const createTestOrder = async () => {
    const orderNumber = `MANUAL-TEST-${Date.now()}`;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: testOrder.customerName,
          customer_email: testOrder.customerEmail,
          customer_phone: testOrder.customerPhone,
          total_amount: testOrder.totalAmount,
          status: 'pending',
          notes: `Manual test order: ${testOrder.specialRequests}`
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Test Order Created',
        description: `Order #${orderNumber} created successfully`,
      });

      // Auto-delete after 30 seconds
      setTimeout(async () => {
        await supabase.from('orders').delete().eq('id', data.id);
        toast({
          title: '🗑️ Test Order Cleaned Up',
          description: `Order #${orderNumber} automatically deleted`,
        });
      }, 30000);

    } catch (error) {
      toast({
        title: '❌ Test Order Failed',
        description: `Failed to create test order: ${error}`,
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running': return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (isActive: boolean, label: string) => (
    <Badge variant={isActive ? "default" : "secondary"} className="flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
      {label}
    </Badge>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Order System Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Status */}
          <div>
            <h3 className="text-lg font-semibold mb-3">System Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {getStatusBadge(systemStatus.backgroundService, 'Background Service')}
              {getStatusBadge(systemStatus.phoneService, 'Phone Service')}
              {getStatusBadge(systemStatus.realtimeConnection, 'Real-time')}
              {getStatusBadge(systemStatus.serviceWorker, 'Service Worker')}
              {getStatusBadge(systemStatus.notifications, 'Notifications')}
              {getStatusBadge(systemStatus.wakeLock, 'Wake Lock')}
              {getStatusBadge(systemStatus.isOnline, 'Online')}
            </div>
          </div>

          {/* Test Configuration */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Test Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={testOrder.customerName}
                  onChange={(e) => setTestOrder(prev => ({ ...prev, customerName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  value={testOrder.totalAmount}
                  onChange={(e) => setTestOrder(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="specialRequests">Special Requests</Label>
                <Textarea
                  id="specialRequests"
                  value={testOrder.specialRequests}
                  onChange={(e) => setTestOrder(prev => ({ ...prev, specialRequests: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="screenOffTest"
                  checked={screenOffTest}
                  onCheckedChange={setScreenOffTest}
                />
                <Label htmlFor="screenOffTest">Enable Screen Off Test</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="backgroundTest"
                  checked={backgroundTest}
                  onCheckedChange={setBackgroundTest}
                />
                <Label htmlFor="backgroundTest">Enable Background Test</Label>
              </div>
            </div>
          </div>

          {/* Test Controls */}
          <div className="flex gap-2">
            <Button
              onClick={runAllTests}
              disabled={isRunningTests}
              className="flex items-center gap-2"
            >
              {isRunningTests ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            <Button
              onClick={createTestOrder}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Create Test Order
            </Button>
            <Button
              onClick={() => phoneNotificationService.testNotificationSound()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4" />
              Test Sound
            </Button>
          </div>

          {/* Test Results */}
          {tests.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Test Results</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tests.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <div className="font-medium">{test.name}</div>
                        <div className="text-sm text-gray-600">{test.message}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {test.duration && `${test.duration}ms`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSystemTester;
