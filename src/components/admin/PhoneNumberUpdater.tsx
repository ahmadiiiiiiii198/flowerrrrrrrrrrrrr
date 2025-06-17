import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Phone, Database, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PhoneNumberUpdater = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResults, setUpdateResults] = useState<string[]>([]);
  const { toast } = useToast();

  const newPhoneNumber = '+393498851455';

  const updatePhoneNumber = async () => {
    setIsUpdating(true);
    setUpdateResults([]);
    
    const addResult = (message: string) => {
      setUpdateResults(prev => [...prev, message]);
    };

    try {
      addResult('🔄 Starting phone number update...');
      
      // Update contactContent in settings table
      addResult('📞 Updating contact content...');
      const { data: currentContact, error: fetchError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'contactContent')
        .single();

      if (fetchError) {
        addResult(`❌ Error fetching current contact: ${fetchError.message}`);
      } else {
        const updatedContact = {
          ...currentContact.value,
          phone: newPhoneNumber
        };

        const { error: updateError } = await supabase
          .from('settings')
          .update({ value: updatedContact })
          .eq('key', 'contactContent');

        if (updateError) {
          addResult(`❌ Error updating contact: ${updateError.message}`);
        } else {
          addResult('✅ Contact content updated successfully');
        }
      }

      // Update localStorage
      addResult('💾 Updating localStorage...');
      try {
        const storedContact = localStorage.getItem('contactContent');
        if (storedContact) {
          const parsedContact = JSON.parse(storedContact);
          parsedContact.phone = newPhoneNumber;
          localStorage.setItem('contactContent', JSON.stringify(parsedContact));
          addResult('✅ localStorage updated successfully');
        } else {
          // Create new localStorage entry
          const newContact = {
            address: "Piazza della Repubblica, 10100 Torino TO",
            phone: newPhoneNumber,
            email: "Dbrfnc56m31@gmail.com",
            mapUrl: "https://maps.google.com",
            hours: "Lun-Dom: 08:00 - 19:00"
          };
          localStorage.setItem('contactContent', JSON.stringify(newContact));
          addResult('✅ localStorage created with new phone number');
        }
      } catch (localError) {
        addResult(`⚠️ localStorage update failed: ${localError}`);
      }

      // Trigger page refresh event
      addResult('🔄 Triggering content refresh...');
      window.dispatchEvent(new CustomEvent('contactContentUpdated', {
        detail: { phone: newPhoneNumber }
      }));

      addResult('🎉 Phone number update completed successfully!');
      addResult(`📱 New phone number: ${newPhoneNumber}`);
      
      toast({
        title: 'Phone Number Updated! 📞',
        description: `All instances updated to ${newPhoneNumber}`,
      });

    } catch (error) {
      addResult(`❌ Unexpected error: ${error}`);
      toast({
        title: 'Update Failed',
        description: 'An error occurred while updating the phone number',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Phone Number Updater
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Update Phone Number</h4>
          <p className="text-sm text-blue-700 mb-3">
            This will update the phone number to <strong>{newPhoneNumber}</strong> throughout the entire website:
          </p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Contact section display</li>
            <li>• Order page contact information</li>
            <li>• Database settings</li>
            <li>• Local storage cache</li>
          </ul>
        </div>

        <Button
          onClick={updatePhoneNumber}
          disabled={isUpdating}
          className="w-full"
        >
          {isUpdating ? (
            <>
              <Database className="h-4 w-4 mr-2 animate-spin" />
              Updating Phone Number...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Update Phone Number to {newPhoneNumber}
            </>
          )}
        </Button>

        {updateResults.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
            <h4 className="font-medium mb-2">Update Progress:</h4>
            <div className="space-y-1 text-sm font-mono">
              {updateResults.map((result, index) => (
                <div key={index} className="text-gray-700">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhoneNumberUpdater;
