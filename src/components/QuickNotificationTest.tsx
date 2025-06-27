import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import phoneNotificationService from '@/services/phoneNotificationService';

export const QuickNotificationTest: React.FC = () => {
  const { toast } = useToast();
  const [audioEnabled, setAudioEnabled] = useState(false);

  const enableAudio = async () => {
    try {
      console.log('🔊 Enabling audio context with user interaction...');

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('📢 Notification permission:', permission);
      }

      // Initialize audio context with user interaction
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      console.log('🎵 Audio context state:', audioContext.state);

      setAudioEnabled(true);

      toast({
        title: '🔊 Audio Enabled!',
        description: 'Notification sounds are now ready to play.',
        duration: 3000,
      });

    } catch (error) {
      console.error('❌ Failed to enable audio:', error);
      toast({
        title: 'Audio Setup Failed',
        description: `Error: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const testNotificationDirectly = () => {
    console.log('🧪 Testing notification service directly...');
    phoneNotificationService.notifyNewOrder('TEST-DIRECT', 'Direct Test Customer');
  };

  const createTestOrder = async () => {
    try {
      console.log('🧪 Creating test order to trigger notifications...');

      const orderNumber = `TEST-${Date.now()}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          customer_phone: '+1234567890',
          customer_address: 'Test Address 123',
          total_amount: 50.00,
          status: 'pending',
          notes: 'Test order for notification system'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      console.log('✅ Test order created:', order);

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

      console.log('✅ Test order item created');

      // Create notification
      const { error: notificationError } = await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          notification_type: 'new_order',
          is_read: false
        });

      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
      }

      toast({
        title: 'Test Order Created! 🧪',
        description: `Test order #${orderNumber} created. Check console for notification logs.`,
        duration: 5000,
      });

    } catch (error) {
      console.error('❌ Test order creation failed:', error);
      toast({
        title: 'Test Failed',
        description: `Error: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-yellow-50">
      <h3 className="text-lg font-semibold mb-2">🧪 Notification Test</h3>
      <p className="text-sm text-gray-600 mb-4">
        Step 1: Enable audio, then test notifications. Check browser console for debug logs.
      </p>

      <div className="flex flex-wrap gap-2">
        {!audioEnabled ? (
          <Button
            onClick={enableAudio}
            className="bg-blue-600 hover:bg-blue-700"
          >
            🔊 Step 1: Enable Audio & Permissions
          </Button>
        ) : (
          <>
            <Button
              onClick={testNotificationDirectly}
              className="bg-green-600 hover:bg-green-700"
            >
              🔔 Step 2a: Test Direct Notification
            </Button>

            <Button
              onClick={createTestOrder}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              🔔 Step 2b: Create Test Order
            </Button>
          </>
        )}
      </div>

      {audioEnabled && (
        <p className="text-xs text-green-600 mt-2">
          ✅ Audio enabled! Notifications should now play sound.
        </p>
      )}
    </div>
  );
};
