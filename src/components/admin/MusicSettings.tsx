
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Save, Music, Upload, Play, Square, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import audioService from "@/services/audioService";

interface MusicSettings {
  enabled: boolean;
  songUrl: string;
  songTitle: string;
  autoplay: boolean;
  volume: number;
  customSong: boolean;
}

const defaultSettings: MusicSettings = {
  enabled: true,
  songUrl: "/background-music.mp3",
  songTitle: "Default Music",
  autoplay: true,
  volume: 0.5,
  customSong: false,
};

const MusicSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<MusicSettings>(defaultSettings);
  const [isPlaying, setIsPlaying] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize audio service
  useEffect(() => {
    const initAudio = async () => {
      await audioService.initialize();
      await loadSettings();
      setIsLoading(false);
    };
    
    initAudio();
  }, []);
  
  // Load settings on component mount
  const loadSettings = async () => {
    try {
      const savedSettings = await audioService.getSettings();
      setSettings({ ...defaultSettings, ...savedSettings });
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };
  
  // Track changes
  useEffect(() => {
    if (!isLoading) {
      setHasChanges(true);
    }
  }, [settings, isLoading]);
  
  // Setup polling to keep playing state in sync
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaying(audioService.isPlaying());
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleSaveSettings = async () => {
    try {
      // Convert MusicSettings to Record<string, unknown> to satisfy TypeScript
      const settingsRecord: Record<string, unknown> = {
        enabled: settings.enabled,
        songUrl: settings.songUrl,
        songTitle: settings.songTitle,
        autoplay: settings.autoplay,
        volume: settings.volume,
        customSong: settings.customSong
      };
      
      // Save settings using audio service with the properly typed object
      await audioService.updateSettings(settingsRecord);
      setHasChanges(false);
      
      toast({
        title: "Settings saved",
        description: "Background music settings have been updated",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };
  
  const updateSetting = <K extends keyof MusicSettings>(
    key: K,
    value: MusicSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create a temporary URL for the file
      const objectUrl = URL.createObjectURL(selectedFile);
      updateSetting('songUrl', objectUrl);
      updateSetting('songTitle', selectedFile.name);
      updateSetting('customSong', true);
      
      toast({
        title: "Music uploaded",
        description: "Your custom music has been set",
      });
    }
  };
  
  const resetToDefaultMusic = () => {
    updateSetting('songUrl', defaultSettings.songUrl);
    updateSetting('songTitle', defaultSettings.songTitle);
    updateSetting('customSong', false);
    setFile(null);
    setShowResetDialog(false);
    
    toast({
      title: "Music reset",
      description: "Default music has been restored",
    });
  };
  
  const togglePlay = () => {
    if (isPlaying) {
      audioService.pause();
      setIsPlaying(false);
    } else {
      audioService.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Error playing audio:", err);
        toast({
          title: "Playback error",
          description: "There was an error playing the audio file",
          variant: "destructive",
        });
      });
    }
  };
  
  const handleVolumeChange = (value: number[]) => {
    const volume = value[0] / 100;
    updateSetting('volume', volume);
    audioService.setVolume(volume);
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
        <h2 className="text-2xl font-bold tracking-tight">Background Music Settings</h2>
        <Button 
          onClick={handleSaveSettings} 
          variant="default" 
          className={`flex items-center gap-2 ${hasChanges ? "bg-persian-gold text-persian-navy hover:bg-persian-gold/90" : ""}`}
          disabled={!hasChanges}
        >
          <Save size={16} /> Save Settings
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Background Music</CardTitle>
          <CardDescription>
            Configure background music that plays when visitors view your website
          </CardDescription>
          <div className="flex items-center space-x-2 mt-2">
            <Switch
              id="music-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => updateSetting('enabled', checked)}
            />
            <Label htmlFor="music-enabled">
              {settings.enabled ? "Enabled" : "Disabled"}
            </Label>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Music</Label>
              <div className="flex items-center gap-2 p-3 rounded-md bg-slate-50">
                <Music size={20} className="text-muted-foreground" />
                <span className="font-medium flex-1 truncate">
                  {settings.songTitle}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Square size={16} /> : <Play size={16} />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Upload Custom Music</Label>
              <div className="flex gap-2">
                <Input
                  id="music-upload"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Label 
                  htmlFor="music-upload" 
                  className="flex items-center gap-2 p-2 border border-dashed rounded-md text-sm text-muted-foreground hover:bg-slate-50 cursor-pointer flex-1 justify-center"
                >
                  <Upload size={16} />
                  Choose audio file
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: MP3, WAV, OGG (max 10MB)
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Playback Options</h3>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="autoplay"
                checked={settings.autoplay}
                onCheckedChange={(checked) => updateSetting('autoplay', checked)}
              />
              <Label htmlFor="autoplay">Autoplay music when page loads</Label>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Default Volume</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
              <Slider
                value={[settings.volume * 100]}
                min={0}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
              />
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-md text-sm text-slate-700 border border-slate-200">
            <p className="mb-2">Note: Autoplay might be blocked by some browsers unless the user has interacted with the page first.</p>
            <p>This music player will not play automatically in the admin panel.</p>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-between">
          <Button 
            variant="outline" 
            className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
            onClick={() => setShowResetDialog(true)}
          >
            <Trash2 size={16} className="mr-2" /> Remove Custom Music
          </Button>
        </CardFooter>
      </Card>
      
      {/* Alert dialog for resetting music */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Default Music?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your custom music and restore the default background music.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={resetToDefaultMusic}>
              Reset to Default
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MusicSettings;
