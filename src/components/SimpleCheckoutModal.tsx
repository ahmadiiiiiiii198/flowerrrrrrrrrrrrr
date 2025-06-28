import React, { useState, useEffect } from 'react';
import { X, CreditCard, User, Mail, Phone, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CartItem, useSimpleCart } from '@/hooks/use-simple-cart';
import { supabase } from '@/integrations/supabase/client';
import shippingZoneService from '@/services/shippingZoneService';
import { useBusinessHours } from '@/hooks/useBusinessHours';

interface SimpleCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalAmount: number;
}

const SimpleCheckoutModal: React.FC<SimpleCheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  totalAmount
}) => {
  const { toast } = useToast();
  const { validateOrderTime } = useBusinessHours();
  const { clearCart } = useSimpleCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressValidation, setAddressValidation] = useState<any>(null);
  const [customerData, setCustomerData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: ''
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomerData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        deliveryAddress: ''
      });
      setAddressValidation(null);

      // Force reload shipping zones from database
      shippingZoneService.reloadFromDatabase();
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));

    // Validate address when it changes
    if (field === 'deliveryAddress' && value.trim()) {
      validateAddress(value);
    }
  };

  const validateAddress = async (address: string) => {
    if (!address.trim()) return;

    console.log('🔍 Validating address:', address);
    console.log('💰 Order amount:', totalAmount);

    setIsValidatingAddress(true);
    try {
      const result = await shippingZoneService.validateDeliveryAddress(address, totalAmount);
      console.log('✅ Validation result:', result);
      setAddressValidation(result);
    } catch (error) {
      console.error('❌ Address validation error:', error);
      setAddressValidation({
        isValid: false,
        isWithinZone: false,
        distance: 0,
        deliveryFee: 0,
        estimatedTime: 'N/A',
        formattedAddress: address,
        coordinates: { lat: 0, lng: 0 },
        error: 'Errore nella validazione dell\'indirizzo'
      });
    } finally {
      setIsValidatingAddress(false);
    }
  };

  const isFormValid = () => {
    const basicFormValid = customerData.customerName.trim() &&
                          customerData.customerEmail.trim() &&
                          customerData.customerPhone.trim() &&
                          customerData.deliveryAddress.trim() &&
                          addressValidation?.isValid;

    // Also check business hours
    const timeValidation = validateOrderTime();

    return basicFormValid && timeValidation.isValid;
  };

  const calculateTotal = () => {
    const deliveryFee = addressValidation?.deliveryFee || 0;
    return totalAmount + deliveryFee;
  };

  const createStripeOrder = async () => {
    // Validate business hours
    const timeValidation = validateOrderTime();
    if (!timeValidation.isValid) {
      toast({
        title: 'Ordini non disponibili',
        description: timeValidation.message,
        variant: 'destructive'
      });
      return;
    }

    try {
      // Create order in database
      const orderData = {
        customer_name: customerData.customerName,
        customer_email: customerData.customerEmail,
        customer_phone: customerData.customerPhone,
        customer_address: customerData.deliveryAddress,
        total_amount: calculateTotal(),
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'stripe',
        order_type: 'delivery',
        metadata: {
          delivery_zone: addressValidation?.zone,
          delivery_fee: addressValidation?.deliveryFee || 0,
          cart_items: cartItems.length
        }
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
        metadata: {
          special_requests: item.specialRequests || null
        }
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Prepare Stripe line items
      const stripeItems = cartItems.map(item => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.product.name,
            description: item.product.description || `${item.product.name} - Francesco Fiori`,
          },
          unit_amount: Math.round(item.product.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      }));

      // Add delivery fee as separate line item if applicable
      if (addressValidation?.deliveryFee && addressValidation.deliveryFee > 0) {
        stripeItems.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Costo di Consegna',
              description: `Consegna a ${customerData.deliveryAddress}`,
            },
            unit_amount: Math.round(addressValidation.deliveryFee * 100),
          },
          quantity: 1,
        });
      }

      // Prepare Stripe checkout session data
      const stripeData = {
        payment_method_types: ['card'],
        line_items: stripeItems,
        mode: 'payment',
        customer_email: customerData.customerEmail,
        billing_address_collection: 'required',
        shipping_address_collection: {
          allowed_countries: ['IT', 'FR', 'DE', 'ES', 'AT', 'CH'],
        },
        success_url: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
        cancel_url: `${window.location.origin}/payment/cancel?order_id=${order.id}`,
        metadata: {
          order_id: order.id,
          customer_name: customerData.customerName,
          customer_phone: customerData.customerPhone,
          source: 'francesco_fiori_website',
          order_type: 'cart_order',
        }
      };

      console.log('📤 Creating Stripe checkout session...');
      console.log('📋 Stripe data:', JSON.stringify(stripeData, null, 2));

      // Use Netlify function for production, localhost for development
      const apiUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:3003/create-checkout-session'
        : '/.netlify/functions/create-checkout-session';

      console.log('🌐 Using API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stripeData),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Stripe server error response:', errorText);
        throw new Error(`Stripe error: ${response.status} - ${errorText}`);
      }

      const session = await response.json();
      console.log('✅ Stripe session created:', session.id);

      // Update order with Stripe session ID
      await supabase
        .from('orders')
        .update({ stripe_session_id: session.id })
        .eq('id', order.id);

      // Redirect to Stripe
      console.log('🚀 Redirecting to Stripe...');
      window.location.href = session.url;

    } catch (error) {
      console.error('Stripe order error:', error);
      toast({
        title: 'Errore nel pagamento',
        description: error instanceof Error ? error.message : 'Si è verificato un errore',
        variant: 'destructive'
      });
    }
  };

  const createPayLaterOrder = async () => {
    // Validate business hours
    const timeValidation = validateOrderTime();
    if (!timeValidation.isValid) {
      toast({
        title: 'Ordini non disponibili',
        description: timeValidation.message,
        variant: 'destructive'
      });
      return;
    }

    try {
      // Create order in database
      const orderData = {
        customer_name: customerData.customerName,
        customer_email: customerData.customerEmail,
        customer_phone: customerData.customerPhone,
        customer_address: customerData.deliveryAddress,
        total_amount: calculateTotal(),
        status: 'confirmed',
        payment_status: 'pending',
        payment_method: 'cash_on_delivery',
        order_type: 'delivery',
        metadata: {
          delivery_zone: addressValidation?.zone,
          delivery_fee: addressValidation?.deliveryFee || 0,
          cart_items: cartItems.length
        }
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
        metadata: {
          special_requests: item.specialRequests || null
        }
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;

    } catch (error) {
      console.error('Pay later order error:', error);
      throw error;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Checkout - {cartItems.length} Prodotti</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Riepilogo Ordine</h3>
            <div className="space-y-2 text-sm">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.product.name} x{item.quantity}</span>
                  <span>€{(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotale:</span>
                  <span>€{totalAmount.toFixed(2)}</span>
                </div>
                {addressValidation?.deliveryFee && (
                  <div className="flex justify-between text-blue-600">
                    <span>Costo consegna ({addressValidation.zone}):</span>
                    <span>€{addressValidation.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-1">
                  <span>Totale:</span>
                  <span>€{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Informazioni Cliente</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Nome Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="customerName"
                    value={customerData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    className="pl-10"
                    placeholder="Il tuo nome completo"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customerEmail">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerData.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    className="pl-10"
                    placeholder="la-tua-email@esempio.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customerPhone">Telefono *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="customerPhone"
                    value={customerData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    className="pl-10"
                    placeholder="+39 123 456 7890"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="deliveryAddress">Indirizzo di Consegna *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="deliveryAddress"
                    value={customerData.deliveryAddress}
                    onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                    className={`pl-10 ${
                      addressValidation?.isValid === false ? 'border-red-500' :
                      addressValidation?.isValid === true ? 'border-green-500' : ''
                    }`}
                    placeholder="Via, Città, CAP"
                  />
                  {isValidatingAddress && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-blue-500" />
                  )}
                </div>

                {/* Address Validation Status */}
                {addressValidation && (
                  <div className="mt-2 text-sm">
                    {addressValidation.isValid && addressValidation.isWithinZone ? (
                      <div className="text-green-600 bg-green-50 p-2 rounded">
                        ✓ Indirizzo valido - Distanza: {addressValidation.distance?.toFixed(1)}km
                        {addressValidation.deliveryFee > 0 && (
                          <span> - Costo consegna: €{addressValidation.deliveryFee.toFixed(2)}</span>
                        )}
                        <br />
                        <small className="text-green-500">
                          Tempo stimato: {addressValidation.estimatedTime}
                        </small>
                      </div>
                    ) : (
                      <div className="text-red-600 bg-red-50 p-2 rounded">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          {addressValidation.error || 'Indirizzo non valido o fuori zona di consegna'}
                        </div>
                        {addressValidation.distance && (
                          <small className="text-red-500 mt-1 block">
                            Distanza: {addressValidation.distance.toFixed(1)}km
                            {addressValidation.distance > 15 && ' (oltre il limite di 15km)'}
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="space-y-4">
            <h3 className="font-medium">Opzioni di Pagamento</h3>

            {/* Business Hours Warning */}
            {(() => {
              const timeValidation = validateOrderTime();
              if (!timeValidation.isValid) {
                return (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                      <div>
                        <h4 className="font-semibold text-amber-800">Ordini non disponibili</h4>
                        <p className="text-amber-700 text-sm">{timeValidation.message}</p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <Tabs defaultValue="stripe" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stripe">Paga Ora</TabsTrigger>
                <TabsTrigger value="later">Paga alla Consegna</TabsTrigger>
              </TabsList>

              <TabsContent value="stripe" className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Pagamento Immediato</h4>
                  <p className="text-blue-700 text-sm">
                    Paga subito con carta di credito tramite Stripe. Sicuro e veloce.
                  </p>
                </div>

                <Button
                  onClick={async () => {
                    setIsSubmitting(true);
                    try {
                      await createStripeOrder();
                    } catch (error) {
                      console.error('Stripe payment error:', error);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={!isFormValid() || isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creazione ordine...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Paga €{calculateTotal().toFixed(2)}
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="later" className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-amber-800 mb-2">Paga alla Consegna</h4>
                  <p className="text-amber-700 text-sm">
                    Conferma l'ordine ora e paga quando ricevi i prodotti. Ti contatteremo per confermare i dettagli.
                  </p>
                </div>

                <Button
                  onClick={async () => {
                    setIsSubmitting(true);
                    try {
                      await createPayLaterOrder();
                      clearCart();
                      toast({
                        title: 'Ordine Confermato! ✅',
                        description: 'Ti contatteremo presto per confermare i dettagli.',
                      });
                      onClose();
                    } catch (error) {
                      console.error('Pay later order error:', error);
                      toast({
                        title: 'Errore nell\'ordine',
                        description: error instanceof Error ? error.message : 'Si è verificato un errore',
                        variant: 'destructive'
                      });
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={!isFormValid() || isSubmitting}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creazione ordine...
                    </>
                  ) : (
                    'Conferma Ordine'
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleCheckoutModal;
