import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TestTube } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const TestOrderButton = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TEST-${timestamp.slice(-6)}-${random}`;
  };

  const createTestOrder = async () => {
    setIsCreating(true);
    try {
      const orderNumber = generateOrderNumber();
      const testCustomers = [
        { name: 'Mario Rossi', email: 'mario.rossi@email.com', phone: '+39 123 456 789' },
        { name: 'Giulia Bianchi', email: 'giulia.bianchi@email.com', phone: '+39 987 654 321' },
        { name: 'Francesco Verdi', email: 'francesco.verdi@email.com', phone: '+39 555 123 456' },
        { name: 'Anna Neri', email: 'anna.neri@email.com', phone: '+39 333 789 012' }
      ];

      const testProducts = [
        { category: 'matrimoni', name: 'Wedding Bouquet', price: 150 },
        { category: 'fiori_piante', name: 'Rose Arrangement', price: 75 },
        { category: 'fiori_finti', name: 'Artificial Centerpiece', price: 90 },
        { category: 'funerali', name: 'Funeral Wreath', price: 120 }
      ];

      const customer = testCustomers[Math.floor(Math.random() * testCustomers.length)];
      const product = testProducts[Math.floor(Math.random() * testProducts.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          customer_address: 'Via Roma 123, Milano, 20100, Italy', // Use customer_address column
          total_amount: product.price * quantity,
          status: 'pending',
          metadata: {
            billing_address: {
              street: 'Via Roma 123',
              city: 'Milano',
              postalCode: '20100',
              country: 'Italy'
            }
          },
          notes: `Test order for ${product.category} - ${product.name}`
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
          product_name: product.name,
          quantity: quantity,
          product_price: product.price,
          subtotal: product.price * quantity
        });

      if (itemError) throw itemError;

      // Create notification
      const { error: notificationError } = await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          message: `New order received from ${customerName}`,
          is_read: false
        });

      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
      }

      toast({
        title: 'Test Order Created! 🧪',
        description: `Test order #${orderNumber} created successfully. Check the admin panel to see the notification system in action.`,
        duration: 5000,
      });

    } catch (error) {
      console.error('Test order creation error:', error);
      toast({
        title: 'Test Order Failed',
        description: 'Failed to create test order. Please check the console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button 
      onClick={createTestOrder}
      disabled={isCreating}
      variant="outline"
      className="border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50"
    >
      {isCreating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating Test Order...
        </>
      ) : (
        <>
          <TestTube className="mr-2 h-4 w-4" />
          Create Test Order
        </>
      )}
    </Button>
  );
};

export default TestOrderButton;
