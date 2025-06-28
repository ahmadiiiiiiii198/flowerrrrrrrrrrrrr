import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle,
  MessageSquare,
  Flower2,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  hours: string;
}

const ContactUs = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    address: 'Piazza della Repubblica, 10100 Torino TO',
    phone: '+393498851455',
    email: 'Dbrfnc56m31@gmail.com',
    hours: 'Lun-Dom: 08:00 - 19:00'
  });

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

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-xl p-12 border border-green-100">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Messaggio Inviato con Successo! 🌸
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Grazie per averci contattato. Il tuo messaggio è stato ricevuto e ti risponderemo entro 24 ore.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Torna alla Home
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => setIsSubmitted(false)}
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-8 py-3"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Invia un Altro Messaggio
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Header />
      
      <section className="relative py-20 bg-gradient-to-r from-emerald-600 to-green-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <Flower2 className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Contattaci
            </h1>
            <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto leading-relaxed">
              Siamo qui per aiutarti con qualsiasi domanda sui nostri fiori, piante e servizi. 
              Contattaci per ordini personalizzati, matrimoni, eventi speciali e molto altro.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Le Nostre Informazioni di Contatto
              </h2>
              <p className="text-lg text-gray-600">
                Puoi trovarci facilmente e contattarci attraverso i seguenti canali. 
                Per inviare un messaggio, utilizza il modulo nella homepage.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
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
              </div>

              <div className="space-y-8">
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

                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-t-lg">
                    <CardTitle className="text-xl font-bold">Come Raggiungerci</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4 text-gray-600">
                      <p>
                        <strong>In Auto:</strong> Siamo facilmente raggiungibili dal centro di Torino. 
                        Parcheggio disponibile nelle vicinanze.
                      </p>
                      <p>
                        <strong>Mezzi Pubblici:</strong> Fermata metro più vicina: Repubblica (Linea 1). 
                        Autobus: linee 4, 6, 10, 18.
                      </p>
                      <p>
                        <strong>A Piedi:</strong> Nel cuore del centro storico, a pochi passi 
                        da Porta Palazzo e Via Po.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactUs;
