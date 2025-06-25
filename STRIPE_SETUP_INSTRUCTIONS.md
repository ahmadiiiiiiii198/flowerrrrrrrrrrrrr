# 🔧 Fix "Failed to Create Checkout Session" Error

## 🎯 **The Problem**
Your Netlify deployment shows:
- ✅ **Stripe Configuration Loaded** - OK
- ❌ **Edge Function Reachable** - FAIL  
- ❌ **Stripe Client Initialized** - FAIL

**Error: Edge function not reachable: Failed to fetch**

## 🔧 **Solution Steps**

### **Step 1: Configure Stripe Keys in Database**

1. **Go to your admin panel:**
   - Visit: `https://your-site.netlify.app/admin`
   - Login with admin credentials

2. **Navigate to Stripe Settings:**
   - Click on the "Stripe" tab
   - Click on "API Keys" sub-tab

3. **Enter your Stripe keys:**
   ```
   Publishable Key: pk_live_your_publishable_key_here
   Secret Key: sk_live_your_secret_key_here
   ```

4. **Set to Live Mode:**
   - Uncheck "Test Mode" checkbox
   - Click "Save Configuration"

5. **Test the configuration:**
   - Click "Test Integration" tab
   - Click "Test Stripe API" button
   - Should show: ✅ Stripe Configuration Loaded - OK

### **Step 2: Deploy Supabase Edge Functions**

The checkout requires Supabase Edge Functions. You have two options:

#### **Option A: Deploy Edge Functions (Recommended)**

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Deploy the functions:**
   ```bash
   supabase functions deploy create-checkout-session --project-ref despodpgvkszyexvcbft
   supabase functions deploy verify-payment --project-ref despodpgvkszyexvcbft
   ```

#### **Option B: Use Mock Payments (Temporary)**

If you can't deploy Edge Functions immediately:

1. **Go to admin panel → Stripe Settings → Test Integration**
2. **The system will automatically use mock payments when Edge Functions fail**
3. **This allows testing the flow without real payments**

### **Step 3: Test the Payment Flow**

1. **Visit your website**
2. **Add items to cart**
3. **Go through checkout process**
4. **Click "Pay with Stripe"**
5. **Should redirect to Stripe checkout page**

### **Step 4: Verify Everything Works**

1. **Admin Panel Test:**
   - Go to `/admin` → Stripe Settings → Test Integration
   - Should show: ✅ Stripe Configuration Loaded - OK
   - Edge Function may still show FAIL (this is OK if using Option B)

2. **Live Payment Test:**
   - Place a real order
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

## 🚨 **Quick Fix Commands**

If the admin panel doesn't work, run this in your browser console on the admin page:

```javascript
// Go to /admin, open browser console (F12), and run:
fetch('/api/supabase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    table: 'settings',
    action: 'upsert',
    data: {
      key: 'stripeConfig',
      value: {
        publishableKey: 'pk_live_your_publishable_key_here',
        secretKey: 'sk_live_your_secret_key_here',
        webhookSecret: '',
        isTestMode: false
      }
    }
  })
});
```

## 🎉 **Expected Result**

After following these steps:
- ✅ **Stripe Configuration Loaded** - OK
- ✅ **Payment Flow** - Should work
- ✅ **Orders** - Should be created successfully
- ✅ **Stripe Checkout** - Should redirect properly

## 📞 **Need Help?**

If you're still having issues:
1. Check browser console for error messages
2. Verify Stripe keys are correct
3. Test with Stripe test cards first
4. Contact support if Edge Functions deployment fails

**The most important step is Step 1 - configuring Stripe in your database!**
