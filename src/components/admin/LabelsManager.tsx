import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Tag } from 'lucide-react';

interface LabelsManagerProps {
  labels: string[];
  onChange: (labels: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const LabelsManager: React.FC<LabelsManagerProps> = ({
  labels,
  onChange,
  placeholder = "Add a label (e.g., lauree, matrimoni, compleanno)",
  disabled = false
}) => {
  const [newLabel, setNewLabel] = useState('');

  const addLabel = () => {
    const trimmedLabel = newLabel.trim();
    if (trimmedLabel && !labels.includes(trimmedLabel)) {
      onChange([...labels, trimmedLabel]);
      setNewLabel('');
    }
  };

  const removeLabel = (labelToRemove: string) => {
    onChange(labels.filter(label => label !== labelToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addLabel();
    }
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Tag className="w-4 h-4" />
        Labels/Tags
      </Label>
      
      {/* Display existing labels */}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {labels.map((label, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {label}
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                  onClick={() => removeLabel(label)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Add new label */}
      {!disabled && (
        <div className="flex gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={addLabel}
            disabled={!newLabel.trim() || labels.includes(newLabel.trim())}
            size="sm"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {labels.length === 0 && (
        <p className="text-sm text-gray-500">
          No labels added yet. Labels help categorize and organize your items.
        </p>
      )}
    </div>
  );
};

export default LabelsManager;
