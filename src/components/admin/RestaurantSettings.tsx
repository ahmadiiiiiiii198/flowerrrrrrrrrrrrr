
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getSetting, upsertSetting } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface RestaurantSettingsState {
  totalSeats: number;
  reservationDuration: number; 
  openingTime: string;
  closingTime: string;
  languages: string[];
  defaultLanguage: string;
}

interface AdminCredentials {
  username: string;
  password: string;
}

const RestaurantSettings = () => {
  const { toast } = useToast();
  const { updateCredentials } = useAdminAuth();
  
  const [settings, setSettings] = useState<RestaurantSettingsState>({
    totalSeats: 50,
    reservationDuration: 120,
    openingTime: "11:30",
    closingTime: "22:00",
    languages: ["it", "en", "ar", "fa"],
    defaultLanguage: "it"
  });
  
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>({
    username: "admin",
    password: ""
  });
  
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load restaurant settings
        const data = await getSetting("restaurantSettings") as RestaurantSettingsState | null;
        if (data) {
          setSettings({
            totalSeats: Number(data.totalSeats) || 50,
            reservationDuration: Number(data.reservationDuration) || 120,
            openingTime: data.openingTime || "11:30",
            closingTime: data.closingTime || "22:00",
            languages: Array.isArray(data.languages) ? data.languages : ["it", "en", "ar", "fa"],
            defaultLanguage: data.defaultLanguage || "it"
          });
        }
        
        // Load admin credentials
        const adminData = await getSetting("adminCredentials") as AdminCredentials | null;
        if (adminData) {
          setAdminCredentials({
            username: adminData.username || "admin",
            password: "" // Don't show actual password for security
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };
    
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      await upsertSetting("restaurantSettings", settings);
      
      // Store settings in localStorage for faster access
      localStorage.setItem("restaurantSettings", JSON.stringify(settings));
      
      toast({
        title: "Settings saved",
        description: "Restaurant settings have been updated successfully"
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Save failed",
        description: "Could not save restaurant settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSaveAdminCredentials = async () => {
    setIsSaving(true);
    
    try {
      const success = await updateCredentials(
        adminCredentials.username, 
        adminCredentials.password
      );
      
      if (success) {
        setAdminCredentials({
          ...adminCredentials,
          password: "" // Clear password field after successful update
        });
      }
    } catch (error) {
      console.error("Error saving admin credentials:", error);
      toast({
        title: "Save failed",
        description: "Could not update admin credentials",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-playfair font-bold text-persian-navy">Restaurant Settings</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totalSeats">Total Available Seats</Label>
              <Input
                id="totalSeats"
                type="number"
                value={settings.totalSeats}
                onChange={(e) => setSettings({ ...settings, totalSeats: parseInt(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reservationDuration">Reservation Duration (minutes)</Label>
              <Input
                id="reservationDuration"
                type="number"
                value={settings.reservationDuration}
                onChange={(e) => setSettings({ ...settings, reservationDuration: parseInt(e.target.value) })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openingTime">Opening Time</Label>
                <Input
                  id="openingTime"
                  type="time"
                  value={settings.openingTime}
                  onChange={(e) => setSettings({ ...settings, openingTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingTime">Closing Time</Label>
                <Input
                  id="closingTime"
                  type="time"
                  value={settings.closingTime}
                  onChange={(e) => setSettings({ ...settings, closingTime: e.target.value })}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleSaveSettings} 
              className="w-full" 
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Language & Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultLanguage">Default Language</Label>
              <Select
                value={settings.defaultLanguage}
                onValueChange={(value) => setSettings({ ...settings, defaultLanguage: value })}
              >
                <SelectTrigger id="defaultLanguage">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {settings.languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang === "it" ? "Italian" :
                        lang === "en" ? "English" :
                        lang === "fr" ? "French" :
                        lang === "ar" ? "Arabic" :
                        lang === "fa" ? "Farsi" :
                        lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-semibold mb-3">Admin Credentials</h3>
              <div className="space-y-2">
                <Label htmlFor="adminUsername">Username</Label>
                <Input
                  id="adminUsername"
                  value={adminCredentials.username}
                  onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
                />
              </div>
              <div className="space-y-2 mt-2">
                <Label htmlFor="adminPassword">New Password</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={adminCredentials.password}
                  onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                />
              </div>
              
              <Button 
                onClick={handleSaveAdminCredentials} 
                className={cn("w-full mt-4", adminCredentials.password ? "bg-persian-gold hover:bg-persian-gold/90" : "")}
                disabled={isSaving || !adminCredentials.username || !adminCredentials.password}
              >
                {isSaving ? "Updating..." : "Update Credentials"}
              </Button>
              
              <p className="text-sm text-gray-500 mt-2">
                Note: Default credentials are username: "admin", password: "persian123"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RestaurantSettings;
