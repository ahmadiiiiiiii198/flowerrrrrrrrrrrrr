import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const TestProductOrder = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const testProducts = [
    {
      id: "test-1",
      name: "Bouquet Sposa Elegante",
      description: "Bouquet raffinato con rose bianche e peonie per il giorno più importante",
      price: 85.00,
      category: "Matrimoni",
      category_slug: "matrimoni",
      image_url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      is_featured: true,
      is_available: true,
      stock_quantity: 10
    },
    {
      id: "test-2",
      name: "Bouquet Rose Rosse",
      description: "Classico bouquet di rose rosse fresche, simbolo di amore eterno",
      price: 55.00,
      category: "Fiori & Piante",
      category_slug: "fiori-piante",
      image_url: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      is_featured: true,
      is_available: true,
      stock_quantity: 25
    }
  ];

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TEST-${timestamp.slice(-6)}${random}`;
  };

  const createTestOrder = async (product: typeof testProducts[0]) => {
    setIsSubmitting(true);

    try {
      const orderNumber = generateOrderNumber();
      const quantity = 1;
      const totalAmount = product.price * quantity;

      // Test customer data
      const testCustomer = {
        name: "Mario Rossi",
        email: "mario.rossi@test.com",
        phone: "+39 123 456 7890"
      };

      console.log('[TestProductOrder] Creating test order:', {
        orderNumber,
        product: product.name,
        customer: testCustomer.name,
        total: totalAmount
      });

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: testCustomer.name,
          customer_email: testCustomer.email,
          customer_phone: testCustomer.phone,
          customer_address: 'Via Roma 123, Milano, 20100, Italy', // Use customer_address column
          total_amount: totalAmount,
          status: 'pending',
          metadata: {
            billing_address: {
              street: 'Via Roma 123',
              city: 'Milano',
              postalCode: '20100',
              country: 'Italy'
            }
          },
          notes: `Test Product Order - ${product.name}\nQuantity: ${quantity}\nCategory: ${product.category}`
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: product.id,
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
        title: 'Test Order Created Successfully! 🎉',
        description: `Test order #${orderNumber} for ${product.name} has been created.`,
      });

      console.log('[TestProductOrder] Test order created successfully:', order);

    } catch (error) {
      console.error('Test order creation error:', error);
      toast({
        title: 'Test Order Failed',
        description: error.message || 'Failed to create test order.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
        <h3 className="text-sm font-semibold mb-3 text-gray-800">Test Ordini Prodotti</h3>
        <div className="space-y-2">
          {testProducts.map((product) => (
            <Button
              key={product.id}
              onClick={() => createTestOrder(product)}
              disabled={isSubmitting}
              size="sm"
              className="w-full justify-start text-xs"
              variant="outline"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <ShoppingCart className="mr-2 h-3 w-3" />
              )}
              Test {product.name}
            </Button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Crea ordini di test per sviluppo
        </p>
      </div>
    </div>
  );
};

export default TestProductOrder;
