import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Edit, Loader2 } from "lucide-react";
import ImageUploader from "./ImageUploader";
import { useHeroContent } from "@/hooks/use-settings";

interface ContentEditorProps {
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

const ContentEditor = ({ section, onSave, saving }: ContentEditorProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState('');
  const [heroContent, updateHeroContent, isHeroLoading] = useHeroContent();

  // Initialize local content
  useEffect(() => {
    setLocalContent(section.content_value || '');
  }, [section.content_value]);

  // Parse the content value
  let parsedContent;
  try {
    parsedContent = section.content_value ? JSON.parse(section.content_value) : {};
  } catch (e) {
    parsedContent = {};
  }

  const handleSave = async () => {
    try {
      // For hero sections, also update the settings table
      if (section.section_key.includes('hero') && parsedContent.backgroundImage) {
        console.log('🚀 ContentEditor: Updating hero content in settings table');
        await updateHeroContent({
          heading: parsedContent.heading || '',
          subheading: parsedContent.subheading || '',
          backgroundImage: parsedContent.backgroundImage || ''
        });
        console.log('✅ ContentEditor: Hero content updated in settings table');
      }
      
      onSave(section.id, localContent);
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Content updated successfully',
      });
    } catch (error) {
      console.error('ContentEditor: Error saving:', error);
      toast({
        title: 'Error',
        description: 'Failed to update content',
        variant: 'destructive',
      });
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    try {
      const updatedContent = {
        ...parsedContent,
        backgroundImage: imageUrl
      };
      setLocalContent(JSON.stringify(updatedContent, null, 2));
      console.log('🖼️ ContentEditor: Image uploaded, content updated:', updatedContent);
    } catch (e) {
      console.error('Error updating image:', e);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {section.section_name}
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="outline"
            size="sm"
          >
            <Edit className="h-4 w-4 mr-1" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Content (JSON)</label>
              <Textarea
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            
            {section.section_key.includes('hero') && (
              <div>
                <label className="block text-sm font-medium mb-2">Hero Background Image</label>
                <ImageUploader
                  currentImage={parsedContent.backgroundImage}
                  onImageSelected={handleImageUpload}
                  bucketName="uploads"
                  folderPath="hero-images"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a new hero background image. This will update both the content sections and settings tables.
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">Section Key:</span>
              <p className="font-mono text-sm">{section.section_key}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Content Type:</span>
              <p className="text-sm">{section.content_type}</p>
            </div>
            {parsedContent.heading && (
              <div>
                <span className="text-sm text-gray-500">Heading:</span>
                <p className="font-semibold">{parsedContent.heading}</p>
              </div>
            )}
            {parsedContent.subheading && (
              <div>
                <span className="text-sm text-gray-500">Subheading:</span>
                <p className="text-sm">{parsedContent.subheading}</p>
              </div>
            )}
            {parsedContent.backgroundImage && (
              <div>
                <span className="text-sm text-gray-500">Background Image:</span>
                <img 
                  src={parsedContent.backgroundImage} 
                  alt="Background" 
                  className="w-full h-24 object-cover rounded mt-1"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentEditor;
