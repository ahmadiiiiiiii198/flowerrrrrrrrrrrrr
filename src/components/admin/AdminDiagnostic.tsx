import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const AdminDiagnostic = () => {
  const [diagnostics, setDiagnostics] = useState<Array<{
    test: string;
    status: 'success' | 'error' | 'warning';
    message: string;
    error?: any;
  }>>([]);

  const addDiagnostic = (test: string, status: 'success' | 'error' | 'warning', message: string, error?: any) => {
    setDiagnostics(prev => [...prev, { test, status, message, error }]);
  };

  const runDiagnostics = async () => {
    setDiagnostics([]);
    
    // Test 1: Basic imports
    try {
      addDiagnostic('Basic Imports', 'success', 'React and UI components imported successfully');
    } catch (error) {
      addDiagnostic('Basic Imports', 'error', `Import error: ${error.message}`, error);
    }

    // Test 2: Supabase client
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      addDiagnostic('Supabase Client', 'success', 'Supabase client imported successfully');
    } catch (error) {
      addDiagnostic('Supabase Client', 'error', `Supabase client error: ${error.message}`, error);
    }

    // Test 3: Settings service
    try {
      const { settingsService } = await import('@/services/settingsService');
      addDiagnostic('Settings Service', 'success', 'Settings service imported successfully');
    } catch (error) {
      addDiagnostic('Settings Service', 'error', `Settings service error: ${error.message}`, error);
    }

    // Test 4: useHeroContent hook
    try {
      const { useHeroContent } = await import('@/hooks/use-settings');
      addDiagnostic('useHeroContent Hook', 'success', 'useHeroContent hook imported successfully');
    } catch (error) {
      addDiagnostic('useHeroContent Hook', 'error', `useHeroContent hook error: ${error.message}`, error);
    }

    // Test 5: HeroContentEditor component
    try {
      const HeroContentEditor = await import('@/components/admin/HeroContentEditor');
      addDiagnostic('HeroContentEditor', 'success', 'HeroContentEditor component imported successfully');
    } catch (error) {
      addDiagnostic('HeroContentEditor', 'error', `HeroContentEditor error: ${error.message}`, error);
    }

    // Test 6: HeroDebugger component
    try {
      const HeroDebugger = await import('@/components/admin/HeroDebugger');
      addDiagnostic('HeroDebugger', 'success', 'HeroDebugger component imported successfully');
    } catch (error) {
      addDiagnostic('HeroDebugger', 'error', `HeroDebugger error: ${error.message}`, error);
    }

    // Test 7: Database connection
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.from('settings').select('count').limit(1);
      if (error) {
        addDiagnostic('Database Connection', 'warning', `Database warning: ${error.message}`, error);
      } else {
        addDiagnostic('Database Connection', 'success', 'Database connection successful');
      }
    } catch (error) {
      addDiagnostic('Database Connection', 'error', `Database connection error: ${error.message}`, error);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Panel Diagnostics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {diagnostics.map((diagnostic, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded">
              {getIcon(diagnostic.status)}
              <div className="flex-1">
                <div className="font-medium">{diagnostic.test}</div>
                <div className="text-sm text-gray-600">{diagnostic.message}</div>
                {diagnostic.error && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-gray-500">Error Details</summary>
                    <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {diagnostic.error.stack || diagnostic.error.toString()}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
        <Button onClick={runDiagnostics} className="mt-4 w-full">
          Run Diagnostics Again
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminDiagnostic;
