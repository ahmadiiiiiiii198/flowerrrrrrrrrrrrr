import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { categoryService } from '@/services/categoryService';
import { initializeAllCategories } from '@/utils/initializeCategories';
import { initializeCategoryContentSections } from '@/utils/initializeCategoryContentSections';

const DebugCategories = () => {
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDatabaseConnection = async () => {
    addResult('Testing database connection...');
    try {
      const { data, error } = await supabase.from('categories').select('count').single();
      if (error) {
        addResult(`Database error: ${error.message}`);
      } else {
        addResult('Database connection successful!');
      }
    } catch (err) {
      addResult(`Database connection failed: ${err}`);
    }
  };

  const testCategoriesTable = async () => {
    addResult('Testing categories table...');
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .limit(5);
      
      if (error) {
        addResult(`Categories table error: ${error.message}`);
      } else {
        addResult(`Categories table accessible. Found ${data?.length || 0} categories`);
        if (data && data.length > 0) {
          addResult(`First category: ${JSON.stringify(data[0])}`);
        }
      }
    } catch (err) {
      addResult(`Categories table test failed: ${err}`);
    }
  };

  const testInitializeCategories = async () => {
    addResult('Testing category initialization...');
    try {
      const result = await initializeAllCategories();
      addResult(`Category initialization result: ${result}`);
    } catch (err) {
      addResult(`Category initialization failed: ${err}`);
    }
  };

  const testInitializeContentSections = async () => {
    addResult('Testing content sections initialization...');
    try {
      const result = await initializeCategoryContentSections();
      addResult(`Content sections initialization result: ${result}`);
    } catch (err) {
      addResult(`Content sections initialization failed: ${err}`);
    }
  };

  const testCategoryService = async () => {
    addResult('Testing category service...');
    try {
      const content = await categoryService.fetchContent();
      addResult(`Category service result: ${content.categories.length} categories loaded`);
      addResult(`Heading: ${content.heading}`);
      addResult(`Subheading: ${content.subheading}`);
      if (content.categories.length > 0) {
        addResult(`First category: ${JSON.stringify(content.categories[0])}`);
      }
    } catch (err) {
      addResult(`Category service failed: ${err}`);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Categories Debug Panel</h2>
      
      <div className="space-x-2 mb-4">
        <Button onClick={testDatabaseConnection}>Test DB Connection</Button>
        <Button onClick={testCategoriesTable}>Test Categories Table</Button>
        <Button onClick={testInitializeCategories}>Initialize Categories</Button>
        <Button onClick={testInitializeContentSections}>Initialize Content Sections</Button>
        <Button onClick={testCategoryService}>Test Category Service</Button>
        <Button onClick={clearResults} variant="outline">Clear Results</Button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
        <h3 className="font-semibold mb-2">Debug Results:</h3>
        {results.length === 0 ? (
          <p className="text-gray-500">No results yet. Click a button to test.</p>
        ) : (
          <div className="space-y-1">
            {results.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugCategories;
