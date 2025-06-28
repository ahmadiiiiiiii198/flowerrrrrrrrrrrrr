import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessHours } from '@/hooks/useBusinessHours';
import { ShoppingCart, MessageSquare, Loader2, Package, Send } from 'lucide-react';

interface OrderOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CustomRequestForm {
  customerPhone: string;
  customerEmail: string;
  description: string;
}

const OrderOptionsModal: React.FC<OrderOptionsModalProps> = ({ isOpen, onClose }) => {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { validateOrderTime } = useBusinessHours();
  
  const [formData, setFormData] = useState<CustomRequestForm>({
    customerPhone: '',
    customerEmail: '',
    description: ''
  });

  const handleInputChange = (field: keyof CustomRequestForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REQ-${timestamp.slice(-6)}-${random}`;
  };

  const handleGoToProducts = () => {
    onClose();
    // Scroll to products section
    const productsSection = document.getElementById('products');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If products section doesn't exist, navigate to products page
      window.location.href = '/#products';
    }
  };

  const handleCustomRequest = () => {
    setShowCustomForm(true);
  };

  const handleSubmitCustomRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate business hours first
    const businessHoursValidation = await validateOrderTime();
    if (!businessHoursValidation.valid) {
      toast({
        title: 'Negozio Chiuso',
        description: businessHoursValidation.message,
        variant: 'destructive'
      });
      return;
    }

    // Validation
    if (!formData.customerPhone.trim()) {
      toast({
        title: 'Errore',
        description: 'Il numero di telefono è obbligatorio',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: 'Errore',
        description: 'La descrizione della richiesta è obbligatoria',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderNumber = generateOrderNumber();
      
      // Create custom request order
      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: 'Cliente', // Default name since it's not collected
          customer_email: formData.customerEmail.trim() || 'noemail@provided.com',
          customer_phone: formData.customerPhone.trim(),
          total_amount: 0, // Will be determined later
          status: 'pending',
          order_type: 'custom_request',
          custom_request_description: formData.description.trim(),
          notes: `Richiesta personalizzata - Telefono: ${formData.customerPhone}${formData.customerEmail ? ` - Email: ${formData.customerEmail}` : ''}`,
          metadata: {
            request_type: 'custom',
            contact_method: 'phone',
            submitted_via: 'website_modal'
          }
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Richiesta Inviata!',
        description: `La tua richiesta personalizzata è stata inviata con successo. Numero ordine: ${orderNumber}`,
        duration: 5000
      });

      // Reset form and close modal
      setFormData({
        customerPhone: '',
        customerEmail: '',
        description: ''
      });
      setShowCustomForm(false);
      onClose();

    } catch (error) {
      console.error('Error submitting custom request:', error);
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore durante l\'invio della richiesta. Riprova.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setShowCustomForm(false);
    setFormData({
      customerPhone: '',
      customerEmail: '',
      description: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-emerald-700">
            {showCustomForm ? 'Richiesta Personalizzata' : 'Come vuoi ordinare?'}
          </DialogTitle>
        </DialogHeader>

        {!showCustomForm ? (
          <div className="space-y-4 p-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-emerald-200 hover:border-emerald-300">
              <CardContent className="p-6" onClick={handleGoToProducts}>
                <div className="flex items-center space-x-4">
                  <div className="bg-emerald-100 p-3 rounded-full">
                    <Package className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Ordina dai Prodotti</h3>
                    <p className="text-sm text-gray-600">Scegli dai nostri prodotti disponibili</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-blue-200 hover:border-blue-300">
              <CardContent className="p-6" onClick={handleCustomRequest}>
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Richiesta Personalizzata</h3>
                    <p className="text-sm text-gray-600">Descrivi quello che vuoi e ti contatteremo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <form onSubmit={handleSubmitCustomRequest} className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Numero di Telefono <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+39 123 456 7890"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email (opzionale)
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tua@email.com"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descrivi la tua richiesta <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Descrivi quello che stai cercando: tipo di fiori, occasione, colori preferiti, budget approssimativo, ecc."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
                rows={4}
                className="w-full resize-none"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1"
                disabled={isSubmitting}
              >
                Indietro
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Invio...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Invia Richiesta
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderOptionsModal;
