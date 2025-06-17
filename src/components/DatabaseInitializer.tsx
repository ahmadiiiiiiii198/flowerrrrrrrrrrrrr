import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { initializeDatabase, testDatabaseConnection } from '@/utils/initializeDatabase';
import { Loader2, Database, CheckCircle, XCircle } from 'lucide-react';

const DatabaseInitializer = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [initResult, setInitResult] = useState<boolean | null>(null);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    addLog('Testing database connection...');
    
    try {
      const result = await testDatabaseConnection();
      setTestResult(result);
      addLog(result ? 'Database connection successful!' : 'Database connection failed!');
    } catch (error) {
      setTestResult(false);
      addLog(`Database connection error: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleInitialize = async () => {
    setIsInitializing(true);
    setInitResult(null);
    addLog('Starting database initialization...');
    
    try {
      const result = await initializeDatabase();
      setInitResult(result);
      addLog(result ? 'Database initialization successful!' : 'Database initialization failed!');
    } catch (error) {
      setInitResult(false);
      addLog(`Database initialization error: ${error}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setInitResult(null);
    setTestResult(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Initializer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={handleTestConnection} 
            disabled={isTesting}
            variant="outline"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>

          <Button 
            onClick={handleInitialize} 
            disabled={isInitializing}
          >
            {isInitializing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Initialize Database
              </>
            )}
          </Button>

          <Button onClick={clearLogs} variant="outline">
            Clear Logs
          </Button>
        </div>

        {/* Status indicators */}
        <div className="flex gap-4">
          {testResult !== null && (
            <div className={`flex items-center gap-2 ${testResult ? 'text-green-600' : 'text-red-600'}`}>
              {testResult ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span className="text-sm font-medium">
                Connection: {testResult ? 'Success' : 'Failed'}
              </span>
            </div>
          )}

          {initResult !== null && (
            <div className={`flex items-center gap-2 ${initResult ? 'text-green-600' : 'text-red-600'}`}>
              {initResult ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span className="text-sm font-medium">
                Initialization: {initResult ? 'Success' : 'Failed'}
              </span>
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="bg-gray-100 p-4 rounded-lg max-h-64 overflow-y-auto">
          <h3 className="font-semibold mb-2">Logs:</h3>
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm">No logs yet. Click a button to start.</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="text-sm font-mono text-gray-700">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>First, test the database connection</li>
            <li>If connection is successful, initialize the database</li>
            <li>After initialization, check the admin panel for category image sections</li>
            <li>You should see "Category Images: Matrimoni", "Category Images: Fiori & Piante", etc.</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseInitializer;
