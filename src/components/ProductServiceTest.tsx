import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { productService } from '@/services/productService';
import { Product, ProductsByCategory, ProductsContent } from '@/types/category';
import { Loader2, CheckCircle, XCircle, Package, Database, RefreshCw } from 'lucide-react';

const ProductServiceTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [productsContent, setProductsContent] = useState<ProductsContent | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  const addTestResult = (test: string, success: boolean, message: string, data?: any) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      // Test 1: Fetch Products Content
      addTestResult('Starting Tests', true, 'Beginning comprehensive product service tests');
      
      console.log('[ProductServiceTest] Testing fetchContent...');
      const content = await productService.fetchContent();
      setProductsContent(content);
      
      if (content && content.products) {
        addTestResult('Fetch Content', true, `Loaded content with ${Object.keys(content.products).length} categories`);
        
        // Test 2: Verify Categories
        const expectedCategories = ['matrimoni', 'fiori-piante', 'fiori-finti', 'funerali'];
        const actualCategories = Object.keys(content.products);
        const hasAllCategories = expectedCategories.every(cat => actualCategories.includes(cat));
        
        addTestResult('Category Structure', hasAllCategories, 
          hasAllCategories ? 'All 4 categories present' : `Missing categories: ${expectedCategories.filter(cat => !actualCategories.includes(cat)).join(', ')}`);
        
        // Test 3: Count Products per Category
        let totalProducts = 0;
        for (const [categorySlug, products] of Object.entries(content.products)) {
          const count = products.length;
          totalProducts += count;
          addTestResult(`${categorySlug} Products`, count > 0, `Found ${count} products in ${categorySlug}`);
        }
        
        addTestResult('Total Products', totalProducts > 0, `Total products loaded: ${totalProducts}`);
        
        // Test 4: Verify Product Structure
        const firstCategory = Object.values(content.products)[0];
        if (firstCategory && firstCategory.length > 0) {
          const firstProduct = firstCategory[0];
          const requiredFields = ['id', 'name', 'description', 'price', 'category', 'category_slug', 'image_url'];
          const hasAllFields = requiredFields.every(field => Object.prototype.hasOwnProperty.call(firstProduct, field));
          
          addTestResult('Product Structure', hasAllFields, 
            hasAllFields ? 'Products have all required fields' : 'Missing required fields in products');
        }
        
      } else {
        addTestResult('Fetch Content', false, 'Failed to load products content');
      }
      
      // Test 5: Featured Products
      console.log('[ProductServiceTest] Testing getFeaturedProducts...');
      const featured = await productService.getFeaturedProducts();
      setFeaturedProducts(featured);
      addTestResult('Featured Products', featured.length > 0, `Found ${featured.length} featured products`);
      
      // Test 6: Products by Category
      for (const categorySlug of ['matrimoni', 'fiori-piante', 'fiori-finti', 'funerali']) {
        const categoryProducts = await productService.getProductsByCategory(categorySlug);
        addTestResult(`${categorySlug} Filter`, categoryProducts.length > 0, 
          `Found ${categoryProducts.length} products in ${categorySlug}`);
      }
      
      // Test 7: Cache Test
      console.log('[ProductServiceTest] Testing cache...');
      const startTime = Date.now();
      await productService.fetchContent();
      const cacheTime = Date.now() - startTime;
      addTestResult('Cache Performance', cacheTime < 100, `Cache response time: ${cacheTime}ms`);
      
      addTestResult('All Tests Complete', true, 'Product service testing completed successfully');
      
    } catch (error) {
      console.error('[ProductServiceTest] Error during testing:', error);
      addTestResult('Test Error', false, `Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = () => {
    productService.clearCache();
    addTestResult('Cache Cleared', true, 'Product service cache has been cleared');
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="fixed top-4 left-4 z-50 max-w-md">
      <Card className="bg-white shadow-lg border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4" />
            Product Service Test
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={runAllTests}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-3 w-3" />
              )}
              Run Tests
            </Button>
            <Button
              onClick={clearCache}
              size="sm"
              variant="outline"
            >
              Clear Cache
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Test Results */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start gap-2 text-xs">
                {result.success ? (
                  <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{result.test}</div>
                  <div className="text-gray-600">{result.message}</div>
                  <div className="text-gray-400">{result.timestamp}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {productsContent && (
            <div className="border-t pt-3 space-y-2">
              <div className="text-xs font-medium">Summary:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <Badge variant="outline" className="text-xs">
                    Categories: {Object.keys(productsContent.products).length}
                  </Badge>
                </div>
                <div>
                  <Badge variant="outline" className="text-xs">
                    Featured: {featuredProducts.length}
                  </Badge>
                </div>
              </div>
              <div className="text-xs text-gray-600">
                Total Products: {Object.values(productsContent.products).reduce((sum, products) => sum + products.length, 0)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductServiceTest;
