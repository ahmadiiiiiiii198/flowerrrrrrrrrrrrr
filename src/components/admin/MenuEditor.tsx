
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash, Edit, Plus, Save, Image as ImageIcon } from "lucide-react";
import ImageUploader from "./ImageUploader";
import { useSetting } from "@/hooks/use-settings";

interface MenuItem {
  id: string;
  name: string;
  price: string;
  description: string;
  category: string;
  image?: string;
}

const initialMenu: MenuItem[] = [
  {
    id: "a1",
    name: "Kashke Bademjan",
    price: "8.50",
    description: "Sautéed eggplant mixed with garlic, mint, and creamy whey sauce",
    category: "appetizers",
  },
  {
    id: "a2",
    name: "Mast-o-Khiar",
    price: "6.75",
    description: "Refreshing yogurt with diced cucumbers, mint, and dried rose petals",
    category: "appetizers",
  },
  {
    id: "m1",
    name: "Chelo Kabab Koobideh",
    price: "18.95",
    description: "Two skewers of seasoned ground lamb and beef served with saffron rice",
    category: "main",
  },
  {
    id: "m2",
    name: "Joojeh Kabab",
    price: "16.75",
    description: "Tender chicken marinated in saffron and lemon juice, grilled to perfection",
    category: "main",
  },
  {
    id: "d1",
    name: "Sholeh Zard",
    price: "6.95",
    description: "Saffron rice pudding garnished with cinnamon, almonds, and pistachios",
    category: "desserts",
  },
  {
    id: "d2",
    name: "Baklava",
    price: "7.50",
    description: "Layers of phyllo dough filled with chopped nuts and sweetened with rose water syrup",
    category: "desserts",
  },
  {
    id: "b1",
    name: "Persian Tea",
    price: "3.95",
    description: "Traditional black tea served with saffron rock candy",
    category: "beverages",
  },
  {
    id: "b2",
    name: "Doogh",
    price: "4.25",
    description: "Refreshing yogurt drink with mint and dried herbs",
    category: "beverages",
  },
];

const MenuEditor = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: "",
    price: "",
    description: "",
    category: "appetizers",
  });
  const [activeTab, setActiveTab] = useState("appetizers");
  const { toast } = useToast();
  
  // Use useSetting hook to persist menu data
  const [savedMenu, updateSavedMenu, isLoading] = useSetting<MenuItem[]>('menuItems', initialMenu);
  
  // Initialize menu items from saved settings
  React.useEffect(() => {
    if (!isLoading && savedMenu) {
      setMenuItems(savedMenu);
    }
  }, [savedMenu, isLoading]);

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    
    const updatedItems = menuItems.map((item) => (item.id === editingItem.id ? editingItem : item));
    setMenuItems(updatedItems);
    
    // Persist changes to database
    await updateSavedMenu(updatedItems);
    
    setEditingItem(null);
    
    toast({
      title: "Menu item updated",
      description: `"${editingItem.name}" has been updated`,
    });
  };

  const handleDeleteItem = async (id: string) => {
    const itemToDelete = menuItems.find(item => item.id === id);
    const updatedItems = menuItems.filter((item) => item.id !== id);
    
    setMenuItems(updatedItems);
    
    // Persist changes to database
    await updateSavedMenu(updatedItems);
    
    if (itemToDelete) {
      toast({
        title: "Menu item deleted",
        description: `"${itemToDelete.name}" has been removed from the menu`,
      });
    }
  };

  const handleAddNewItem = async () => {
    if (!newItem.name || !newItem.price) {
      toast({
        title: "Missing information",
        description: "Please provide a name and price for the new menu item",
        variant: "destructive",
      });
      return;
    }
    
    const newMenuItem: MenuItem = {
      id: `new-${Date.now()}`,
      name: newItem.name,
      price: newItem.price,
      description: newItem.description || "",
      category: newItem.category || "appetizers",
      image: newItem.image || "",
    };
    
    const updatedItems = [newMenuItem, ...menuItems];
    setMenuItems(updatedItems);
    
    // Persist changes to database
    await updateSavedMenu(updatedItems);
    
    setNewItem({
      name: "",
      price: "",
      description: "",
      category: activeTab,
    });
    
    toast({
      title: "Menu item added",
      description: `"${newMenuItem.name}" has been added to the menu`,
    });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setNewItem({ ...newItem, category: value });
  };
  
  const handleImageUpload = (itemId: string, imageUrl: string) => {
    if (editingItem && editingItem.id === itemId) {
      setEditingItem({
        ...editingItem,
        image: imageUrl
      });
    } else if (itemId === 'new') {
      // For new item being created
      setNewItem({
        ...newItem,
        image: imageUrl
      });
    }
    
    toast({
      title: "Image uploaded",
      description: "The image has been uploaded successfully",
    });
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-playfair font-bold text-persian-navy">Menu Editor</h2>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-persian-gold text-persian-navy hover:bg-persian-gold/90 flex items-center gap-2">
              <Plus size={16} />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Category</label>
                <select
                  className="col-span-3 p-2 border rounded"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                >
                  <option value="appetizers">Appetizers</option>
                  <option value="main">Main Courses</option>
                  <option value="desserts">Desserts</option>
                  <option value="beverages">Beverages</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Name</label>
                <Input
                  className="col-span-3"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Item name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Price</label>
                <Input
                  className="col-span-3"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Description</label>
                <Input
                  className="col-span-3"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Brief description of the dish"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Image</label>
                <div className="col-span-3">
                  {newItem.image ? (
                    <div className="relative">
                      <img 
                        src={newItem.image} 
                        alt="Menu item" 
                        className="max-h-40 rounded-md mx-auto object-contain"
                      />
                      <Button
                        type="button"
                        onClick={() => setNewItem({ ...newItem, image: "" })}
                        className="absolute top-2 right-2 bg-red-500/70 hover:bg-red-500 text-white rounded-full p-1"
                        size="icon"
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  ) : (
                    <ImageUploader 
                      onImageSelected={(imageUrl) => handleImageUpload('new', imageUrl)}
                      buttonLabel="Add Image"
                      folderPath="menu"
                    />
                  )}
                </div>
              </div>
              <Button onClick={handleAddNewItem} className="w-full mt-2">Add Item</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-4 w-full bg-persian-cream/70">
          <TabsTrigger value="appetizers" className="data-[state=active]:bg-persian-gold data-[state=active]:text-persian-navy">
            Appetizers
          </TabsTrigger>
          <TabsTrigger value="main" className="data-[state=active]:bg-persian-gold data-[state=active]:text-persian-navy">
            Main Courses
          </TabsTrigger>
          <TabsTrigger value="desserts" className="data-[state=active]:bg-persian-gold data-[state=active]:text-persian-navy">
            Desserts
          </TabsTrigger>
          <TabsTrigger value="beverages" className="data-[state=active]:bg-persian-gold data-[state=active]:text-persian-navy">
            Beverages
          </TabsTrigger>
        </TabsList>

        {["appetizers", "main", "desserts", "beverages"].map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {menuItems
              .filter((item) => item.category === category)
              .map((item, index) => (
                <Card
                  key={item.id}
                  className="border-persian-gold/20 hover:shadow-md transition-shadow animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-4">
                    {editingItem && editingItem.id === item.id ? (
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="text-sm font-medium block mb-1">Name</label>
                            <Input
                              value={editingItem.name}
                              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-sm font-medium block mb-1">Price</label>
                            <Input
                              value={editingItem.price}
                              onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1">Description</label>
                          <Input
                            value={editingItem.description}
                            onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1">Image</label>
                          {editingItem.image ? (
                            <div className="relative">
                              <img 
                                src={editingItem.image} 
                                alt={editingItem.name} 
                                className="max-h-40 rounded-md mx-auto object-contain"
                              />
                              <Button
                                type="button"
                                onClick={() => setEditingItem({ ...editingItem, image: "" })}
                                className="absolute top-2 right-2 bg-red-500/70 hover:bg-red-500 text-white rounded-full p-1"
                                size="icon"
                              >
                                <Trash size={16} />
                              </Button>
                            </div>
                          ) : (
                            <ImageUploader 
                              onImageSelected={(imageUrl) => handleImageUpload(editingItem.id, imageUrl)}
                              buttonLabel="Add Image"
                              folderPath="menu"
                            />
                          )}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setEditingItem(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveEdit}
                            className="bg-persian-gold text-persian-navy hover:bg-persian-gold/90 flex items-center gap-2"
                          >
                            <Save size={16} />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          {item.image && (
                            <img 
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-md"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder.svg';
                              }}
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-lg text-persian-navy">{item.name}</h3>
                              <span className="font-semibold text-persian-gold">${item.price}</span>
                            </div>
                            <p className="text-gray-600 mt-1">{item.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditItem(item)}
                            className="text-gray-500 hover:text-persian-navy"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
            {menuItems.filter((item) => item.category === category).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>No items in this category yet.</p>
                <p className="text-sm mt-2">Click "Add Menu Item" to create one.</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default MenuEditor;

