-- Fix RLS policies for order deletion
-- This migration ensures that authenticated users (admins) can delete orders and related records

-- Orders table policies
DROP POLICY IF EXISTS "Allow authenticated users to delete orders" ON orders;
CREATE POLICY "Allow authenticated users to delete orders" 
  ON orders 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Order items table policies
DROP POLICY IF EXISTS "Allow authenticated users to delete order items" ON order_items;
CREATE POLICY "Allow authenticated users to delete order items" 
  ON order_items 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Order notifications table policies
DROP POLICY IF EXISTS "Allow authenticated users to delete order notifications" ON order_notifications;
CREATE POLICY "Allow authenticated users to delete order notifications" 
  ON order_notifications 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Order status history table policies
DROP POLICY IF EXISTS "Allow authenticated users to delete order status history" ON order_status_history;
CREATE POLICY "Allow authenticated users to delete order status history" 
  ON order_status_history 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Ensure all tables have RLS enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Add read policies for authenticated users if they don't exist
DO $$
BEGIN
    -- Orders read policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Allow authenticated users to read orders'
    ) THEN
        CREATE POLICY "Allow authenticated users to read orders" 
          ON orders 
          FOR SELECT 
          USING (auth.role() = 'authenticated');
    END IF;

    -- Order items read policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' 
        AND policyname = 'Allow authenticated users to read order items'
    ) THEN
        CREATE POLICY "Allow authenticated users to read order items" 
          ON order_items 
          FOR SELECT 
          USING (auth.role() = 'authenticated');
    END IF;

    -- Order notifications read policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_notifications' 
        AND policyname = 'Allow authenticated users to read order notifications'
    ) THEN
        CREATE POLICY "Allow authenticated users to read order notifications" 
          ON order_notifications 
          FOR SELECT 
          USING (auth.role() = 'authenticated');
    END IF;

    -- Order status history read policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_status_history' 
        AND policyname = 'Allow authenticated users to read order status history'
    ) THEN
        CREATE POLICY "Allow authenticated users to read order status history" 
          ON order_status_history 
          FOR SELECT 
          USING (auth.role() = 'authenticated');
    END IF;
END
$$;

-- Add update policies for authenticated users if they don't exist
DO $$
BEGIN
    -- Orders update policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Allow authenticated users to update orders'
    ) THEN
        CREATE POLICY "Allow authenticated users to update orders" 
          ON orders 
          FOR UPDATE 
          USING (auth.role() = 'authenticated')
          WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- Order items update policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' 
        AND policyname = 'Allow authenticated users to update order items'
    ) THEN
        CREATE POLICY "Allow authenticated users to update order items" 
          ON order_items 
          FOR UPDATE 
          USING (auth.role() = 'authenticated')
          WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- Order notifications update policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_notifications' 
        AND policyname = 'Allow authenticated users to update order notifications'
    ) THEN
        CREATE POLICY "Allow authenticated users to update order notifications" 
          ON order_notifications 
          FOR UPDATE 
          USING (auth.role() = 'authenticated')
          WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- Order status history update policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_status_history' 
        AND policyname = 'Allow authenticated users to update order status history'
    ) THEN
        CREATE POLICY "Allow authenticated users to update order status history" 
          ON order_status_history 
          FOR UPDATE 
          USING (auth.role() = 'authenticated')
          WITH CHECK (auth.role() = 'authenticated');
    END IF;
END
$$;

-- Add insert policies for authenticated users if they don't exist
DO $$
BEGIN
    -- Orders insert policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Allow authenticated users to insert orders'
    ) THEN
        CREATE POLICY "Allow authenticated users to insert orders" 
          ON orders 
          FOR INSERT 
          WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- Order items insert policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' 
        AND policyname = 'Allow authenticated users to insert order items'
    ) THEN
        CREATE POLICY "Allow authenticated users to insert order items" 
          ON order_items 
          FOR INSERT 
          WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- Order notifications insert policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_notifications' 
        AND policyname = 'Allow authenticated users to insert order notifications'
    ) THEN
        CREATE POLICY "Allow authenticated users to insert order notifications" 
          ON order_notifications 
          FOR INSERT 
          WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- Order status history insert policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_status_history' 
        AND policyname = 'Allow authenticated users to insert order status history'
    ) THEN
        CREATE POLICY "Allow authenticated users to insert order status history" 
          ON order_status_history 
          FOR INSERT 
          WITH CHECK (auth.role() = 'authenticated');
    END IF;
END
$$;

-- Also allow public insert for orders (for customer orders)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Allow public to insert orders'
    ) THEN
        CREATE POLICY "Allow public to insert orders" 
          ON orders 
          FOR INSERT 
          WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' 
        AND policyname = 'Allow public to insert order items'
    ) THEN
        CREATE POLICY "Allow public to insert order items" 
          ON order_items 
          FOR INSERT 
          WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_notifications' 
        AND policyname = 'Allow public to insert order notifications'
    ) THEN
        CREATE POLICY "Allow public to insert order notifications" 
          ON order_notifications 
          FOR INSERT 
          WITH CHECK (true);
    END IF;
END
$$;
