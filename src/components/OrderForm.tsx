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
import { useBusinessHours } from '@/hooks/useBusinessHours';
import BusinessHoursStatus from './BusinessHoursStatus';

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
  const { toast } = useToast();
  const { validateOrderTime } = useBusinessHours();
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
      // Validate business hours first
      const businessHoursValidation = await validateOrderTime();
      if (!businessHoursValidation.valid) {
        throw new Error(businessHoursValidation.message);
      }

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
          customer_address: shippingAddress, // Use customer_address column
          total_amount: estimatedPrice,
          status: 'payment_pending', // Will be updated to 'paid' by Stripe webhook
          payment_status: 'pending',
          payment_method: 'stripe',
          metadata: {
            billing_address: billingAddress
          },
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
          message: `New order received from ${formData.customerName}`,
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
    <Card className="w-full max-w-4xl mx-auto shadow-lg border border-emerald-200 bg-white/95 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-amber-50 border-b border-emerald-200 p-4 sm:p-6">
        <CardTitle className="flex flex-col sm:flex-row items-center gap-3 text-gray-800 text-center sm:text-left">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <ShoppingCart className="h-5 h-5 sm:h-6 sm:w-6 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Effettua il Tuo Ordine</h2>
            <p className="text-xs sm:text-sm text-gray-600 font-normal">Francesco Fiori & Piante - Creazioni su misura</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 md:p-8">
        {/* Business Hours Status */}
        <div className="mb-6">
          <BusinessHoursStatus variant="banner" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Customer Information */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Informazioni Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="customerName" className="flex items-center gap-2 text-gray-700 font-medium text-sm sm:text-base">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                  Nome Completo *
                </Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  placeholder="Inserisci il tuo nome completo"
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 text-sm sm:text-base h-10 sm:h-11"
                  required
                />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="customerEmail" className="flex items-center gap-2 text-gray-700 font-medium text-sm sm:text-base">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                  Indirizzo Email *
                </Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  placeholder="Inserisci la tua email"
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 text-sm sm:text-base h-10 sm:h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="customerPhone" className="flex items-center gap-2 text-gray-700 font-medium text-sm sm:text-base">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                Numero di Telefono
              </Label>
              <Input
                id="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                placeholder="Inserisci il tuo numero di telefono"
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 text-sm sm:text-base h-10 sm:h-11"
              />
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Dettagli Prodotto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3">
                <Label htmlFor="category" className="text-gray-700 font-medium">Categoria *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                    <SelectValue placeholder="Seleziona una categoria" />
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
              <div className="space-y-3">
                <Label htmlFor="quantity" className="text-gray-700 font-medium">Quantità</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="productDescription" className="text-gray-700 font-medium">Descrizione Prodotto *</Label>
              <Textarea
                id="productDescription"
                value={formData.productDescription}
                onChange={(e) => handleInputChange('productDescription', e.target.value)}
                placeholder="Descrivi cosa stai cercando..."
                rows={4}
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="deliveryDate" className="text-gray-700 font-medium">Data di Consegna Preferita</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  value={formData.deliveryDate}
                  onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-gray-700 font-medium">Prezzo Stimato</Label>
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="text-3xl font-bold text-emerald-700">
                    €{calculateEstimatedPrice().toFixed(2)}
                  </div>
                  <p className="text-sm text-emerald-600 mt-1">Il prezzo finale sarà confermato</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="specialRequests" className="text-gray-700 font-medium">Richieste Speciali</Label>
              <Textarea
                id="specialRequests"
                value={formData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                placeholder="Eventuali richieste speciali o note..."
                rows={3}
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 sm:py-4 text-base sm:text-lg h-12 sm:h-auto"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span className="text-sm sm:text-base">Invio Ordine in Corso...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Invia Ordine</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderForm;
