// Simple test page to verify the system is working

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const TestPage: React.FC = () => {
  const { toast } = useToast();

  console.log('🧪 TestPage component loaded successfully');

  const showToast = () => {
    toast({
      title: '✅ System Working',
      description: 'The website is loading correctly!',
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>🧪 System Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              ✅ Website is Working!
            </h2>
            <p className="text-gray-600 mb-4">
              The server is running and the React components are loading correctly.
            </p>
            
            <Button onClick={showToast} className="mb-4">
              Test Toast Notification
            </Button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🔗 Available Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• <a href="/" className="text-blue-600 hover:underline">Home Page</a></li>
                    <li>• <a href="/orders" className="text-blue-600 hover:underline">Old Order Dashboard</a></li>
                    <li>• <a href="/new-orders" className="text-blue-600 hover:underline">New Order Dashboard</a></li>
                    <li>• <a href="/admin" className="text-blue-600 hover:underline">Admin Panel</a></li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🎯 Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Go to <strong>/new-orders</strong></li>
                    <li>• Use the test panel to create orders</li>
                    <li>• Verify continuous audio notifications</li>
                    <li>• Check notification panel</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestPage;
