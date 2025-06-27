import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  Upload, 
  Play, 
  Pause, 
  Volume2, 
  Trash2, 
  Check, 
  Music,
  FileAudio,
  Loader2
} from 'lucide-react';

interface NotificationSound {
  id: string;
  name: string;
  file_path?: string;
  file_url?: string;
  sound_type: 'built-in' | 'custom';
  is_active: boolean;
  created_at: string;
}

export default function SoundManager() {
  const [sounds, setSounds] = useState<NotificationSound[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [soundName, setSoundName] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSounds();
  }, []);

  const loadSounds = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_sounds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSounds(data || []);
    } catch (error) {
      console.error('Error loading sounds:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i suoni',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/webm'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Formato Non Supportato',
          description: 'Supportati: MP3, WAV, OGG, WebM',
          variant: 'destructive'
        });
        return;
      }

      // Validate file size (1MB max for base64 storage)
      if (file.size > 1 * 1024 * 1024) {
        toast({
          title: 'File Troppo Grande',
          description: 'Dimensione massima: 1MB per compatibilità database',
          variant: 'destructive'
        });
        return;
      }

      setSelectedFile(file);
      setSoundName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const uploadSound = async () => {
    if (!selectedFile || !soundName.trim()) {
      toast({
        title: 'Dati Mancanti',
        description: 'Seleziona un file e inserisci un nome',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64 for storage in database
      const base64Data = await fileToBase64(selectedFile);

      // Check base64 size (should be roughly 1.33x original file size)
      const base64Size = base64Data.length;
      console.log(`Base64 size: ${(base64Size / 1024 / 1024).toFixed(2)}MB`);

      // Save to database with base64 data
      const { error: dbError } = await supabase
        .from('notification_sounds')
        .insert({
          name: soundName.trim(),
          file_path: `base64:${selectedFile.name}`,
          file_url: base64Data,
          sound_type: 'custom',
          is_active: false
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(dbError.message || 'Database insertion failed');
      }

      toast({
        title: '✅ Suono Caricato',
        description: `"${soundName}" caricato con successo`,
      });

      // Reset form
      setSelectedFile(null);
      setSoundName('');
      const fileInput = document.getElementById('sound-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Reload sounds
      loadSounds();
    } catch (error) {
      console.error('Error uploading sound:', error);

      let errorMessage = 'Errore sconosciuto';
      if (error.message) {
        if (error.message.includes('too long')) {
          errorMessage = 'File troppo grande per il database. Prova con un file più piccolo (max 1MB).';
        } else if (error.message.includes('character varying')) {
          errorMessage = 'Formato file non supportato o troppo grande.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: 'Errore Caricamento',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const playSound = async (sound: NotificationSound) => {
    try {
      if (playingSound === sound.id) {
        // Stop current sound
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setPlayingSound(null);
        return;
      }

      // Stop any currently playing sound
      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (sound.sound_type === 'built-in') {
        // Play built-in sound (use the existing audio system)
        playBuiltInSound(sound.name);
      } else if (sound.file_url) {
        // Play custom uploaded sound (base64 data)
        const audio = new Audio(sound.file_url);
        audioRef.current = audio;

        audio.onended = () => setPlayingSound(null);
        audio.onerror = () => {
          setPlayingSound(null);
          toast({
            title: 'Errore Riproduzione',
            description: 'Impossibile riprodurre il suono',
            variant: 'destructive'
          });
        };

        await audio.play();
        setPlayingSound(sound.id);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
      setPlayingSound(null);
    }
  };

  const playBuiltInSound = (soundName: string) => {
    // This will be connected to the existing audio system
    setPlayingSound('built-in-preview');
    
    // Simulate built-in sound preview
    setTimeout(() => {
      setPlayingSound(null);
    }, 3000);
  };

  const setActiveSound = async (soundId: string) => {
    try {
      // Deactivate all sounds
      await supabase
        .from('notification_sounds')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Activate selected sound
      await supabase
        .from('notification_sounds')
        .update({ is_active: true })
        .eq('id', soundId);

      toast({
        title: '✅ Suono Attivato',
        description: 'Suono di notifica aggiornato',
      });

      // Refresh the audio notifier
      if ((window as any).audioNotifier) {
        (window as any).audioNotifier.refreshActiveSound();
      }

      loadSounds();
    } catch (error) {
      console.error('Error setting active sound:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile attivare il suono',
        variant: 'destructive'
      });
    }
  };

  const deleteSound = async (sound: NotificationSound) => {
    if (sound.sound_type === 'built-in') {
      toast({
        title: 'Non Consentito',
        description: 'Non puoi eliminare i suoni predefiniti',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Delete from database (no need to delete from storage since we use base64)
      await supabase
        .from('notification_sounds')
        .delete()
        .eq('id', sound.id);

      toast({
        title: '✅ Suono Eliminato',
        description: `"${sound.name}" eliminato`,
      });

      loadSounds();
    } catch (error) {
      console.error('Error deleting sound:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare il suono',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card className="border-emerald-200">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-gray-600">Caricamento suoni...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="border-emerald-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-amber-50 border-b border-emerald-200">
          <CardTitle className="flex items-center gap-3 text-gray-800">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Upload className="h-5 w-5 text-emerald-700" />
            </div>
            Carica Nuovo Suono di Notifica
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sound-file" className="text-gray-700 font-medium">
                File Audio (MP3, WAV, OGG, WebM - Max 1MB)
              </Label>
              <Input
                id="sound-file"
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="border-gray-300 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sound-name" className="text-gray-700 font-medium">
                Nome Suono
              </Label>
              <Input
                id="sound-name"
                value={soundName}
                onChange={(e) => setSoundName(e.target.value)}
                placeholder="Es: Campanello Personalizzato"
                className="border-gray-300 focus:border-emerald-500"
              />
            </div>
          </div>
          
          <Button
            onClick={uploadSound}
            disabled={!selectedFile || !soundName.trim() || uploading}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Caricamento...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Carica Suono
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Sounds List */}
      <Card className="border-emerald-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-amber-50 border-b border-emerald-200">
          <CardTitle className="flex items-center gap-3 text-gray-800">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Music className="h-5 w-5 text-emerald-700" />
            </div>
            Suoni Disponibili
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {sounds.map((sound) => (
              <div
                key={sound.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  sound.is_active 
                    ? 'border-emerald-300 bg-emerald-50' 
                    : 'border-gray-200 bg-white hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {sound.sound_type === 'built-in' ? (
                      <Volume2 className="h-4 w-4 text-gray-600" />
                    ) : (
                      <FileAudio className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{sound.name}</span>
                      {sound.is_active && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                          <Check className="w-3 h-3 mr-1" />
                          Attivo
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {sound.sound_type === 'built-in' ? 'Predefinito' : 'Personalizzato'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => playSound(sound)}
                    variant="outline"
                    size="sm"
                    className="border-gray-300"
                  >
                    {playingSound === sound.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>

                  {!sound.is_active && (
                    <Button
                      onClick={() => setActiveSound(sound.id)}
                      variant="outline"
                      size="sm"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      Attiva
                    </Button>
                  )}

                  {sound.sound_type === 'custom' && (
                    <Button
                      onClick={() => deleteSound(sound)}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
