import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Clock, Save, Loader2, RefreshCw, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DayHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface WeeklyHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

const HoursSettings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours>({
    monday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
    tuesday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
    wednesday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
    thursday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
    friday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
    saturday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
    sunday: { isOpen: true, openTime: '08:00', closeTime: '19:00' }
  });

  const dayNames = {
    monday: 'Lunedì',
    tuesday: 'Martedì', 
    wednesday: 'Mercoledì',
    thursday: 'Giovedì',
    friday: 'Venerdì',
    saturday: 'Sabato',
    sunday: 'Domenica'
  };

  // Load current hours settings
  const loadHoursSettings = async () => {
    try {
      setIsLoading(true);
      console.log('🕒 Loading hours settings...');

      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'businessHours')
        .single();

      if (error) {
        console.error('❌ Error loading hours settings:', error);
        // If no hours settings exist, create default
        if (error.code === 'PGRST116') {
          console.log('🕒 No hours settings found, using defaults...');
          await createDefaultHoursSettings();
          return;
        }
        throw error;
      }

      if (data?.value) {
        console.log('✅ Hours settings loaded:', data.value);
        setWeeklyHours(data.value);
      }
    } catch (error) {
      console.error('❌ Failed to load hours settings:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare gli orari',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create default hours settings
  const createDefaultHoursSettings = async () => {
    try {
      const { error } = await supabase
        .from('settings')
        .insert({
          key: 'businessHours',
          value: weeklyHours
        });

      if (error) throw error;
      console.log('✅ Default hours settings created');
    } catch (error) {
      console.error('❌ Failed to create default hours settings:', error);
    }
  };

  // Save hours settings
  const saveHoursSettings = async () => {
    try {
      setIsSaving(true);
      console.log('💾 Saving hours settings...');

      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'businessHours',
          value: weeklyHours,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      console.log('✅ Hours settings saved successfully');
      toast({
        title: '✅ Orari Salvati',
        description: 'Gli orari di apertura sono stati aggiornati con successo',
      });

      // Also update the contact content hours string for display
      await updateContactHoursString();

    } catch (error) {
      console.error('❌ Failed to save hours settings:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile salvare gli orari',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update the contact content hours string for display in footer/contact
  const updateContactHoursString = async () => {
    try {
      // Generate hours string from weekly hours
      const hoursString = generateHoursString(weeklyHours);
      
      // Get current contact content
      const { data: contactData, error: contactError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'contactContent')
        .single();

      if (contactError && contactError.code !== 'PGRST116') {
        console.error('❌ Error loading contact content:', contactError);
        return;
      }

      const currentContact = contactData?.value || {};
      const updatedContact = {
        ...currentContact,
        hours: hoursString
      };

      // Update contact content with new hours string
      await supabase
        .from('settings')
        .upsert({
          key: 'contactContent',
          value: updatedContact,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      console.log('✅ Contact hours string updated');
    } catch (error) {
      console.error('❌ Failed to update contact hours string:', error);
    }
  };

  // Generate a readable hours string from weekly hours
  const generateHoursString = (hours: WeeklyHours): string => {
    const openDays: string[] = [];
    
    Object.entries(hours).forEach(([day, dayHours]) => {
      if (dayHours.isOpen) {
        const dayName = dayNames[day as keyof typeof dayNames];
        openDays.push(`${dayName}: ${dayHours.openTime}-${dayHours.closeTime}`);
      }
    });

    return openDays.length > 0 ? openDays.join(', ') : 'Chiuso';
  };

  // Update a specific day's hours
  const updateDayHours = (day: keyof WeeklyHours, field: keyof DayHours, value: boolean | string) => {
    setWeeklyHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  // Copy hours from one day to all days
  const copyToAllDays = (sourceDay: keyof WeeklyHours) => {
    const sourceHours = weeklyHours[sourceDay];
    const newHours = { ...weeklyHours };
    
    Object.keys(newHours).forEach(day => {
      newHours[day as keyof WeeklyHours] = { ...sourceHours };
    });
    
    setWeeklyHours(newHours);
    toast({
      title: '📋 Orari Copiati',
      description: `Gli orari di ${dayNames[sourceDay]} sono stati applicati a tutti i giorni`,
    });
  };

  // Load settings on component mount
  useEffect(() => {
    loadHoursSettings();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Caricamento orari...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-white/95 backdrop-blur-sm border border-blue-200 shadow-lg hover:shadow-blue-200/50 transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
          <CardTitle className="flex items-center gap-3 text-blue-800">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            Orari di Apertura
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-600 mb-4">
            Configura gli orari di apertura per ogni giorno della settimana. 
            I clienti potranno effettuare ordini solo durante gli orari di apertura.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={loadHoursSettings}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Ricarica
            </Button>
            
            <Button
              onClick={saveHoursSettings}
              disabled={isSaving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Salvataggio...' : 'Salva Orari'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Hours Cards */}
      <div className="grid gap-4">
        {Object.entries(weeklyHours).map(([day, dayHours]) => (
          <Card key={day} className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-gray-800">
                    {dayNames[day as keyof typeof dayNames]}
                  </h3>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => copyToAllDays(day as keyof WeeklyHours)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Copia a tutti
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${day}-open`} className="text-sm">
                      Aperto
                    </Label>
                    <Switch
                      id={`${day}-open`}
                      checked={dayHours.isOpen}
                      onCheckedChange={(checked) => updateDayHours(day as keyof WeeklyHours, 'isOpen', checked)}
                    />
                  </div>
                </div>
              </div>

              {dayHours.isOpen && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${day}-open-time`} className="text-sm text-gray-600">
                      Orario Apertura
                    </Label>
                    <Input
                      id={`${day}-open-time`}
                      type="time"
                      value={dayHours.openTime}
                      onChange={(e) => updateDayHours(day as keyof WeeklyHours, 'openTime', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`${day}-close-time`} className="text-sm text-gray-600">
                      Orario Chiusura
                    </Label>
                    <Input
                      id={`${day}-close-time`}
                      type="time"
                      value={dayHours.closeTime}
                      onChange={(e) => updateDayHours(day as keyof WeeklyHours, 'closeTime', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {!dayHours.isOpen && (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Chiuso</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Card */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Clock className="w-5 h-5" />
            Anteprima Orari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-2">
            Così appariranno gli orari nel footer e nella sezione contatti:
          </p>
          <div className="bg-white p-3 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-gray-800">
              {generateHoursString(weeklyHours)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HoursSettings;
