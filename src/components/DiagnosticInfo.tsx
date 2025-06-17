import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticResult {
  name: string;
  status: 'loading' | 'success' | 'error';
  message: string;
  details?: string;
}

const DiagnosticInfo: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    const diagnostics: DiagnosticResult[] = [];

    // Test 1: Environment Variables
    diagnostics.push({
      name: 'Environment Variables',
      status: 'loading',
      message: 'Checking environment configuration...'
    });
    setResults([...diagnostics]);

    try {
      const hasSupabaseUrl = !!import.meta.env.VITE_SUPABASE_URL;
      const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      diagnostics[0] = {
        name: 'Environment Variables',
        status: hasSupabaseUrl && hasSupabaseKey ? 'success' : 'error',
        message: hasSupabaseUrl && hasSupabaseKey ? 'Environment variables configured' : 'Missing environment variables',
        details: `Supabase URL: ${hasSupabaseUrl ? '✓' : '✗'}, Anon Key: ${hasSupabaseKey ? '✓' : '✗'}`
      };
    } catch (error) {
      diagnostics[0] = {
        name: 'Environment Variables',
        status: 'error',
        message: 'Error checking environment variables',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    setResults([...diagnostics]);

    // Test 2: Supabase Connection
    diagnostics.push({
      name: 'Supabase Connection',
      status: 'loading',
      message: 'Testing database connection...'
    });
    setResults([...diagnostics]);

    try {
      const { error } = await supabase.from('settings').select('key').limit(1);
      diagnostics[1] = {
        name: 'Supabase Connection',
        status: error ? 'error' : 'success',
        message: error ? 'Database connection failed' : 'Database connection successful',
        details: error ? error.message : 'Connected to Supabase successfully'
      };
    } catch (error) {
      diagnostics[1] = {
        name: 'Supabase Connection',
        status: 'error',
        message: 'Database connection error',
        details: error instanceof Error ? error.message : 'Unknown connection error'
      };
    }
    setResults([...diagnostics]);

    // Test 3: Settings Table
    diagnostics.push({
      name: 'Settings Table',
      status: 'loading',
      message: 'Checking settings table...'
    });
    setResults([...diagnostics]);

    try {
      const { data, error } = await supabase.from('settings').select('*').limit(5);
      diagnostics[2] = {
        name: 'Settings Table',
        status: error ? 'error' : 'success',
        message: error ? 'Settings table access failed' : `Settings table accessible (${data?.length || 0} records)`,
        details: error ? error.message : `Found ${data?.length || 0} settings records`
      };
    } catch (error) {
      diagnostics[2] = {
        name: 'Settings Table',
        status: 'error',
        message: 'Settings table error',
        details: error instanceof Error ? error.message : 'Unknown table error'
      };
    }
    setResults([...diagnostics]);

    // Test 4: Logo Settings
    diagnostics.push({
      name: 'Logo Settings',
      status: 'loading',
      message: 'Checking logo configuration...'
    });
    setResults([...diagnostics]);

    try {
      const logoSettings = localStorage.getItem('logoSettings');
      const hasLogoSettings = !!logoSettings;
      diagnostics[3] = {
        name: 'Logo Settings',
        status: hasLogoSettings ? 'success' : 'error',
        message: hasLogoSettings ? 'Logo settings found' : 'Logo settings missing',
        details: hasLogoSettings ? 'Logo configuration available in localStorage' : 'No logo settings found'
      };
    } catch (error) {
      diagnostics[3] = {
        name: 'Logo Settings',
        status: 'error',
        message: 'Logo settings error',
        details: error instanceof Error ? error.message : 'Unknown logo error'
      };
    }
    setResults([...diagnostics]);

    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm"
        >
          <Eye className="h-4 w-4 mr-2" />
          Diagnostics
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">System Diagnostics</CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="w-full"
              size="sm"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run Diagnostics'
              )}
            </Button>

            <Button
              onClick={() => {
                // Clear Stripe cache
                if (window.stripeConfigCache) {
                  delete window.stripeConfigCache;
                }
                localStorage.removeItem('stripeConfig');
                window.location.reload();
              }}
              variant="outline"
              className="w-full"
              size="sm"
            >
              Clear Cache & Reload
            </Button>
          </div>
          
          {results.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 rounded text-xs">
                  {getStatusIcon(result.status)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{result.name}</div>
                    <div className="text-gray-600">{result.message}</div>
                    {result.details && (
                      <div className="text-gray-500 mt-1">{result.details}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosticInfo;
