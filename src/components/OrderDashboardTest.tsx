// ORDER DASHBOARD TEST COMPONENT
// Simple test component to verify the new notification system

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TestTube, Package, Trash2 } from 'lucide-react';

const OrderDashboardTest: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [customerName, setCustomerName] = useState('Test Customer');
  const [customerEmail, setCustomerEmail] = useState('test@example.com');
  const [totalAmount, setTotalAmount] = useState(25.99);
  const { toast } = useToast();

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TEST-${timestamp.slice(-6)}${random}`;
  };

  const createTestOrder = async () => {
    setIsCreating(true);
    try {
      const orderNumber = generateOrderNumber();
      
      console.log('🧪 Creating test order:', orderNumber);
      
      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: '+39 123 456 789',
          customer_address: 'Via Roma 123, Milano, Italy',
          total_amount: totalAmount,
          status: 'pending',
          payment_status: 'pending',
          notes: `Test order created at ${new Date().toISOString()}`,
          metadata: {
            test: true,
            created_by: 'OrderDashboardTest'
          }
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Test order created:', data);
      
      toast({
        title: '✅ Test Order Created',
        description: `Order #${orderNumber} created successfully`,
      });

      // Auto-delete after 30 seconds
      setTimeout(async () => {
        try {
          await supabase.from('orders').delete().eq('id', data.id);
          console.log('🗑️ Test order auto-deleted:', orderNumber);
          toast({
            title: '🗑️ Test Order Cleaned Up',
            description: `Order #${orderNumber} automatically deleted`,
          });
        } catch (error) {
          console.error('Failed to delete test order:', error);
        }
      }, 30000);

    } catch (error) {
      console.error('Failed to create test order:', error);
      toast({
        title: 'Error',
        description: `Failed to create test order: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const createPayLaterOrder = async () => {
    setIsCreating(true);
    try {
      const orderNumber = generateOrderNumber();
      
      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: '+39 123 456 789',
          customer_address: 'Via Roma 123, Milano, Italy',
          total_amount: totalAmount,
          status: 'pending', // Pay Later
          payment_status: 'pending',
          payment_method: 'pay_later',
          notes: `Pay Later test order created at ${new Date().toISOString()}`,
          metadata: {
            test: true,
            type: 'pay_later',
            created_by: 'OrderDashboardTest'
          }
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '💰 Pay Later Order Created',
        description: `Order #${orderNumber} - Should trigger CONTINUOUS ringing`,
      });

      // Auto-delete after 30 seconds
      setTimeout(async () => {
        await supabase.from('orders').delete().eq('id', data.id);
      }, 30000);

    } catch (error) {
      console.error('Failed to create pay later order:', error);
      toast({
        title: 'Error',
        description: `Failed to create pay later order: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const createStripeOrder = async () => {
    setIsCreating(true);
    try {
      const orderNumber = generateOrderNumber();
      
      // First create with payment_pending
      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: '+39 123 456 789',
          customer_address: 'Via Roma 123, Milano, Italy',
          total_amount: totalAmount,
          status: 'payment_pending', // Stripe processing
          payment_status: 'pending',
          payment_method: 'stripe',
          notes: `Stripe test order created at ${new Date().toISOString()}`,
          metadata: {
            test: true,
            type: 'stripe',
            created_by: 'OrderDashboardTest'
          }
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '💳 Stripe Order Created',
        description: `Order #${orderNumber} - Processing payment...`,
      });

      // Simulate payment completion after 3 seconds
      setTimeout(async () => {
        try {
          await supabase
            .from('orders')
            .update({
              status: 'paid',
              payment_status: 'completed',
              paid_amount: totalAmount,
              paid_at: new Date().toISOString()
            })
            .eq('id', data.id);

          toast({
            title: '✅ Payment Completed',
            description: `Order #${orderNumber} payment successful`,
          });
        } catch (error) {
          console.error('Failed to update order status:', error);
        }
      }, 3000);

      // Auto-delete after 30 seconds
      setTimeout(async () => {
        await supabase.from('orders').delete().eq('id', data.id);
      }, 30000);

    } catch (error) {
      console.error('Failed to create stripe order:', error);
      toast({
        title: 'Error',
        description: `Failed to create stripe order: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const cleanupTestOrders = async () => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .like('order_number', 'TEST-%');

      if (error) throw error;

      toast({
        title: '🗑️ Cleanup Complete',
        description: 'All test orders have been deleted',
      });
    } catch (error) {
      console.error('Failed to cleanup test orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to cleanup test orders',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Order Dashboard Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Data Inputs */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="customer-name">Customer Name</Label>
            <Input
              id="customer-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>
          
          <div>
            <Label htmlFor="customer-email">Customer Email</Label>
            <Input
              id="customer-email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Enter customer email"
            />
          </div>
          
          <div>
            <Label htmlFor="total-amount">Total Amount (€)</Label>
            <Input
              id="total-amount"
              type="number"
              step="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter total amount"
            />
          </div>
        </div>

        {/* Test Buttons */}
        <div className="space-y-2">
          <Button
            onClick={createTestOrder}
            disabled={isCreating}
            className="w-full"
            variant="default"
          >
            <Package className="w-4 h-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Test Order'}
          </Button>

          <Button
            onClick={createPayLaterOrder}
            disabled={isCreating}
            className="w-full"
            variant="outline"
          >
            💰 Create Pay Later Order
          </Button>

          <Button
            onClick={createStripeOrder}
            disabled={isCreating}
            className="w-full"
            variant="outline"
          >
            💳 Create Stripe Order
          </Button>

          <Button
            onClick={cleanupTestOrders}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Cleanup Test Orders
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-600 border-t pt-3">
          <p className="font-medium mb-1">Test Instructions:</p>
          <ul className="space-y-1">
            <li>• Test orders auto-delete after 30 seconds</li>
            <li>• Pay Later orders should trigger continuous ringing</li>
            <li>• Stripe orders simulate payment flow</li>
            <li>• Check notifications panel for new notifications</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderDashboardTest;
