
import React from "react";
import PatternDivider from "./PatternDivider";

const MenuSection = ({ title, items }: { title: string; items: any[] }) => {
  return (
    <div className="mb-12">
      <h3 className="text-2xl font-playfair text-persian-navy mb-6 text-center">
        <span className="border-b-2 border-persian-gold pb-1">{title}</span>
      </h3>
      <div className="grid md:grid-cols-2 gap-8">
        {items.map((item, index) => (
          <div key={index} className="menu-item-border">
            <div className="flex justify-between items-baseline mb-2">
              <h4 className="text-lg font-playfair font-semibold">{item.name}</h4>
              <span className="menu-price text-persian-gold font-spectral">${item.price}</span>
            </div>
            <p className="text-gray-600 text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const Menu = () => {
  const appetizers = [
    {
      name: "Kashke Bademjan",
      price: "8.50",
      description: "Sautéed eggplant mixed with garlic, mint, and creamy whey sauce",
    },
    {
      name: "Mast-o-Khiar",
      price: "6.75",
      description: "Refreshing yogurt with diced cucumbers, mint, and dried rose petals",
    },
    {
      name: "Dolme Barg",
      price: "9.25",
      description: "Grape leaves stuffed with aromatic rice, herbs, and spices",
    },
    {
      name: "Mirza Ghasemi",
      price: "7.95",
      description: "Smoky eggplant purée with tomatoes, garlic, and eggs",
    },
  ];

  const mainCourses = [
    {
      name: "Bouquet Sposa",
      price: "85.00",
      description: "Elegante bouquet da sposa con rose bianche, peonie e gypsophila",
    },
    {
      name: "Composizione Matrimonio",
      price: "120.00",
      description: "Centrotavola per matrimonio con fiori di stagione e candele",
    },
    {
      name: "Bouquet Funebre",
      price: "65.00",
      description: "Composizione sobria ed elegante per cerimonie funebri",
    },
    {
      name: "Composizione Compleanno",
      price: "45.00",
      description: "Allegra composizione colorata per festeggiare compleanni",
    },
    {
      name: "Bouquet San Valentino",
      price: "55.00",
      description: "Romantico bouquet di rose rosse per la festa degli innamorati",
    },
    {
      name: "Zereshk Polo ba Morgh",
      price: "19.75",
      description: "Barberry rice with saffron chicken, topped with buttery barberries",
    },
  ];

  const desserts = [
    {
      name: "Sholeh Zard",
      price: "6.95",
      description: "Saffron rice pudding garnished with cinnamon, almonds, and pistachios",
    },
    {
      name: "Baklava",
      price: "7.50",
      description: "Layers of phyllo dough filled with chopped nuts and sweetened with rose water syrup",
    },
    {
      name: "Faloodeh",
      price: "8.25",
      description: "Traditional Persian frozen dessert made with thin vermicelli noodles and rose water",
    },
    {
      name: "Zoolbia & Bamieh",
      price: "6.75",
      description: "Deep-fried pastries soaked in saffron and rose water syrup",
    },
  ];

  const beverages = [
    {
      name: "Persian Tea",
      price: "3.95",
      description: "Traditional black tea served with saffron rock candy",
    },
    {
      name: "Doogh",
      price: "4.25",
      description: "Refreshing yogurt drink with mint and dried herbs",
    },
    {
      name: "Sekanjabin",
      price: "5.50",
      description: "Traditional Persian mint syrup mixed with cucumber and water",
    },
    {
      name: "Saffron Ice Cream",
      price: "7.95",
      description: "Persian ice cream flavored with saffron, rose water, and pistachios",
    },
  ];

  return (
    <section id="menu" className="py-24 bg-white relative">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl text-center font-playfair font-bold mb-2 text-persian-navy">
          Le Nostre Creazioni <span className="text-persian-gold">Floreali</span>
        </h2>
        <p className="text-center text-gray-600 mb-10 max-w-3xl mx-auto">
          Scopri le nostre composizioni floreali uniche create con passione e maestria artigianale
        </p>
        
        <PatternDivider />
        
        <div className="bg-persian-pattern p-10 rounded-lg shadow-lg">
          <MenuSection title="Appetizers" items={appetizers} />
          <MenuSection title="Main Courses" items={mainCourses} />
          <MenuSection title="Desserts" items={desserts} />
          <MenuSection title="Beverages" items={beverages} />
        </div>
      </div>
    </section>
  );
};

export default Menu;
