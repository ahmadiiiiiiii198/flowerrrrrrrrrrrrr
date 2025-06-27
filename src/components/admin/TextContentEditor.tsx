import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Edit, Loader2, FileText } from "lucide-react";

interface TextContentEditorProps {
  section: {
    id: string;
    section_key: string;
    section_name: string;
    content_type: string;
    content_value: string | null;
    metadata: any;
    is_active: boolean;
  };
  onSave: (id: string, value: string) => void;
  saving: boolean;
}

const TextContentEditor = ({ section, onSave, saving }: TextContentEditorProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [textContent, setTextContent] = useState('');

  // Extract text from JSON content or use as plain text
  useEffect(() => {
    let extractedText = '';
    
    if (section.content_value) {
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(section.content_value);
        if (parsed.text) {
          extractedText = parsed.text;
        } else if (typeof parsed === 'string') {
          extractedText = parsed;
        } else {
          extractedText = section.content_value;
        }
      } catch (e) {
        // If not JSON, use as plain text
        extractedText = section.content_value;
      }
    }
    
    setTextContent(extractedText);
  }, [section.content_value]);

  const handleSave = async () => {
    try {
      // Save as JSON with text property for consistency
      const jsonContent = JSON.stringify({ text: textContent });
      onSave(section.id, jsonContent);
      setIsEditing(false);
      
      toast({
        title: 'Contenuto Salvato',
        description: 'Il contenuto è stato aggiornato con successo',
      });
    } catch (error) {
      console.error('TextContentEditor: Error saving:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile salvare il contenuto',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    // Reset to original content
    let originalText = '';
    if (section.content_value) {
      try {
        const parsed = JSON.parse(section.content_value);
        originalText = parsed.text || section.content_value;
      } catch (e) {
        originalText = section.content_value;
      }
    }
    setTextContent(originalText);
    setIsEditing(false);
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm border border-cyan-200 shadow-lg hover:shadow-cyan-200/50 transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-100">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <FileText className="w-5 h-5 text-cyan-600" />
            </div>
            <span className="text-cyan-800 font-semibold">{section.section_name}</span>
          </div>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="outline"
            size="sm"
            className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
          >
            <Edit className="h-4 w-4 mr-1" />
            {isEditing ? 'Annulla' : 'Modifica'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenuto Testo
              </label>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={6}
                className="w-full border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                placeholder="Inserisci il contenuto del testo qui..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Scrivi il contenuto per questa sezione. Supporta testo semplice e formattazione di base.
              </p>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salva Contenuto
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleCancel}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Annulla
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Contenuto Attuale:</h4>
              <div className="text-gray-800 leading-relaxed">
                {textContent ? (
                  <p className="whitespace-pre-wrap">{textContent}</p>
                ) : (
                  <p className="text-gray-500 italic">Nessun contenuto disponibile. Clicca "Modifica" per aggiungere contenuto.</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${section.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{section.is_active ? 'Attivo' : 'Inattivo'}</span>
              </div>
              <span>•</span>
              <span>Tipo: {section.content_type}</span>
              <span>•</span>
              <span>ID: {section.section_key}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TextContentEditor;
