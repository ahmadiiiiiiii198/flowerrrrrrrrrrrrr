import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash, Save, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import ImageUploader from "./ImageUploader";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

interface PopupData {
  id: string;
  title: string;
  content: string;
  image?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

const PopupManager = () => {
  const { toast } = useToast();
  const [popups, setPopups] = useState<PopupData[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Load popups from Supabase on component mount, with fallback to localStorage
  useEffect(() => {
    const loadPopups = async () => {
      setIsLoading(true);
      try {
        // Try to get popups from Supabase
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'popups')
          .maybeSingle();
        
        if (data && !error && data.value) {
          // Use proper type assertion to convert the JSON data to PopupData[]
          const popupsValue = data.value as unknown;
          const popupsArray = Array.isArray(popupsValue) ? popupsValue as PopupData[] : [];
          setPopups(popupsArray);
          console.log("Loaded popups from Supabase:", popupsArray);
        } else {
          // Fall back to localStorage
          const savedPopups = localStorage.getItem('popups');
          if (savedPopups) {
            try {
              const parsedPopups = JSON.parse(savedPopups) as PopupData[];
              setPopups(parsedPopups);
              console.log("Loaded popups from localStorage");
              
              // If we loaded from localStorage, upload to Supabase for future use
              await saveToSupabase(parsedPopups);
            } catch (e) {
              console.error('Error parsing popups:', e);
              setPopups([]);
            }
          } else {
            setPopups([]);
          }
        }
      } catch (e) {
        console.error('Error loading popups from Supabase:', e);
        
        // Fall back to localStorage
        const savedPopups = localStorage.getItem('popups');
        if (savedPopups) {
          try {
            const parsedPopups = JSON.parse(savedPopups) as PopupData[];
            setPopups(parsedPopups);
          } catch (e) {
            console.error('Error parsing popups:', e);
            setPopups([]);
          }
        } else {
          setPopups([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPopups();
  }, []);

  // Save popups to Supabase
  const saveToSupabase = async (popupsData: PopupData[]) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          key: 'popups', 
          value: popupsData as unknown as Json // Proper type casting for Supabase
        }, {
          onConflict: 'key',
          ignoreDuplicates: false
        });
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error("Error saving to Supabase:", error);
      return false;
    }
  };
  
  // Function to validate date range
  const validateDateRange = (startDate?: string, endDate?: string): boolean => {
    if (!startDate || !endDate) return true;
    return new Date(startDate) <= new Date(endDate);
  };
  
  const addNewPopup = () => {
    const newPopup: PopupData = {
      id: `popup-${Date.now()}`,
      title: "New Popup",
      content: "Enter your popup content here",
      isActive: false,
    };
    
    setPopups([...popups, newPopup]);
    setHasUnsavedChanges(true);
    toast({
      title: "New popup created",
      description: "Configure and activate it when ready",
    });
  };
  
  const updatePopup = (id: string, field: keyof PopupData, value: any) => {
    setPopups(popups.map(popup => 
      popup.id === id ? { ...popup, [field]: value } : popup
    ));
    setHasUnsavedChanges(true);
  };
  
  const deletePopup = (id: string) => {
    setPopups(popups.filter(popup => popup.id !== id));
    setHasUnsavedChanges(true);
    toast({
      title: "Popup deleted",
      description: "The popup has been removed",
    });
  };
  
  const handleImageUpload = (popupId: string, imageUrl: string) => {
    updatePopup(popupId, 'image', imageUrl);
    toast({
      title: "Image added",
      description: "The image has been added to the popup",
    });
  };
  
  const savePopups = async () => {
    // Check for invalid date ranges
    const invalidPopup = popups.find(popup => 
      !validateDateRange(popup.startDate, popup.endDate)
    );
    
    if (invalidPopup) {
      toast({
        title: "Invalid date range",
        description: `End date must be after start date for "${invalidPopup.title}"`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Save to Supabase
      const success = await saveToSupabase(popups);
      
      // Also save to localStorage as fallback
      localStorage.setItem('popups', JSON.stringify(popups));
      
      setHasUnsavedChanges(false);
      toast({
        title: success ? "Popups saved" : "Popups saved locally",
        description: success 
          ? "Your popup settings have been saved" 
          : "Your popup settings have been saved to browser storage. Will sync when connection is restored.",
      });
      
      // Trigger storage event so WebsitePopup can react to changes
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('localStorageUpdated'));
    } catch (error) {
      console.error("Error saving popups:", error);
      
      // Save to localStorage as fallback
      localStorage.setItem('popups', JSON.stringify(popups));
      
      setHasUnsavedChanges(false);
      toast({
        title: "Popups saved locally",
        description: "Your popup settings have been saved to browser storage. Will sync when connection is restored.",
      });
      
      // Trigger storage event so WebsitePopup can react to changes
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('localStorageUpdated'));
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-persian-gold"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Popup Management</h2>
        <div className="flex gap-2">
          <Button onClick={addNewPopup} className="flex items-center gap-2">
            <Plus size={16} /> Add New Popup
          </Button>
          <Button 
            onClick={savePopups} 
            variant={hasUnsavedChanges ? "default" : "outline"} 
            className={`flex items-center gap-2 ${hasUnsavedChanges ? "bg-persian-gold text-persian-navy hover:bg-persian-gold/90" : ""}`}
          >
            <Save size={16} /> Save Changes
          </Button>
        </div>
      </div>
      
      {hasUnsavedChanges && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md flex items-center gap-2">
          <AlertCircle size={16} />
          <span>You have unsaved changes. Click "Save Changes" to apply them.</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6">
        {popups.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No popups created yet. Click "Add New Popup" to create one.
            </CardContent>
          </Card>
        ) : (
          popups.map(popup => (
            <Card key={popup.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-xl font-semibold">
                    <Input
                      value={popup.title}
                      onChange={(e) => updatePopup(popup.id, 'title', e.target.value)}
                      className="font-semibold text-xl px-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 pt-1">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`active-${popup.id}`}
                        checked={popup.isActive}
                        onCheckedChange={(checked) => updatePopup(popup.id, 'isActive', checked)}
                      />
                      <Label htmlFor={`active-${popup.id}`}>
                        {popup.isActive ? "Active" : "Inactive"}
                      </Label>
                    </div>
                  </CardDescription>
                </div>
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={() => deletePopup(popup.id)}
                >
                  <Trash size={16} />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={popup.content}
                    onChange={(e) => updatePopup(popup.id, 'content', e.target.value)}
                    rows={4}
                    placeholder="Enter popup content here..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Display Period (Optional)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Start Date</Label>
                      <Input
                        type="date"
                        value={popup.startDate || ""}
                        onChange={(e) => updatePopup(popup.id, 'startDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End Date</Label>
                      <Input
                        type="date"
                        value={popup.endDate || ""}
                        onChange={(e) => updatePopup(popup.id, 'endDate', e.target.value)}
                        className={popup.startDate && popup.endDate && !validateDateRange(popup.startDate, popup.endDate) ? "border-red-500" : ""}
                      />
                      {popup.startDate && popup.endDate && !validateDateRange(popup.startDate, popup.endDate) && (
                        <p className="text-xs text-red-500 mt-1">End date must be after start date</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Popup Image (Optional)</Label>
                  <div className="border rounded-md p-4">
                    {popup.image ? (
                      <div className="relative">
                        <img 
                          src={popup.image} 
                          alt="Popup" 
                          className="max-h-48 rounded-md mx-auto"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => updatePopup(popup.id, 'image', undefined)}
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    ) : (
                      <ImageUploader 
                        onImageSelected={(imageUrl) => handleImageUpload(popup.id, imageUrl)}
                        buttonLabel="Add Image"
                        className="w-full"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  Last modified: {new Date().toLocaleDateString()}
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PopupManager;
