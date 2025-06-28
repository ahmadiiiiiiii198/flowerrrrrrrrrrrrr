import React, { useEffect, useState } from "react";
import { Music, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import audioService from "@/services/audioService";

interface BackgroundMusicProps {
  className?: string;
}

const BackgroundMusic: React.FC<BackgroundMusicProps> = ({ className }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.5);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Check if we're on admin page
  useEffect(() => {
    const path = window.location.pathname;
    setIsAdmin(path.includes('/admin'));
  }, []);
  
  // Initialize audio service and check user interaction
  useEffect(() => {
    const initAudio = async () => {
      // Initialize audio service
      await audioService.initialize();
      
      // Set initial volume from saved settings
      const settings = await audioService.getSettings();
      setVolume(settings.volume || 1.0); // DEFAULT TO MAXIMUM VOLUME
      
      // Check if user has interacted with the page
      const hasInteractedWithPage = sessionStorage.getItem('hasInteractedWithPage') === 'true';
      setHasInteracted(hasInteractedWithPage);
      
      setIsLoading(false);
      
      // Determine if we should be playing
      const shouldPlay = !isAdmin && settings.enabled && settings.autoplay && hasInteractedWithPage;
      if (shouldPlay) {
        attemptAutoplay();
      }
    };
    
    initAudio();
    
    // Setup event listener for user interaction
    const handleFirstInteraction = () => {
      setHasInteracted(true);
      sessionStorage.setItem('hasInteractedWithPage', 'true');
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
    
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [isAdmin]);
  
  // Setup listeners for settings changes
  useEffect(() => {
    const handleSettingsChange = async () => {
      const settings = await audioService.getSettings();
      setVolume(settings.volume);
      
      // Update playing state if needed (but don't auto-play in admin)
      if (!isAdmin && settings.enabled && settings.autoplay && hasInteracted) {
        attemptAutoplay();
      } else if (!settings.enabled || !settings.autoplay) {
        audioService.pause();
        setIsPlaying(false);
      }
    };
    
    window.addEventListener('localStorageUpdated', handleSettingsChange);
    
    return () => {
      window.removeEventListener('localStorageUpdated', handleSettingsChange);
    };
  }, [isAdmin, hasInteracted]);
  
  // Setup polling to keep playing state in sync with actual audio state
  useEffect(() => {
    const interval = setInterval(() => {
      const actuallyPlaying = audioService.isPlaying();
      if (isPlaying !== actuallyPlaying) {
        setIsPlaying(actuallyPlaying);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying]);
  
  const attemptAutoplay = () => {
    audioService.play().then(() => {
      setIsPlaying(true);
    }).catch(err => {
      console.warn('Autoplay prevented:', err.message);
      // Don't update state - the browser might allow playback later
    });
  };
  
  const togglePlay = () => {
    // If we're turning music on and on admin page, show toast
    if (!isPlaying && isAdmin) {
      toast({
        title: "Music in Admin Panel",
        description: "Music is being previewed in the admin panel. It won't autoplay for site visitors.",
      });
    }
    
    if (isPlaying) {
      audioService.pause();
      setIsPlaying(false);
    } else {
      // If we haven't interacted yet, mark as interacted
      if (!hasInteracted) {
        setHasInteracted(true);
        sessionStorage.setItem('hasInteractedWithPage', 'true');
      }
      
      audioService.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Error playing audio:', err);
        toast({
          title: "Playback Error",
          description: "Could not play audio. Click anywhere on the page first.",
          variant: "destructive"
        });
      });
    }
  };
  
  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    audioService.setMuted(newMutedState);
  };
  
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    audioService.setVolume(newVolume);
  };
  
  if (isLoading) {
    return null; // Don't render anything while loading
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button 
        onClick={togglePlay} 
        variant="outline" 
        size="icon" 
        className="h-8 w-8 bg-persian-gold/10 border-persian-gold/30 text-white hover:bg-persian-gold/30"
        aria-label={isPlaying ? "Pause music" : "Play music"}
      >
        <Music size={14} className="text-persian-gold" />
      </Button>
      
      <div className="hidden md:flex items-center gap-2 bg-persian-navy/80 p-1 pl-2 pr-3 rounded-full">
        <Button 
          onClick={toggleMute} 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-persian-gold hover:bg-persian-gold/20 hover:text-persian-gold"
          aria-label={isMuted ? "Unmute music" : "Mute music"}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </Button>
        
        <Slider
          value={[volume * 100]}
          min={0}
          max={100}
          step={1}
          onValueChange={handleVolumeChange}
          className="w-20"
        />
      </div>
    </div>
  );
};

export default BackgroundMusic;
