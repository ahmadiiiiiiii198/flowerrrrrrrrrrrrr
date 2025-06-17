import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ProductOrderModal from './ProductOrderModal';
import { Product } from '@/types/category';
import { ShoppingCart, TestTube, Package, DollarSign } from 'lucide-react';

const OrderModalTest = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  const testProducts: Product[] = [
    {
      id: "test-modal-1",
      name: "Bouquet Sposa Elegante",
      description: "Bouquet raffinato con rose bianche e peonie per il giorno più importante",
      price: 85.00,
      category: "Matrimoni",
      category_slug: "matrimoni",
      image_url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      is_featured: true,
      is_available: true,
      stock_quantity: 10
    },
    {
      id: "test-modal-2",
      name: "Bouquet Rose Rosse",
      description: "Classico bouquet di rose rosse fresche, simbolo di amore eterno",
      price: 55.00,
      category: "Fiori & Piante",
      category_slug: "fiori-piante",
      image_url: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      is_featured: true,
      is_available: true,
      stock_quantity: 25
    },
    {
      id: "test-modal-3",
      name: "Orchidea Artificiale",
      description: "Elegante orchidea artificiale di alta qualità, indistinguibile dal vero",
      price: 45.00,
      category: "Fiori Finti",
      category_slug: "fiori-finti",
      image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      is_featured: true,
      is_available: true,
      stock_quantity: 15
    },
    {
      id: "test-modal-4",
      name: "Corona Funebre Classica",
      description: "Elegante corona funebre con fiori bianchi e verdi per ultimo saluto",
      price: 75.00,
      category: "Funerali",
      category_slug: "funerali",
      image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      is_featured: true,
      is_available: true,
      stock_quantity: 8
    }
  ];

  const openOrderModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
    addTestResult('Modal Open', true, `Opened order modal for ${product.name}`);
  };

  const closeOrderModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    addTestResult('Modal Close', true, 'Order modal closed');
  };

  const addTestResult = (test: string, success: boolean, message: string) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <Card className="bg-white shadow-lg border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShoppingCart className="h-4 w-4" />
              Order Modal Test
            </CardTitle>
            <Button
              onClick={clearResults}
              size="sm"
              variant="outline"
              className="w-full"
            >
              Clear Results
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Test Products */}
            <div className="space-y-2">
              <div className="text-xs font-medium flex items-center gap-1">
                <TestTube className="h-3 w-3" />
                Test Products:
              </div>
              {testProducts.map((product) => (
                <Button
                  key={product.id}
                  onClick={() => openOrderModal(product)}
                  size="sm"
                  variant="outline"
                  className="w-full justify-start text-xs"
                >
                  <Package className="mr-2 h-3 w-3" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-gray-500 flex items-center gap-1">
                      <DollarSign className="h-2 w-2" />
                      €{product.price.toFixed(2)}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="border-t pt-3">
                <div className="text-xs font-medium mb-2">Test Results:</div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {testResults.slice(-5).map((result, index) => (
                    <div key={index} className="text-xs">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-medium">{result.test}</span>
                        <span className="text-gray-400 ml-auto">{result.timestamp}</span>
                      </div>
                      <div className="text-gray-600 ml-3">{result.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="border-t pt-3 text-xs text-gray-600">
              <div className="font-medium mb-1">Test Instructions:</div>
              <ul className="space-y-1 text-xs">
                <li>• Click any product to open order modal</li>
                <li>• Fill in customer information</li>
                <li>• Adjust quantity with +/- buttons</li>
                <li>• Add delivery address</li>
                <li>• Submit order to test integration</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Modal */}
      <ProductOrderModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={closeOrderModal}
      />
    </>
  );
};

export default OrderModalTest;
