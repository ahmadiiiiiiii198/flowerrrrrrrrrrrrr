import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { initializeProducts } from '@/utils/initializeProducts';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const QuickDatabaseTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const testDatabase = async () => {
    setIsLoading(true);
    try {
      // Test 1: Check categories
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (catError) throw catError;

      // Test 2: Check products
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug
          )
        `);

      if (prodError) throw prodError;

      setResults({
        categories: categories || [],
        products: products || [],
        categoriesCount: categories?.length || 0,
        productsCount: products?.length || 0
      });

      toast({
        title: 'Database Test Complete',
        description: `Found ${categories?.length || 0} categories and ${products?.length || 0} products`,
      });

    } catch (error) {
      console.error('Database test error:', error);
      toast({
        title: 'Database Test Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initializeProductsNow = async () => {
    setIsLoading(true);
    try {
      const success = await initializeProducts();
      if (success) {
        toast({
          title: 'Success!',
          description: 'Products initialized successfully',
        });
        // Re-test after initialization
        await testDatabase();
      } else {
        toast({
          title: 'Failed',
          description: 'Product initialization failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Quick Database Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testDatabase} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test Database
          </Button>
          <Button onClick={initializeProductsNow} disabled={isLoading} variant="outline">
            Initialize Products
          </Button>
        </div>

        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  {results.categoriesCount === 4 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium">Categories: {results.categoriesCount}</span>
                </div>
                <div className="text-sm space-y-1">
                  {results.categories.map((cat: any) => (
                    <div key={cat.id} className="text-gray-600">
                      • {cat.name} ({cat.slug})
                    </div>
                  ))}
                </div>
              </div>

              <div className="border rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  {results.productsCount >= 16 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium">Products: {results.productsCount}</span>
                </div>
                <div className="text-sm space-y-1">
                  {results.products.slice(0, 5).map((prod: any) => (
                    <div key={prod.id} className="text-gray-600">
                      • {prod.name}
                    </div>
                  ))}
                  {results.productsCount > 5 && (
                    <div className="text-gray-400">... and {results.productsCount - 5} more</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium mb-2">Expected vs Actual:</h4>
              <div className="text-sm space-y-1">
                <div>✅ Categories: {results.categoriesCount}/4 {results.categoriesCount === 4 ? '(Complete)' : '(Missing)'}</div>
                <div>✅ Products: {results.productsCount}/16 {results.productsCount >= 16 ? '(Complete)' : '(Incomplete)'}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickDatabaseTest;
