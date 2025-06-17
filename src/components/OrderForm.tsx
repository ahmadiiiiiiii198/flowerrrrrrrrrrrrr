import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingCart, Phone, Mail, User, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OrderFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  category: string;
  productDescription: string;
  quantity: number;
  specialRequests: string;
  deliveryDate: string;
  billingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    sameAsBilling: boolean;
  };
}

const OrderForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    category: '',
    productDescription: '',
    quantity: 1,
    specialRequests: '',
    deliveryDate: '',
    billingAddress: {
      street: '',
      city: '',
      postalCode: '',
      country: 'Italy'
    },
    shippingAddress: {
      street: '',
      city: '',
      postalCode: '',
      country: 'Italy',
      sameAsBilling: true
    }
  });
  const { toast } = useToast();

  const categories = [
    { value: 'matrimoni', label: 'Matrimoni - Wedding Arrangements' },
    { value: 'fiori_piante', label: 'Fiori & Piante - Fresh Flowers & Plants' },
    { value: 'fiori_finti', label: 'Fiori Finti - Artificial Flowers' },
    { value: 'funerali', label: 'Funerali - Funeral Arrangements' }
  ];

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof OrderFormData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSameAsBillingChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        sameAsBilling: checked,
        ...(checked ? {
          street: prev.billingAddress.street,
          city: prev.billingAddress.city,
          postalCode: prev.billingAddress.postalCode,
          country: prev.billingAddress.country
        } : {})
      }
    }));
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp.slice(-6)}-${random}`;
  };

  const calculateEstimatedPrice = () => {
    const basePrices = {
      matrimoni: 150,
      fiori_piante: 50,
      fiori_finti: 80,
      funerali: 120
    };
    const basePrice = basePrices[formData.category as keyof typeof basePrices] || 50;
    return basePrice * formData.quantity;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.customerName || !formData.customerEmail || !formData.category) {
        throw new Error('Please fill in all required fields');
      }

      const orderNumber = generateOrderNumber();
      const estimatedPrice = calculateEstimatedPrice();

      // Prepare addresses
      const billingAddress = formData.billingAddress;
      const shippingAddress = formData.shippingAddress.sameAsBilling 
        ? formData.billingAddress 
        : formData.shippingAddress;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: formData.customerName,
          customer_email: formData.customerEmail,
          customer_phone: formData.customerPhone || null,
          total_amount: estimatedPrice,
          status: 'pending',
          billing_address: billingAddress,
          shipping_address: shippingAddress,
          notes: `Category: ${formData.category}\nProduct: ${formData.productDescription}\nQuantity: ${formData.quantity}\nSpecial Requests: ${formData.specialRequests}\nDelivery Date: ${formData.deliveryDate}`
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: 'custom-order',
          product_name: `${categories.find(c => c.value === formData.category)?.label} - ${formData.productDescription}`,
          quantity: formData.quantity,
          price: estimatedPrice / formData.quantity
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

      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
      }

      toast({
        title: 'Order Submitted Successfully! 🎉',
        description: `Your order #${orderNumber} has been received. We'll contact you soon to confirm details.`,
      });

      // Reset form
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        category: '',
        productDescription: '',
        quantity: 1,
        specialRequests: '',
        deliveryDate: '',
        billingAddress: {
          street: '',
          city: '',
          postalCode: '',
          country: 'Italy'
        },
        shippingAddress: {
          street: '',
          city: '',
          postalCode: '',
          country: 'Italy',
          sameAsBilling: true
        }
      });

    } catch (error) {
      console.error('Order submission error:', error);
      toast({
        title: 'Order Submission Failed',
        description: error.message || 'Please try again or contact us directly.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          Place Your Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name *
              </Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address *
              </Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="customerPhone"
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          {/* Product Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="productDescription">Product Description *</Label>
            <Textarea
              id="productDescription"
              value={formData.productDescription}
              onChange={(e) => handleInputChange('productDescription', e.target.value)}
              placeholder="Describe what you're looking for..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Preferred Delivery Date</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Estimated Price</Label>
              <div className="text-2xl font-bold text-green-600">
                €{calculateEstimatedPrice().toFixed(2)}
              </div>
              <p className="text-sm text-gray-500">Final price will be confirmed</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests</Label>
            <Textarea
              id="specialRequests"
              value={formData.specialRequests}
              onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              placeholder="Any special requirements or notes..."
              rows={2}
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Order...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Submit Order
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderForm;
