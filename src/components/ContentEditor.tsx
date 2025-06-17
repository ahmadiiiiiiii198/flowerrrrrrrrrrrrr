
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Image as ImageIcon, Type, FileText, List } from 'lucide-react';
import ImageUpload from './ImageUpload';

interface ContentSection {
  id: string;
  section_key: string;
  section_name: string;
  content_type: string;
  content_value: string | null;
  metadata: any;
  is_active: boolean;
}

interface ContentEditorProps {
  section: ContentSection;
  onSave: (id: string, value: string) => void;
  saving: boolean;
}

const ContentEditor = ({ section, onSave, saving }: ContentEditorProps) => {
  const [value, setValue] = useState(section.content_value || '');

  const handleSave = () => {
    onSave(section.id, value);
  };

  const getIcon = () => {
    switch (section.content_type) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'textarea': return <FileText className="w-4 h-4" />;
      case 'json': return <List className="w-4 h-4" />;
      default: return <Type className="w-4 h-4" />;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getIcon()}
          {section.section_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {section.content_type === 'image' ? (
          <ImageUpload
            currentValue={value}
            onUpload={setValue}
          />
        ) : section.content_type === 'textarea' ? (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            className="min-h-[100px]"
          />
        ) : section.content_type === 'json' ? (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={6}
            className="min-h-[150px] font-mono text-sm"
            placeholder="JSON array format: [&quot;item1&quot;, &quot;item2&quot;, &quot;item3&quot;]"
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full"
          />
        )}
        
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ContentEditor;
