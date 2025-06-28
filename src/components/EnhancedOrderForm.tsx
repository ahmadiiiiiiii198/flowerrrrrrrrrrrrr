import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingCart, Phone, Mail, User, MapPin, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AddressValidator from './AddressValidator';
import StripeCheckout from './StripeCheckout';
import shippingZoneService from '@/services/shippingZoneService';
import { useBusinessHours } from '@/hooks/useBusinessHours';

interface OrderFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  category: string;
  productDescription: string;
  quantity: number;
  specialRequests: string;
  deliveryAddress: string;
}

interface AddressValidationResult {
  isValid: boolean;
  isWithinZone: boolean;
  distance: number;
  deliveryFee: number;
  formattedAddress: string;
  coordinates: { lat: number; lng: number };
  error?: string;
}

const EnhancedOrderForm = () => {
  const { toast } = useToast();
  const { validateOrderTime } = useBusinessHours();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Form, 2: Address Validation, 3: Payment
  const [addressValidation, setAddressValidation] = useState<AddressValidationResult | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<OrderFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    category: '',
    productDescription: '',
    quantity: 1,
    specialRequests: '',
    deliveryAddress: ''
  });

  const categories = [
    { value: 'matrimoni', label: 'Matrimoni - Wedding Arrangements' },
    { value: 'fiori_piante', label: 'Fiori & Piante - Fresh Flowers & Plants' },
    { value: 'fiori_finti', label: 'Fiori Finti - Artificial Flowers' },
    { value: 'funerali', label: 'Funerali - Funeral Arrangements' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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
    const subtotal = basePrice * formData.quantity;
    const deliveryFee = addressValidation?.deliveryFee || 0;
    return subtotal + deliveryFee;
  };

  const validateFormStep1 = () => {
    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone || !formData.category || !formData.productDescription || !formData.deliveryAddress) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields before proceeding.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleAddressValidation = (result: AddressValidationResult) => {
    setAddressValidation(result);
    if (result.isValid && result.isWithinZone) {
      setCurrentStep(3); // Move to payment step
    }
  };

  const createOrder = async () => {
    // Validate business hours first
    const businessHoursValidation = await validateOrderTime();
    if (!businessHoursValidation.valid) {
      throw new Error(businessHoursValidation.message);
    }

    if (!addressValidation) {
      throw new Error('Address validation required');
    }

    const orderNumber = generateOrderNumber();
    const totalAmount = calculateEstimatedPrice();

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        customer_address: addressValidation.formattedAddress, // Use customer_address column
        total_amount: totalAmount,
        status: 'payment_pending',
        metadata: {
          coordinates: addressValidation.coordinates,
          deliveryFee: addressValidation.deliveryFee
        },
        notes: `Category: ${formData.category}\nProduct: ${formData.productDescription}\nQuantity: ${formData.quantity}\nSpecial Requests: ${formData.specialRequests}`
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order item
    const itemPrice = (totalAmount - addressValidation.deliveryFee) / formData.quantity;
    const { error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: 'custom-order',
        product_name: `${categories.find(c => c.value === formData.category)?.label} - ${formData.productDescription}`,
        quantity: formData.quantity,
        product_price: itemPrice,
        subtotal: itemPrice * formData.quantity
      });

    if (itemError) throw itemError;

    // Create notification
    await supabase
      .from('order_notifications')
      .insert({
        order_id: order.id,
        message: `New order received from ${formData.customerName}`,
        is_read: false
      });

    setCreatedOrderId(order.id);
    return order.id;
  };

  const proceedToAddressValidation = () => {
    if (validateFormStep1()) {
      setCurrentStep(2);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
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
          Phone Number *
        </Label>
        <Input
          id="customerPhone"
          type="tel"
          value={formData.customerPhone}
          onChange={(e) => handleInputChange('customerPhone', e.target.value)}
          placeholder="Enter your phone number"
          required
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

      <div className="space-y-2">
        <Label>Estimated Price</Label>
        <div className="text-2xl font-bold text-green-600">
          €{calculateEstimatedPrice().toFixed(2)}
        </div>
        <p className="text-sm text-gray-500">+ delivery fee (calculated after address validation)</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deliveryAddress" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Delivery Address *
        </Label>
        <Input
          id="deliveryAddress"
          value={formData.deliveryAddress}
          onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
          placeholder="Enter your delivery address"
          required
        />
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
        onClick={proceedToAddressValidation}
        className="w-full"
        size="lg"
      >
        <MapPin className="mr-2 h-4 w-4" />
        Validate Address & Continue
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Address Validation</h3>
        <p className="text-gray-600">We need to verify that we can deliver to your address</p>
      </div>
      
      <AddressValidator
        address={formData.deliveryAddress}
        orderAmount={calculateEstimatedPrice() - (addressValidation?.deliveryFee || 0)}
        onValidAddress={handleAddressValidation}
      />
      
      <Button 
        variant="outline"
        onClick={() => setCurrentStep(1)}
        className="w-full"
      >
        Back to Order Details
      </Button>
    </div>
  );

  const renderStep3 = () => {
    if (!addressValidation || !addressValidation.isWithinZone) {
      return (
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold">Delivery Not Available</h3>
          <p className="text-gray-600">
            Sorry, we cannot deliver to this address. Please try a different address.
          </p>
          <Button onClick={() => setCurrentStep(2)}>
            Try Different Address
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Address Validated!</h3>
          <p className="text-gray-600">Delivery available</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Order Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>€{(calculateEstimatedPrice() - addressValidation.deliveryFee).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee:</span>
              <span>€{addressValidation.deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-1">
              <span>Total:</span>
              <span>€{calculateEstimatedPrice().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <StripeCheckout
          items={[{
            id: 'custom-order',
            name: `${categories.find(c => c.value === formData.category)?.label} - ${formData.productDescription}`,
            price: calculateEstimatedPrice() - addressValidation.deliveryFee,
            quantity: formData.quantity,
            description: formData.productDescription,
          }, {
            id: 'delivery-fee',
            name: 'Delivery Fee',
            price: addressValidation.deliveryFee,
            quantity: 1,
            description: `Delivery to ${addressValidation.formattedAddress}`,
          }]}
          customerInfo={{
            name: formData.customerName,
            email: formData.customerEmail,
            phone: formData.customerPhone,
          }}
          onCreateOrder={createOrder}
        />

        <Button 
          variant="outline"
          onClick={() => setCurrentStep(2)}
          className="w-full"
        >
          Back to Address Validation
        </Button>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          Place Your Order
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className={`flex items-center gap-1 ${currentStep >= 1 ? 'text-blue-600' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
            Order Details
          </div>
          <div className="w-8 h-px bg-gray-300"></div>
          <div className={`flex items-center gap-1 ${currentStep >= 2 ? 'text-blue-600' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
            Address
          </div>
          <div className="w-8 h-px bg-gray-300"></div>
          <div className={`flex items-center gap-1 ${currentStep >= 3 ? 'text-blue-600' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3</div>
            Payment
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </CardContent>
    </Card>
  );
};

export default EnhancedOrderForm;
