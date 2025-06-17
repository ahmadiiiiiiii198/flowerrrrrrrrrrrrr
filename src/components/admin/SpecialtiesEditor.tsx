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
import { Trash, Plus, Save, GripVertical, Loader2, Home } from 'lucide-react';
import ImageUploader from './ImageUploader';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { specialtiesService, SpecialtiesContent, Specialty, defaultContent } from '@/services/specialtiesService';

// Types and default content are now imported from specialtiesService.ts


const SpecialtiesEditor: React.FC = () => {
  const { toast } = useToast();
  const [localContent, setLocalContent] = useState<SpecialtiesContent>(defaultContent);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  
  // Subscribe to specialties service for updates
  useEffect(() => {
    console.log("[ADMIN] Setting up subscription to specialtiesService");
    
    const unsubscribe = specialtiesService.subscribe((content) => {
      console.log("[ADMIN] Received specialties data:", content);
      setLocalContent(content);
      setIsLoading(false);
      setConnectionStatus('connected');
    });
    
    // Initial data load
    specialtiesService.fetchContent()
      .then(content => {
        console.log("[ADMIN] Initial content loaded:", content);
      })
      .catch(error => {
        console.error("[ADMIN] Error loading content:", error);
        setConnectionStatus('error');
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to database',
          variant: 'destructive',
        });
      });
    
    return () => {
      console.log("[ADMIN] Cleaning up subscription");
      unsubscribe();
    };
  }, [toast]);

  const updateHeading = (newHeading: string) => {
    setLocalContent({ ...localContent, heading: newHeading });
    setHasChanges(true);
  };

  const updateSubheading = (newSubheading: string) => {
    setLocalContent({ ...localContent, subheading: newSubheading });
    setHasChanges(true);
  };
  
  const updateBackgroundImage = (imageUrl: string) => {
    setLocalContent({ ...localContent, backgroundImage: imageUrl });
    setHasChanges(true);
    console.log("Updated background image:", imageUrl);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(localContent.specialties);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalContent({ ...localContent, specialties: items });
    setHasChanges(true);
  };

  const addSpecialty = () => {
    const newSpecialty: Specialty = {
      id: Date.now().toString(),
      title: 'New Specialty',
      description: 'Description of the new specialty',
      price: '€0.00',
    };

    setLocalContent({ ...localContent, specialties: [...localContent.specialties, newSpecialty] });
    setHasChanges(true);
  };

  const updateSpecialty = (id: string, field: string, value: string) => {
    const updatedSpecialties = localContent.specialties.map((specialty) =>
      specialty.id === id ? { ...specialty, [field]: value } : specialty
    );

    setLocalContent({ ...localContent, specialties: updatedSpecialties });
    setHasChanges(true);
  };

  const handleImageUpload = (specialtyId: string, imageUrl: string) => {
    console.log(`Image uploaded for specialty ${specialtyId}:`, imageUrl);
    
    // Immediately show a success notification to provide feedback
    toast({
      title: 'Image updated',
      description: 'Image has been successfully assigned to the specialty',
    });
    
    // Update the local state
    const updatedSpecialties = localContent.specialties.map((specialty) =>
      specialty.id === specialtyId ? { ...specialty, image: imageUrl } : specialty
    );
    
    setLocalContent({ ...localContent, specialties: updatedSpecialties });
    setHasChanges(true);
  };

  const deleteSpecialty = (id: string) => {
    console.log(`Deleting specialty with id ${id}`);
    const updatedSpecialties = localContent.specialties.filter((specialty) => specialty.id !== id);
    setLocalContent({ ...localContent, specialties: updatedSpecialties });
    setHasChanges(true);
    
    // Show confirmation toast
    toast({
      title: 'Item removed',
      description: 'Remember to save your changes',
    });
  };

  const saveChanges = async () => {
    try {
      console.log("[ADMIN] Saving specialties content");
      setIsSaving(true);
      
      // Create a deep copy to avoid reference issues
      const contentToSave = JSON.parse(JSON.stringify(localContent)) as SpecialtiesContent;
      
      // Save using the specialties service
      const success = await specialtiesService.saveContent(contentToSave);
      
      if (!success) {
        throw new Error("Failed to save specialties content");
      }
      
      console.log("[ADMIN] Save operation successful");
      setHasChanges(false);
      
      toast({
        title: 'Specialties saved',
        description: 'Changes saved successfully. Taking you to homepage to verify...',
      });
      
      // Force a hard refresh of the data
      await specialtiesService.refreshContent();
      
      // Add a slight delay then redirect to homepage
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error: any) {
      console.error('Error saving specialties:', error.message);
      toast({
        title: 'Error saving',
        description: `Failed to save: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const viewOnHomepage = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard and go to homepage?')) {
        return;
      }
    }
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 flex-col">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-persian-gold mb-2"></div>
        <p>Loading specialties...</p>
      </div>
    );
  }
  
  if (connectionStatus === 'error') {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <h2 className="text-xl font-bold text-red-700 mb-2">Database Connection Error</h2>
        <p className="mb-4">Unable to connect to Supabase. Please check your internet connection and try again.</p>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/diagnostic'}
          >
            Open Diagnostic Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Specialties</h2>
        <Button 
          onClick={saveChanges} 
          disabled={!hasChanges || isSaving} 
          className="flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />} 
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="heading" className="text-sm font-medium">
              Heading
            </label>
            <Input
              type="text"
              id="heading"
              value={localContent.heading}
              onChange={(e) => updateHeading(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="subheading" className="text-sm font-medium">
              Subheading
            </label>
            <Textarea
              id="subheading"
              value={localContent.subheading}
              onChange={(e) => updateSubheading(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="backgroundImage" className="text-sm font-medium">
              Background Image
            </label>
            <ImageUploader
              currentImage={localContent.backgroundImage}
              onImageSelected={updateBackgroundImage}
              bucketName="specialties"
              folderPath="backgrounds"
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Specialties List</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="specialties">
              {(provided) => (
                <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {localContent.specialties.map((specialty, index) => (
                    <Draggable key={specialty.id} draggableId={specialty.id} index={index}>
                      {(provided) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div {...provided.dragHandleProps} className="cursor-move">
                              <GripVertical className="text-gray-400" size={16} />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:bg-red-100"
                              onClick={() => deleteSpecialty(specialty.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="space-y-2">
                              <label htmlFor={`title-${specialty.id}`} className="block text-sm font-medium">
                                Title
                              </label>
                              <Input
                                type="text"
                                id={`title-${specialty.id}`}
                                value={specialty.title}
                                onChange={(e) => updateSpecialty(specialty.id, 'title', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor={`price-${specialty.id}`} className="block text-sm font-medium">
                                Price
                              </label>
                              <Input
                                type="text"
                                id={`price-${specialty.id}`}
                                value={specialty.price}
                                onChange={(e) => updateSpecialty(specialty.id, 'price', e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="mt-4 space-y-2">
                            <label htmlFor={`description-${specialty.id}`} className="block text-sm font-medium">
                              Description
                            </label>
                            <Textarea
                              id={`description-${specialty.id}`}
                              value={specialty.description}
                              onChange={(e) => updateSpecialty(specialty.id, 'description', e.target.value)}
                              rows={3}
                            />
                          </div>
                          <div className="mt-4 space-y-2">
                            <label className="block text-sm font-medium">Image</label>
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
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <div className="flex space-x-4">
          <Button
            onClick={viewOnHomepage}
            variant="outline"
            disabled={isSaving}
          >
            <Home className="mr-2 h-4 w-4" />
            View Homepage
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

export default SpecialtiesEditor;
