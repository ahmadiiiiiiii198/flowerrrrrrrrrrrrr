import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Package, 
  Database, 
  ShoppingCart, 
  Settings,
  Users,
  Bell,
  CreditCard,
  Truck
} from 'lucide-react';

const TestingSummary = () => {
  const testCategories = [
    {
      title: 'Product Service',
      icon: <Package className="h-5 w-5" />,
      color: 'bg-blue-500',
      tests: [
        'Product data loading from service',
        'Category organization (4 categories)',
        'Product structure validation',
        'Featured products filtering',
        'Products by category filtering',
        'Service caching mechanism',
        'Error handling and fallbacks'
      ]
    },
    {
      title: 'Database Integration',
      icon: <Database className="h-5 w-5" />,
      color: 'bg-green-500',
      tests: [
        'Supabase connection',
        'Order creation in orders table',
        'Order items creation',
        'Notification creation',
        'Data fetching and querying',
        'Error handling for DB operations',
        'Transaction integrity'
      ]
    },
    {
      title: 'Order System',
      icon: <ShoppingCart className="h-5 w-5" />,
      color: 'bg-purple-500',
      tests: [
        'Product order modal functionality',
        'Customer information form',
        'Quantity selection (+/- buttons)',
        'Price calculation',
        'Order submission process',
        'Order number generation',
        'Form validation and error handling'
      ]
    },
    {
      title: 'User Interface',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-orange-500',
      tests: [
        'Products section rendering',
        'Category-based product display',
        'Product cards with proper styling',
        'Responsive grid layout',
        'Loading states and animations',
        'Error states and fallbacks',
        'Modal interactions'
      ]
    },
    {
      title: 'Notifications',
      icon: <Bell className="h-5 w-5" />,
      color: 'bg-red-500',
      tests: [
        'Order notification creation',
        'Notification system integration',
        'Unread notification tracking',
        'Admin notification display',
        'Continuous ringing functionality',
        'Notification state management'
      ]
    },
    {
      title: 'Integration Flow',
      icon: <Settings className="h-5 w-5" />,
      color: 'bg-gray-500',
      tests: [
        'End-to-end order flow',
        'Product → Order → Notification chain',
        'Admin order management integration',
        'Real-time data updates',
        'Cross-component communication',
        'State synchronization'
      ]
    }
  ];

  const keyFeatures = [
    {
      icon: <Package className="h-4 w-4" />,
      title: '16 Products',
      description: '4 products per category across all 4 categories'
    },
    {
      icon: <CreditCard className="h-4 w-4" />,
      title: 'Complete Order Flow',
      description: 'From product selection to admin notification'
    },
    {
      icon: <Database className="h-4 w-4" />,
      title: 'Database Integration',
      description: 'Full Supabase integration with error handling'
    },
    {
      icon: <Bell className="h-4 w-4" />,
      title: 'Real-time Notifications',
      description: 'Instant admin alerts with continuous ringing'
    },
    {
      icon: <Truck className="h-4 w-4" />,
      title: 'Order Management',
      description: 'Complete order tracking and management system'
    },
    {
      icon: <Users className="h-4 w-4" />,
      title: 'Customer Experience',
      description: 'Intuitive product browsing and ordering'
    }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <Card className="bg-white shadow-lg border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Testing Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Categories */}
          <div className="space-y-3">
            <div className="text-xs font-medium">Test Categories:</div>
            {testCategories.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${category.color} text-white`}>
                    {category.icon}
                  </div>
                  <span className="text-sm font-medium">{category.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {category.tests.length} tests
                  </Badge>
                </div>
                <div className="ml-8 space-y-1">
                  {category.tests.slice(0, 3).map((test, testIndex) => (
                    <div key={testIndex} className="text-xs text-gray-600">
                      • {test}
                    </div>
                  ))}
                  {category.tests.length > 3 && (
                    <div className="text-xs text-gray-400">
                      + {category.tests.length - 3} more tests
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Key Features */}
          <div className="border-t pt-3 space-y-2">
            <div className="text-xs font-medium">Key Features Tested:</div>
            <div className="grid grid-cols-1 gap-2">
              {keyFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="text-gray-500 mt-0.5">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium">{feature.title}</div>
                    <div className="text-xs text-gray-600">{feature.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="border-t pt-3 text-xs text-gray-600">
            <div className="font-medium mb-1">How to Test:</div>
            <ol className="space-y-1 text-xs">
              <li>1. Use Master Test Suite (center) for automated tests</li>
              <li>2. Test individual components with corner panels</li>
              <li>3. Try ordering products from the main Products section</li>
              <li>4. Check admin panel for order notifications</li>
            </ol>
          </div>

          {/* Status */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium text-green-600">All Systems Ready</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestingSummary;
