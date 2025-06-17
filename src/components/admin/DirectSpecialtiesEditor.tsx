import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Trash, Plus, Save, GripVertical, Loader2, Home, RefreshCw } from 'lucide-react';
import ImageUploader from './ImageUploader';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { defaultSpecialties } from '@/lib/direct-supabase';
import { SettingsManager } from '@/lib/settings-manager';

// Define types
interface Specialty {
  id: string;
  title: string;
  description: string;
  image?: string;
  price: string;
}

interface SpecialtiesContent {
  heading: string;
  subheading: string;
  specialties: Specialty[];
  backgroundImage?: string;
}

const DirectSpecialtiesEditor: React.FC = () => {
  const { toast } = useToast();
  const [content, setContent] = useState<SpecialtiesContent>(defaultSpecialties);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<string>("");
  
  // Load data directly from Supabase using SettingsManager
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const fetchedContent = await SettingsManager.getSetting<SpecialtiesContent>("specialtiesContent");
      const now = new Date();
      setLastFetchTime(now.toLocaleTimeString());

      if (fetchedContent && fetchedContent.heading && fetchedContent.subheading && Array.isArray(fetchedContent.specialties)) {
        setContent(fetchedContent);
        setHasChanges(false);
      } else {
        setError("No specialties data found or data structure invalid");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load specialties");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load on mount
  useEffect(() => {
    console.log("[ADMIN DIRECT] Component mounted, loading data");
    loadData();
  }, []);
  
  // Handlers for editing
  const updateHeading = (newHeading: string) => {
    setContent({ ...content, heading: newHeading });
    setHasChanges(true);
  };

  const updateSubheading = (newSubheading: string) => {
    setContent({ ...content, subheading: newSubheading });
    setHasChanges(true);
  };
  
  const updateBackgroundImage = (imageUrl: string) => {
    setContent({ ...content, backgroundImage: imageUrl });
    setHasChanges(true);
    console.log("[ADMIN DIRECT] Updated background image:", imageUrl);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(content.specialties);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setContent({ ...content, specialties: items });
    setHasChanges(true);
  };

  const addSpecialty = () => {
    const newSpecialty: Specialty = {
      id: Date.now().toString(),
      title: 'New Specialty',
      description: 'Description of the new specialty',
      price: '€0.00',
    };

    setContent({ ...content, specialties: [...content.specialties, newSpecialty] });
    setHasChanges(true);
  };

  const updateSpecialty = (id: string, field: string, value: string) => {
    const updatedSpecialties = content.specialties.map((specialty) =>
      specialty.id === id ? { ...specialty, [field]: value } : specialty
    );

    setContent({ ...content, specialties: updatedSpecialties });
    setHasChanges(true);
  };

  const handleImageUpload = (specialtyId: string, imageUrl: string) => {
    console.log(`[ADMIN DIRECT] Image uploaded for specialty ${specialtyId}:`, imageUrl);
    
    // Immediately update the specialty
    updateSpecialty(specialtyId, 'image', imageUrl);
    
    toast({
      title: 'Image updated',
      description: 'Image has been successfully assigned to the specialty',
    });
  };

  const deleteSpecialty = (id: string) => {
    const updatedSpecialties = content.specialties.filter(
      (specialty) => specialty.id !== id
    );

    setContent({ ...content, specialties: updatedSpecialties });
    setHasChanges(true);
    
    toast({
      title: 'Specialty deleted',
      description: 'The specialty has been removed from the list',
    });
  };

  const saveChanges = async () => {
    try {
      console.log("[ADMIN DIRECT] Saving specialties content");
      setIsSaving(true);
      
      // Create a deep copy to avoid reference issues
      const contentToSave = JSON.parse(JSON.stringify(content)) as SpecialtiesContent;
      
      // Save directly to Supabase
      await SettingsManager.saveSetting("specialtiesContent", contentToSave);
      
      console.log("[ADMIN DIRECT] Save operation successful");
      setHasChanges(false);
      
      toast({
        title: 'Specialties saved',
        description: 'Changes saved successfully. Taking you to homepage to verify...',
      });
      
      // Add a slight delay then redirect to homepage
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error: any) {
      console.error('[ADMIN DIRECT] Error saving specialties:', error.message);
      toast({
        title: 'Error saving',
        description: `Failed to save: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const refreshData = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard and refresh data?')) {
        return;
      }
    }
    loadData();
  };
  
  const viewOnHomepage = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard and go to homepage?')) {
        return;
      }
    }
    window.location.href = '/';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 flex-col">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-persian-gold mb-2"></div>
        <p>Loading specialties...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <h2 className="text-xl font-bold text-red-700 mb-2">Database Error</h2>
        <p className="mb-4">{error}</p>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => refreshData()}
          >
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/cachedebugger'}
          >
            Open Diagnostic Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Edit Specialties Section</CardTitle>
            <div className="text-xs text-gray-500">Last fetched: {lastFetchTime}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="heading" className="block text-sm font-medium mb-1">
                  Heading
                </label>
                <Input
                  id="heading"
                  value={content.heading}
                  onChange={(e) => updateHeading(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="subheading" className="block text-sm font-medium mb-1">
                  Subheading
                </label>
                <Textarea
                  id="subheading"
                  value={content.subheading}
                  onChange={(e) => updateSubheading(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Background Image (Optional)
                </label>
                <ImageUploader
                  onImageSelected={updateBackgroundImage}
                  currentImage={content.backgroundImage}
                  buttonLabel="Set Background Image"
                  bucketName="specialties"
                  folderPath="background"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Specialties Items</h3>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="specialties-list">
                  {(provided) => (
                    <ul
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-4"
                    >
                      {content.specialties.map((specialty, index) => (
                        <Draggable
                          key={specialty.id}
                          draggableId={specialty.id}
                          index={index}
                        >
                          {(provided) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="border rounded-lg p-4 bg-gray-50 relative"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab p-1"
                                >
                                  <GripVertical size={20} className="text-gray-400" />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                                  onClick={() => deleteSpecialty(specialty.id)}
                                >
                                  <Trash size={16} />
                                </Button>
                              </div>
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label htmlFor={`title-${specialty.id}`} className="block text-sm font-medium mb-1">
                                      Title
                                    </label>
                                    <Input
                                      id={`title-${specialty.id}`}
                                      value={specialty.title}
                                      onChange={(e) => updateSpecialty(specialty.id, 'title', e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor={`price-${specialty.id}`} className="block text-sm font-medium mb-1">
                                      Price
                                    </label>
                                    <Input
                                      id={`price-${specialty.id}`}
                                      value={specialty.price}
                                      onChange={(e) => updateSpecialty(specialty.id, 'price', e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label htmlFor={`description-${specialty.id}`} className="block text-sm font-medium mb-1">
                                    Description
                                  </label>
                                  <Textarea
                                    id={`description-${specialty.id}`}
                                    value={specialty.description}
                                    onChange={(e) => updateSpecialty(specialty.id, 'description', e.target.value)}
                                    rows={2}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Image</label>
                                  <div className="border rounded-md p-4">
                                    {specialty.image ? (
                                      <div className="relative">
                                        <img
                                          src={specialty.image}
                                          alt={specialty.title}
                                          className="max-h-48 rounded-md mx-auto"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/placeholder.svg';
                                          }}
                                        />
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          className="absolute top-2 right-2"
                                          onClick={() => updateSpecialty(specialty.id, 'image', '')}
                                        >
                                          <Trash size={14} />
                                        </Button>
                                      </div>
                                    ) : (
                                      <ImageUploader
                                        onImageSelected={(imageUrl) => handleImageUpload(specialty.id, imageUrl)}
                                        buttonLabel="Add Image"
                                        className="w-full"
                                        bucketName="specialties"
                                        folderPath={`items/${specialty.id}`}
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              </DragDropContext>
              <Button onClick={addSpecialty} variant="outline" className="w-full mt-4">
                <Plus className="mr-2 h-4 w-4" /> Add Specialty
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/cachedebugger'}
            >
              Diagnostics
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                try {
                  await SettingsManager.cleanupOldVersions('specialtiesContent', 3);
                  toast({
                    title: "Cleanup Complete",
                    description: "Old versions removed. Only the 3 most recent remain."
                  });
                } catch (err: any) {
                  toast({
                    title: "Cleanup Failed",
                    description: err.message || "Could not cleanup old versions."
                  });
                }
              }}
            >
              Cleanup Old Versions
            </Button>
          </div>
          
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={viewOnHomepage}
              disabled={isSaving}
            >
              <Home className="h-4 w-4 mr-1" /> View Homepage
            </Button>
            
            <Button
              onClick={saveChanges}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
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
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DirectSpecialtiesEditor;
