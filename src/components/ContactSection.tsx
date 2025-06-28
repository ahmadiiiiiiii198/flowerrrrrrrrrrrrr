import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  Loader2, 
  MessageSquare,
  Flower2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  hours: string;
}

const ContactSection = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    address: 'Piazza della Repubblica, 10100 Torino TO',
    phone: '+393498851455',
    email: 'Dbrfnc56m31@gmail.com',
    hours: 'Lun-Dom: 08:00 - 19:00'
  });

  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  // Load contact info from database
  useEffect(() => {
    loadContactInfo();
  }, []);

  const loadContactInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'contactContent')
        .single();

      if (data?.value) {
        setContactInfo({
          address: data.value.address || contactInfo.address,
          phone: data.value.phone || contactInfo.phone,
          email: data.value.email || contactInfo.email,
          hours: data.value.hours || contactInfo.hours
        });
      }
    } catch (error) {
      console.error('Error loading contact info:', error);
    }
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: 'Campi Obbligatori',
        description: 'Per favore compila tutti i campi obbligatori.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create order from contact form
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone || null,
          customer_address: null, // No address provided in contact form
          total_amount: 0, // Will be determined later
          status: 'pending', // Custom request pending review
          payment_status: 'pending',
          notes: `Contact Form Request - Subject: ${subjectOptions.find(opt => opt.value === formData.subject)?.label}\nMessage: ${formData.message}`,
          metadata: {
            source: 'contact_form',
            subject: formData.subject,
            original_message: formData.message
          }
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item for custom request
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: 'custom-request',
          product_name: `Custom Request - ${subjectOptions.find(opt => opt.value === formData.subject)?.label}`,
          product_price: 0, // To be determined
          quantity: 1,
          subtotal: 0,
          metadata: {
            source: 'contact_form',
            subject: formData.subject,
            message: formData.message
          }
        });

      if (itemError) throw itemError;

      // Create notification for admin
      const { error: notificationError } = await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          message: `New custom request from ${formData.name} - ${subjectOptions.find(opt => opt.value === formData.subject)?.label}`,
          is_read: false
        });

      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
      }

      toast({
        title: 'Messaggio Inviato! ✅',
        description: 'Grazie per averci contattato. Ti risponderemo presto!',
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });

    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: 'Errore nell\'invio',
        description: 'Si è verificato un errore. Riprova più tardi.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjectOptions = [
    { value: 'general', label: 'Informazioni Generali' },
    { value: 'order', label: 'Ordine Personalizzato' },
    { value: 'wedding', label: 'Matrimoni e Eventi' },
    { value: 'funeral', label: 'Composizioni Funebri' },
    { value: 'delivery', label: 'Consegne' },
    { value: 'complaint', label: 'Reclamo' },
    { value: 'other', label: 'Altro' }
  ];

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-100 p-4 rounded-full">
              <Flower2 className="h-12 w-12 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Contattaci
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Siamo qui per aiutarti con qualsiasi domanda sui nostri fiori, piante e servizi. 
            Contattaci per ordini personalizzati, matrimoni, eventi speciali e molto altro.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          
          {/* Contact Form */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-t-lg">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <MessageSquare className="h-6 w-6" />
                Invia un Messaggio
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700 font-medium">
                      Nome Completo *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Il tuo nome"
                      required
                      className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="la-tua-email@esempio.com"
                      required
                      className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700 font-medium">
                      Telefono
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+39 123 456 7890"
                      className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-gray-700 font-medium">
                      Oggetto *
                    </Label>
                    <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                      <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                        <SelectValue placeholder="Seleziona un oggetto" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-gray-700 font-medium">
                    Messaggio *
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Scrivi qui il tuo messaggio..."
                    rows={5}
                    required
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Invia Messaggio
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-t-lg">
                <CardTitle className="text-2xl font-bold">Informazioni di Contatto</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-emerald-100 p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Indirizzo</h3>
                    <p className="text-gray-600">{contactInfo.address}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-emerald-100 p-3 rounded-full">
                    <Phone className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Telefono</h3>
                    <a href={`tel:${contactInfo.phone}`} className="text-emerald-600 hover:text-emerald-700 font-medium">
                      {contactInfo.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-emerald-100 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Email</h3>
                    <a href={`mailto:${contactInfo.email}`} className="text-emerald-600 hover:text-emerald-700 font-medium">
                      {contactInfo.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-emerald-100 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Orari di Apertura</h3>
                    <p className="text-gray-600">{contactInfo.hours}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map Placeholder */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="h-64 bg-gradient-to-br from-emerald-100 to-green-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
                    <p className="text-emerald-700 font-medium">Mappa Interattiva</p>
                    <p className="text-emerald-600 text-sm">Clicca per aprire in Google Maps</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
