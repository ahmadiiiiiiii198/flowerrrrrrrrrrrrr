import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { settingsService } from '@/services/settingsService';
import { preloadImage } from '@/utils/imageLoadingUtils';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

const ComprehensiveTest = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTest = (result: TestResult) => {
    setTests(prev => [...prev, result]);
  };

  const updateTest = (name: string, updates: Partial<TestResult>) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, ...updates } : test
    ));
  };

  const runComprehensiveTests = async () => {
    setIsRunning(true);
    setTests([]);

    // Test 1: Database Connection
    addTest({ name: 'Database Connection', status: 'pending', message: 'Testing connection...' });
    try {
      const { data, error } = await supabase.from('settings').select('key').limit(1);
      if (error) throw error;
      updateTest('Database Connection', { 
        status: 'success', 
        message: 'Database connected successfully' 
      });
    } catch (error) {
      updateTest('Database Connection', { 
        status: 'error', 
        message: `Connection failed: ${error.message}` 
      });
    }

    // Test 2: Settings Table Access
    addTest({ name: 'Settings Table', status: 'pending', message: 'Checking settings table...' });
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['logoSettings', 'heroContent']);
      
      if (error) throw error;
      
      const logoSettings = data?.find(s => s.key === 'logoSettings');
      const heroContent = data?.find(s => s.key === 'heroContent');
      
      if (!logoSettings || !heroContent) {
        updateTest('Settings Table', { 
          status: 'warning', 
          message: `Missing settings: ${!logoSettings ? 'logoSettings ' : ''}${!heroContent ? 'heroContent' : ''}`,
          details: data
        });
      } else {
        updateTest('Settings Table', { 
          status: 'success', 
          message: 'All required settings found',
          details: data
        });
      }
    } catch (error) {
      updateTest('Settings Table', { 
        status: 'error', 
        message: `Settings access failed: ${error.message}` 
      });
    }

    // Test 3: Settings Service
    addTest({ name: 'Settings Service', status: 'pending', message: 'Testing settings service...' });
    try {
      const logoSettings = await settingsService.getSetting('logoSettings', null);
      const heroContent = await settingsService.getSetting('heroContent', null);
      
      if (logoSettings && heroContent) {
        updateTest('Settings Service', { 
          status: 'success', 
          message: 'Settings service working correctly',
          details: { logoSettings, heroContent }
        });
      } else {
        updateTest('Settings Service', { 
          status: 'warning', 
          message: 'Settings service returned null values'
        });
      }
    } catch (error) {
      updateTest('Settings Service', { 
        status: 'error', 
        message: `Settings service failed: ${error.message}` 
      });
    }

    // Test 4: Logo Image Loading
    addTest({ name: 'Logo Image Loading', status: 'pending', message: 'Testing logo image...' });
    try {
      const logoUrl = "https://despodpgvkszyexvcbft.supabase.co/storage/v1/object/public/uploads/logos/1749735172947-oi6nr6gnk7.png";
      const result = await preloadImage(logoUrl, { timeout: 5000 });
      
      if (result.success) {
        updateTest('Logo Image Loading', { 
          status: 'success', 
          message: 'Logo image loads successfully' 
        });
      } else {
        updateTest('Logo Image Loading', { 
          status: 'error', 
          message: `Logo image failed to load: ${result.error}` 
        });
      }
    } catch (error) {
      updateTest('Logo Image Loading', { 
        status: 'error', 
        message: `Logo test failed: ${error.message}` 
      });
    }

    // Test 5: Hero Background Image
    addTest({ name: 'Hero Background Image', status: 'pending', message: 'Testing hero background...' });
    try {
      const bgUrl = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80";
      const result = await preloadImage(bgUrl, { timeout: 5000 });
      
      if (result.success) {
        updateTest('Hero Background Image', { 
          status: 'success', 
          message: 'Hero background image loads successfully' 
        });
      } else {
        updateTest('Hero Background Image', { 
          status: 'error', 
          message: `Hero background failed to load: ${result.error}` 
        });
      }
    } catch (error) {
      updateTest('Hero Background Image', { 
        status: 'error', 
        message: `Hero background test failed: ${error.message}` 
      });
    }

    // Test 6: Component Rendering
    addTest({ name: 'Component Rendering', status: 'pending', message: 'Checking component rendering...' });
    try {
      const headerElement = document.querySelector('header');
      const heroElement = document.querySelector('#home');
      
      if (headerElement && heroElement) {
        updateTest('Component Rendering', { 
          status: 'success', 
          message: 'Header and Hero components rendered successfully' 
        });
      } else {
        updateTest('Component Rendering', { 
          status: 'warning', 
          message: `Missing components: ${!headerElement ? 'Header ' : ''}${!heroElement ? 'Hero' : ''}` 
        });
      }
    } catch (error) {
      updateTest('Component Rendering', { 
        status: 'error', 
        message: `Component check failed: ${error.message}` 
      });
    }

    setIsRunning(false);
  };

  useEffect(() => {
    // Auto-run tests after a short delay
    const timer = setTimeout(() => {
      runComprehensiveTests();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const totalTests = tests.length;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border max-w-md max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">Comprehensive Test Results</h3>
        <div className="text-xs">
          {isRunning ? (
            <span className="text-blue-600">Running...</span>
          ) : (
            <span className={`${successCount === totalTests ? 'text-green-600' : 'text-red-600'}`}>
              {successCount}/{totalTests} Passed
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {tests.map((test, index) => (
          <div key={index} className={`p-2 rounded border ${getStatusColor(test.status)}`}>
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(test.status)}
              <span className="font-medium text-xs">{test.name}</span>
            </div>
            <div className="text-xs text-gray-600 ml-6">
              {test.message}
            </div>
            {test.details && (
              <details className="mt-1 ml-6">
                <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
                <pre className="text-xs text-gray-400 mt-1 overflow-x-auto">
                  {JSON.stringify(test.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      <button 
        onClick={runComprehensiveTests}
        disabled={isRunning}
        className="w-full mt-3 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 disabled:opacity-50"
      >
        {isRunning ? 'Running Tests...' : 'Run Tests Again'}
      </button>
    </div>
  );
};

export default ComprehensiveTest;
