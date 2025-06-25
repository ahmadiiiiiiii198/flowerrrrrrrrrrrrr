# 🚀 New Supabase Project Setup Guide

## 📋 **Project Information**
- **New Project ID**: `ijhuoolcnxbdvpqmqofo`
- **New Project URL**: `https://ijhuoolcnxbdvpqmqofo.supabase.co`
- **Region**: `eu-north-1`

## 🔧 **Step 1: Get Your API Keys**

1. **Go to your Supabase dashboard**: https://supabase.com/dashboard/project/ijhuoolcnxbdvpqmqofo/settings/api
2. **Copy the following keys**:
   - **Project URL**: `https://ijhuoolcnxbdvpqmqofo.supabase.co`
   - **anon/public key**: (copy this from the dashboard)
   - **service_role key**: (copy this from the dashboard - keep it secret!)

## 🗄️ **Step 2: Set Up Database Schema**

1. **Go to SQL Editor**: https://supabase.com/dashboard/project/ijhuoolcnxbdvpqmqofo/sql/new
2. **Run the following SQL** (copy and paste each section):

### **A. Create Settings Table**
```sql
-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to settings"
  ON settings FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage settings"
  ON settings FOR ALL USING (auth.role() = 'authenticated');
```

### **B. Create Categories Table**
```sql
-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to categories"
  ON categories FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage categories"
  ON categories FOR ALL USING (auth.role() = 'authenticated');
```

### **C. Create Products Table**
```sql
-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order);
CREATE INDEX IF NOT EXISTS idx_products_metadata ON products USING GIN(metadata);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage products"
  ON products FOR ALL USING (auth.role() = 'authenticated');
```

### **D. Create Orders Table**
```sql
-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  paid_amount DECIMAL(10,2),
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to orders"
  ON orders FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage orders"
  ON orders FOR ALL USING (auth.role() = 'authenticated');
```

### **E. Create Order Items Table**
```sql
-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to order_items"
  ON order_items FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage order_items"
  ON order_items FOR ALL USING (auth.role() = 'authenticated');
```

### **F. Create Helper Function**
```sql
-- Create a function to safely delete an order and all its related records
CREATE OR REPLACE FUNCTION delete_order_cascade(order_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_exists BOOLEAN;
BEGIN
    -- Check if order exists
    SELECT EXISTS(SELECT 1 FROM orders WHERE id = order_uuid) INTO order_exists;
    
    IF NOT order_exists THEN
        RAISE EXCEPTION 'Order with ID % does not exist', order_uuid;
    END IF;
    
    -- Delete order items first (due to foreign key constraint)
    DELETE FROM order_items WHERE order_id = order_uuid;
    
    -- Delete the order
    DELETE FROM orders WHERE id = order_uuid;
    
    -- Return success
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise
        RAISE EXCEPTION 'Failed to delete order %: %', order_uuid, SQLERRM;
END;
$$;
```

## 📝 **Step 3: Insert Default Data**

Run this SQL to populate your database with default content:

```sql
-- Insert default settings
INSERT INTO settings (key, value) VALUES 
('heroContent', '{
  "heading": "Francesco Fiori & Piante",
  "subheading": "Scopri l''eleganza floreale firmata Francesco: fiori, piante e creazioni per ogni occasione. 🌸🌿",
  "backgroundImage": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80"
}'),
('logoSettings', '{
  "logoUrl": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
  "altText": "Francesco Fiori & Piante Logo"
}'),
('contactContent', '{
  "phone": "+39 123 456 7890",
  "email": "info@francescofiori.it",
  "address": "Via dei Fiori 123, Milano, Italia",
  "hours": "Lun-Sab: 8:00-19:00, Dom: 9:00-13:00"
}'),
('stripeConfig', '{
  "publishableKey": "YOUR_STRIPE_PUBLISHABLE_KEY_HERE",
  "secretKey": "YOUR_STRIPE_SECRET_KEY_HERE",
  "webhookSecret": "",
  "isTestMode": false
}')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Insert default categories
INSERT INTO categories (name, description, image_url, sort_order) VALUES 
('Matrimoni', 'Bouquet e decorazioni floreali per matrimoni', 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 1),
('Funerali', 'Composizioni floreali per cerimonie funebri', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 2),
('Compleanni', 'Bouquet e composizioni per compleanni', 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 3),
('Anniversari', 'Fiori romantici per anniversari', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 4),
('San Valentino', 'Rose e bouquet romantici per San Valentino', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 5),
('Piante da Interno', 'Piante verdi per decorare gli interni', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 6)
ON CONFLICT DO NOTHING;
```

## 🔄 **Step 4: Update Project Configuration**

After getting your anon key from Step 1, update the file `src/integrations/supabase/client.ts`:

```typescript
const SUPABASE_URL = "https://ijhuoolcnxbdvpqmqofo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_ANON_KEY_HERE"; // Replace with your actual anon key
```

## 🚀 **Step 5: Deploy Edge Functions**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Deploy Edge Functions
supabase functions deploy create-checkout-session --project-ref ijhuoolcnxbdvpqmqofo
supabase functions deploy verify-payment --project-ref ijhuoolcnxbdvpqmqofo
supabase functions deploy stripe-webhook --project-ref ijhuoolcnxbdvpqmqofo

# Set environment variables for Edge Functions
supabase secrets set SUPABASE_URL=https://ijhuoolcnxbdvpqmqofo.supabase.co --project-ref ijhuoolcnxbdvpqmqofo
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY --project-ref ijhuoolcnxbdvpqmqofo
```

## ✅ **Step 6: Test Everything**

1. **Update your local project** with the new Supabase configuration
2. **Test the admin panel**: Go to `/admin` and check Stripe settings
3. **Test Stripe integration**: Run the Stripe API test
4. **Test payment flow**: Try placing an order

## 📋 **Summary**

After completing these steps, you'll have:
- ✅ New Supabase project fully configured
- ✅ All database tables and policies set up
- ✅ Default data populated
- ✅ Stripe configuration ready
- ✅ Edge Functions deployed
- ✅ Payment system working

**Your flower shop will be fully functional with the new Supabase backend!**
