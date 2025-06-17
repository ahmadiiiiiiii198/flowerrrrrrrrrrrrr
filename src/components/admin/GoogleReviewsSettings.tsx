
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save, MapPin } from "lucide-react";

interface GoogleReviewsSettings {
  isEnabled: boolean;
  apiKey: string;
  placeId: string;
  maxReviews: number;
  minRating: number;
  showGoogleReviews: boolean;
  showSiteReviews: boolean;
}

const defaultSettings: GoogleReviewsSettings = {
  isEnabled: false,
  apiKey: "",
  placeId: "",
  maxReviews: 5,
  minRating: 4,
  showGoogleReviews: true,
  showSiteReviews: true,
};

const GoogleReviewsSettings = () => {
  const [settings, setSettings] = useState<GoogleReviewsSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  
  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('googleReviewsSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (e) {
        console.error('Error parsing Google reviews settings:', e);
      }
    }
  }, []);
  
  const handleSaveSettings = () => {
    setIsSaving(true);
    
    try {
      // Save settings to localStorage
      localStorage.setItem('googleReviewsSettings', JSON.stringify(settings));
      
      setTimeout(() => {
        setIsSaving(false);
        toast({
          title: "Settings saved",
          description: "Google Reviews settings have been updated",
        });
      }, 500);
    } catch (error) {
      console.error('Error saving Google reviews settings:', error);
      setIsSaving(false);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const updateSetting = <K extends keyof GoogleReviewsSettings>(
    key: K,
    value: GoogleReviewsSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  return (
    <div className="space-y-6 max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Google Reviews Settings</h2>
        <Button 
          onClick={handleSaveSettings} 
          variant="default" 
          className="flex items-center gap-2"
          disabled={isSaving}
        >
          <Save size={16} /> {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Google Reviews Integration</CardTitle>
          <CardDescription>
            Configure how Google reviews are displayed on your website
          </CardDescription>
          <div className="flex items-center space-x-2 mt-2">
            <Switch
              id="google-reviews-enabled"
              checked={settings.isEnabled}
              onCheckedChange={(checked) => updateSetting('isEnabled', checked)}
            />
            <Label htmlFor="google-reviews-enabled">
              {settings.isEnabled ? "Enabled" : "Disabled"}
            </Label>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="google-api-key">Google Maps API Key</Label>
            <Input
              id="google-api-key"
              value={settings.apiKey}
              onChange={(e) => updateSetting('apiKey', e.target.value)}
              placeholder="Enter your Google Maps API Key"
              type="password"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              You need a Google Maps API key with Places API enabled
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="place-id">Google Place ID</Label>
            <Input
              id="place-id"
              value={settings.placeId}
              onChange={(e) => updateSetting('placeId', e.target.value)}
              placeholder="Enter your Google Place ID"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground break-words">
              You can find your Place ID using the{" "}
              <a 
                href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Place ID Finder
              </a>
            </p>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="max-reviews">Maximum Number of Reviews</Label>
              <Input
                id="max-reviews"
                type="number"
                min={1}
                max={20}
                value={settings.maxReviews}
                onChange={(e) => updateSetting('maxReviews', parseInt(e.target.value) || 5)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="min-rating">Minimum Rating to Display</Label>
              <Input
                id="min-rating"
                type="number"
                min={1}
                max={5}
                step={1}
                value={settings.minRating}
                onChange={(e) => updateSetting('minRating', parseInt(e.target.value) || 4)}
                className="w-full"
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Display Options</h3>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="show-google-reviews"
                checked={settings.showGoogleReviews}
                onCheckedChange={(checked) => updateSetting('showGoogleReviews', checked)}
              />
              <Label htmlFor="show-google-reviews">Show Google Reviews</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="show-site-reviews"
                checked={settings.showSiteReviews}
                onCheckedChange={(checked) => updateSetting('showSiteReviews', checked)}
              />
              <Label htmlFor="show-site-reviews">Show Website Reviews</Label>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md flex gap-3 text-blue-700 border border-blue-200">
            <MapPin size={20} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">
                The Google Places API requires a valid API key and may incur charges based on your usage.
                Make sure you have billing set up in your Google Cloud account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleReviewsSettings;
