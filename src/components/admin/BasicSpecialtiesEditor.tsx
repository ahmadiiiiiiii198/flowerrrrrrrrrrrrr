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
import { Trash, Plus, Save, GripVertical, Loader2, Home, RefreshCw, Upload } from 'lucide-react';
import ImageUploader from './ImageUploader';
import MultipleImageUploader, { ImageWithLabel } from './MultipleImageUploader';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '@/integrations/supabase/client';

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

// Default content
const defaultContent: SpecialtiesContent = {
  heading: "Our Specialties",
  subheading: "Discover authentic Central Asian flavors crafted with centuries-old recipes",
  specialties: [
    {
      id: "1",
      title: "Plov (Uzbek Rice Pilaf)",
      description: "Our signature dish featuring fragrant rice cooked with tender lamb, carrots, and a blend of traditional spices.",
      image: "/lovable-uploads/73eb78dc-53a2-4ec9-b660-6ffec6bff8bb.png",
      price: "€14.90",
    },
    {
      id: "2",
      title: "Shashlik (Central Asian Skewers)",
      description: "Marinated meat skewers grilled to perfection over an open flame. Served with tangy yogurt sauce and fresh herbs.",
      image: "/lovable-uploads/05335902-cb3d-4760-aab2-46a1292ac614.png",
      price: "€13.90",
    },
    {
      id: "3",
      title: "Shurpa (Lamb Soup)",
      description: "Hearty lamb soup with vegetables and herbs, slow-cooked to extract rich flavors. Perfect for starting your Central Asian feast.",
      image: "/lovable-uploads/bbf20df5-b0f5-4add-bf53-5675c1993c9b.png",
      price: "€12.90",
    },
  ]
};

const BasicSpecialtiesEditor: React.FC = () => {
  const { toast } = useToast();
  const [content, setContent] = useState<SpecialtiesContent>(defaultContent);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<string>("");
  const [supabaseRecords, setSupabaseRecords] = useState<any[]>([]);
  
  // Load data directly from Supabase
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all records for debugging
      const allRecordsResult = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'specialtiesContent')
        .order('updated_at', { ascending: false });
        
      if (allRecordsResult.error) {
        throw new Error(`Error fetching all records: ${allRecordsResult.error.message}`);
      }
      
      setSupabaseRecords(allRecordsResult.data || []);
      console.log('[BasicSpecialtiesEditor] All specialtiesContent records:', allRecordsResult.data);

      // Get the most recent record
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'specialtiesContent')
        .order('updated_at', { ascending: false })
        .limit(1);

      const now = new Date();
      setLastFetchTime(now.toLocaleTimeString());
      
      if (error) {
        console.error('[BasicSpecialtiesEditor] Error fetching data:', error);
        setError(`Failed to load: ${error.message}`);
        return;
      }

      if (data && data.length > 0) {
        try {
          // Extract the value field
          const rawValue = data[0].value;
          console.log('[BasicSpecialtiesEditor] Raw value from DB:', rawValue);
          
          // Parse if string, use directly if object
          const parsedValue = typeof rawValue === 'string' 
            ? JSON.parse(rawValue) 
            : rawValue;
            
          if (parsedValue && 
              parsedValue.heading && 
              parsedValue.subheading && 
              Array.isArray(parsedValue.specialties)) {
            
            setContent(parsedValue);
            setHasChanges(false);
            console.log('[BasicSpecialtiesEditor] Successfully loaded content');
          } else {
            console.warn('[BasicSpecialtiesEditor] Invalid content structure:', parsedValue);
            setError("The data structure is invalid. Using defaults.");
            setContent(defaultContent);
          }
        } catch (parseError) {
          console.error('[BasicSpecialtiesEditor] Parse error:', parseError);
          setError(`Data parse error: ${parseError.message}`);
          setContent(defaultContent);
        }
      } else {
        console.warn('[BasicSpecialtiesEditor] No data found');
        setError("No specialties data found. Using defaults.");
        setContent(defaultContent);
      }
    } catch (err: any) {
      console.error('[BasicSpecialtiesEditor] Error loading specialties:', err);
      setError(err.message || "Failed to load specialties");
      setContent(defaultContent);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load on mount
  useEffect(() => {
    console.log("[BasicSpecialtiesEditor] Component mounted, loading data");
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
    console.log(`[BasicSpecialtiesEditor] Image uploaded for specialty ${specialtyId}:`, imageUrl);
    
    // Immediately update the specialty
    updateSpecialty(specialtyId, 'image', imageUrl);
  };

  const deleteSpecialty = (id: string) => {
    setContent({
      ...content,
      specialties: content.specialties.filter((specialty) => specialty.id !== id),
    });
    setHasChanges(true);
    
    toast({
      title: 'Specialty removed',
      description: 'The specialty has been removed from the list',
    });
  };

  const saveChanges = async () => {
    try {
      console.log("[BasicSpecialtiesEditor] Saving specialties content");
      setIsSaving(true);
      
      // Create a deep copy to avoid reference issues
      const contentToSave = JSON.parse(JSON.stringify(content)) as SpecialtiesContent;
      
      // Insert directly to Supabase settings table
      // Convert our object to a JSON string and then back to ensure it's compatible with Supabase's JSON type
      const jsonCompatibleValue = JSON.parse(JSON.stringify(contentToSave));
      
      const { data, error } = await supabase
        .from('settings')
        .insert({
          key: 'specialtiesContent',
          value: jsonCompatibleValue,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        throw new Error(`Supabase insert error: ${error.message}`);
      }
      
      console.log("[BasicSpecialtiesEditor] Save operation successful");
      setHasChanges(false);
      
      toast({
        title: 'Specialties saved',
        description: 'Changes saved successfully. Taking you to homepage to verify...',
      });
      
      // Refresh data after saving to confirm we have the latest
      await loadData();
      
      // Add a slight delay then redirect to homepage
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error: any) {
      console.error('[BasicSpecialtiesEditor] Error saving specialties:', error.message);
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
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to reload and lose these changes?');
      if (!confirm) return;
    }
    
    loadData();
  };
  
  const viewOnHomepage = () => {
    window.open('/', '_blank');
  };
  
  // Cleanup old versions
  const cleanupOldVersions = async () => {
    try {
      console.log("[BasicSpecialtiesEditor] Starting cleanup");
      
      // Get all records to find IDs to clean up
      const { data, error } = await supabase
        .from('settings')
        .select('id, updated_at')
        .eq('key', 'specialtiesContent')
        .order('updated_at', { ascending: false });
        
      if (error) {
        throw new Error(`Error fetching records: ${error.message}`);
      }
      
      if (!data || data.length <= 3) {
        console.log("[BasicSpecialtiesEditor] Not enough records to clean up");
        toast({
          title: 'Cleanup not needed',
          description: `Only ${data?.length || 0} records found. Keeping all.`,
        });
        return;
      }
      
      // Keep the 3 most recent, delete the rest
      const idsToDelete = data.slice(3).map(record => record.id);
      
      console.log(`[BasicSpecialtiesEditor] Deleting ${idsToDelete.length} old records:`, idsToDelete);
      
      const { error: deleteError } = await supabase
        .from('settings')
        .delete()
        .in('id', idsToDelete);
        
      if (deleteError) {
        throw new Error(`Error deleting old records: ${deleteError.message}`);
      }
      
      console.log("[BasicSpecialtiesEditor] Cleanup successful");
      toast({
        title: 'Cleanup Complete',
        description: `Deleted ${idsToDelete.length} old versions. Kept the 3 most recent.`,
      });
      
      // Refresh the data to show updated records list
      loadData();
    } catch (error: any) {
      console.error('[BasicSpecialtiesEditor] Cleanup error:', error.message);
      toast({
        title: 'Cleanup failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Specialties Editor</CardTitle>
        </CardHeader>
        
        {isLoading ? (
          <CardContent className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-persian-gold border-t-transparent"></div>
            <p className="ml-3">Loading specialties...</p>
          </CardContent>
        ) : error ? (
          <CardContent className="py-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
            <Button onClick={refreshData}>Try Again</Button>
          </CardContent>
        ) : (
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Main Settings</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Heading</label>
                  <Input
                    value={content.heading}
                    onChange={(e) => updateHeading(e.target.value)}
                    placeholder="Main heading for specialties section"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subheading</label>
                  <Textarea
                    value={content.subheading}
                    onChange={(e) => updateSubheading(e.target.value)}
                    placeholder="Subheading description text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Background Image URL (optional)</label>
                  <div className="flex gap-2">
                    <Input
                      value={content.backgroundImage || ''}
                      onChange={(e) => updateBackgroundImage(e.target.value)}
                      placeholder="URL to background image"
                    />
                    <ImageUploader
                      onImageSelected={updateBackgroundImage}
                      buttonLabel="Upload"
                      bucketName="backgrounds"
                      folderPath="specialties"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Image Upload for Specialties
              </h3>
              <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <MultipleImageUploader
                  onImagesSelected={(imageUrls) => {
                    // Handle simple image URLs (fallback)
                    const newSpecialties = imageUrls.map((url, index) => ({
                      id: `${Date.now()}-${index}`,
                      title: `New Specialty ${content.specialties.length + index + 1}`,
                      description: 'Add description for this specialty',
                      image: url,
                      price: '€0.00'
                    }));

                    setContent({
                      ...content,
                      specialties: [...content.specialties, ...newSpecialties]
                    });
                  }}
                  onImagesWithLabelsSelected={(imagesWithLabels) => {
                    // Create new specialties for each uploaded image with label as title
                    const newSpecialties = imagesWithLabels.map((item, index) => ({
                      id: `${Date.now()}-${index}`,
                      title: item.label || `New Specialty ${content.specialties.length + index + 1}`,
                      description: 'Add description for this specialty',
                      image: item.url,
                      price: '€0.00'
                    }));

                    setContent({
                      ...content,
                      specialties: [...content.specialties, ...newSpecialties]
                    });
                    setHasChanges(true);

                    toast({
                      title: `${imagesWithLabels.length} specialties created`,
                      description: `Added ${imagesWithLabels.length} new specialties with images and labels. Edit the details below.`,
                    });
                  }}
                  buttonLabel="Upload Images with Labels to Create Specialties"
                  bucketName="specialties"
                  folderPath="bulk-upload"
                  maxFiles={20}
                  enableLabels={true}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Upload multiple images to quickly create new specialties. You can edit the titles, descriptions, and prices below.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Specialties Items</h3>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="specialties">
                  {(provided) => (
                    <ul
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-4"
                    >
                      {content.specialties.map((specialty, index) => (
                        <Draggable key={specialty.id} draggableId={specialty.id} index={index}>
                          {(provided) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="border rounded-lg p-4 bg-white"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-move p-1 rounded hover:bg-gray-100"
                                >
                                  <GripVertical size={16} />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteSpecialty(specialty.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash size={16} />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium mb-1">Title</label>
                                  <Input
                                    value={specialty.title}
                                    onChange={(e) => updateSpecialty(specialty.id, 'title', e.target.value)}
                                    placeholder="Specialty title"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Price</label>
                                  <Input
                                    value={specialty.price}
                                    onChange={(e) => updateSpecialty(specialty.id, 'price', e.target.value)}
                                    placeholder="Price (e.g. €12.90)"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium mb-1">Description</label>
                                  <Textarea
                                    value={specialty.description}
                                    onChange={(e) => updateSpecialty(specialty.id, 'description', e.target.value)}
                                    placeholder="Specialty description"
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
            
            {supabaseRecords.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Database Records</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-48">
                  <p className="mb-2">Found {supabaseRecords.length} records in settings table:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {supabaseRecords.map((record, index) => (
                      <li key={record.id}>
                        <span className="font-mono">{record.id}</span> - 
                        Updated: {new Date(record.updated_at).toLocaleString()}
                        {index === 0 && <span className="ml-2 text-green-600 font-semibold">(Current)</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        )}
        
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
              variant="destructive"
              size="sm"
              onClick={cleanupOldVersions}
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

export default BasicSpecialtiesEditor;
