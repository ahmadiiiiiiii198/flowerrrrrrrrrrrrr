import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Phone, Mail, Save, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ContactInfo {
  phone: string;
  email: string;
  address?: string;
  hours?: string;
}

const ContactInfoEditor = () => {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phone: '',
    email: '',
    address: '',
    hours: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // Load current contact information
  const loadContactInfo = async () => {
    try {
      setIsLoading(true);
      console.log('📞 Loading contact information...');

      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'contactContent')
        .single();

      if (error) {
        console.error('❌ Error loading contact info:', error);
        // If no contact content exists, create default
        if (error.code === 'PGRST116') {
          console.log('📞 No contact content found, creating default...');
          await createDefaultContactInfo();
          return;
        }
        throw error;
      }

      if (data?.value) {
        console.log('✅ Contact info loaded:', data.value);
        setContactInfo({
          phone: data.value.phone || '',
          email: data.value.email || '',
          address: data.value.address || '',
          hours: data.value.hours || ''
        });
      }
    } catch (error) {
      console.error('❌ Failed to load contact info:', error);
      toast({
        title: 'Errore Caricamento',
        description: 'Impossibile caricare le informazioni di contatto',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create default contact information
  const createDefaultContactInfo = async () => {
    const defaultContact = {
      phone: '+393498851455',
      email: 'Dbrfnc56m31@gmail.com',
      address: 'Piazza della Repubblica, 10100 Torino TO',
      hours: 'Lun-Dom: 08:00 - 19:00'
    };

    try {
      const { error } = await supabase
        .from('settings')
        .insert({
          key: 'contactContent',
          value: defaultContact
        });

      if (error) throw error;

      setContactInfo(defaultContact);
      console.log('✅ Default contact info created');
    } catch (error) {
      console.error('❌ Failed to create default contact info:', error);
    }
  };

  // Save contact information
  const saveContactInfo = async () => {
    try {
      setIsSaving(true);
      console.log('💾 Saving contact information...');

      const { error } = await supabase
        .from('settings')
        .update({ value: contactInfo })
        .eq('key', 'contactContent');

      if (error) throw error;

      setHasChanges(false);
      console.log('✅ Contact info saved successfully');
      
      toast({
        title: 'Informazioni Salvate',
        description: 'Le informazioni di contatto sono state aggiornate con successo',
      });

    } catch (error) {
      console.error('❌ Failed to save contact info:', error);
      toast({
        title: 'Errore Salvataggio',
        description: 'Impossibile salvare le informazioni di contatto',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof ContactInfo, value: string) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  // Load data on component mount
  useEffect(() => {
    loadContactInfo();
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm border border-blue-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Caricamento informazioni di contatto...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phone Number Card */}
      <Card className="bg-white/95 backdrop-blur-sm border border-blue-200 shadow-lg hover:shadow-blue-200/50 transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
          <CardTitle className="flex items-center gap-3 text-blue-800">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            Numero di Telefono
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone" className="text-gray-700 font-medium">
                Numero di Telefono
              </Label>
              <Input
                id="phone"
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+39 123 456 7890"
                className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Formato consigliato: +39 seguito dal numero
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Card */}
      <Card className="bg-white/95 backdrop-blur-sm border border-green-200 shadow-lg hover:shadow-green-200/50 transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
          <CardTitle className="flex items-center gap-3 text-green-800">
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            Indirizzo Email
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Indirizzo Email
              </Label>
              <Input
                id="email"
                type="email"
                value={contactInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="info@francescofiori.it"
                className="mt-2 border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Email principale per contatti e ordini
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info Card */}
      <Card className="bg-white/95 backdrop-blur-sm border border-purple-200 shadow-lg hover:shadow-purple-200/50 transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
          <CardTitle className="flex items-center gap-3 text-purple-800">
            <div className="p-2 bg-purple-100 rounded-lg">
              <RefreshCw className="w-5 h-5 text-purple-600" />
            </div>
            Informazioni Aggiuntive
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="address" className="text-gray-700 font-medium">
                Indirizzo
              </Label>
              <Input
                id="address"
                value={contactInfo.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Via Roma 123, Città"
                className="mt-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div>
              <Label htmlFor="hours" className="text-gray-700 font-medium">
                Orari di Apertura
              </Label>
              <Input
                id="hours"
                value={contactInfo.hours || ''}
                onChange={(e) => handleInputChange('hours', e.target.value)}
                placeholder="Lun-Sab: 8:00-19:00, Dom: 9:00-13:00"
                className="mt-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-center">
          <Button
            onClick={saveContactInfo}
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Salva Modifiche
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ContactInfoEditor;
