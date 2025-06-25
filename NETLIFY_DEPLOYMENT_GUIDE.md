# 🚀 Netlify Deployment Guide

## 📋 **Prerequisites**
- ✅ GitHub repository: `https://github.com/ahmadiiiiiiii198/flowerrrrrrrrrrrrr.git`
- ✅ Production build tested and working
- ✅ All TypeScript errors fixed
- ✅ Netlify configuration files ready

## 🔧 **Step 1: Deploy to Netlify**

### **Option A: Git Integration (Recommended)**
1. **Go to Netlify**: https://netlify.com
2. **Click**: "New site from Git"
3. **Choose**: GitHub
4. **Select Repository**: `ahmadiiiiiiii198/flowerrrrrrrrrrrrr`
5. **Build Settings** (auto-detected from `netlify.toml`):
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: 18

### **Option B: Manual Deploy**
1. **Build locally**: `npm run build`
2. **Drag & drop** the `dist/` folder to Netlify dashboard

## 🔑 **Step 2: Configure Environment Variables**

In your Netlify site dashboard, go to **Site settings → Environment variables** and add:

### **Required Variables:**
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://despodpgvkszyexvcbft.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlc3BvZHBndmtzenlleHZjYmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTcyMTAsImV4cCI6MjA2MzkzMzIxMH0.zyjFQA-Kr317M5l_6qjV_a-6ED2iU4wraRuYaa0iGEg

# Stripe Configuration (LIVE KEYS - Use your actual keys)
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_secret_key_here

# Optional (for webhooks)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 🎯 **Step 3: Configure Stripe in Database**

After deployment, you need to configure Stripe in your database:

### **Option A: Use Admin Panel**
1. **Visit**: `https://your-site.netlify.app/admin`
2. **Login** with admin credentials
3. **Go to**: Stripe Settings tab
4. **Enter your Stripe keys**:
   - **Publishable Key**: `pk_live_your_publishable_key_here`
   - **Secret Key**: `sk_live_your_secret_key_here`
5. **Set**: Live Mode (uncheck "Test Mode")
6. **Click**: Save Configuration

### **Option B: Use Setup Script**
1. **Set environment variables** with your Stripe keys
2. **Run**: `node setup-stripe.js`

## 🔍 **Step 4: Test Deployment**

### **Basic Tests:**
1. **Visit your site**: `https://your-site.netlify.app`
2. **Check pages**: Home, Products, Gallery, Contact, Order
3. **Test admin panel**: `/admin`
4. **Test order dashboard**: `/orders`

### **Stripe Integration Test:**
1. **Go to**: Admin Panel → Stripe Settings
2. **Click**: "Test Integration"
3. **Verify**: All tests pass
4. **Test**: Place a test order (use Stripe test cards)

## 🌐 **Step 5: Custom Domain (Optional)**

1. **In Netlify dashboard**: Domain settings
2. **Add custom domain**: `your-domain.com`
3. **Configure DNS**: Point to Netlify
4. **Enable HTTPS**: Automatic SSL certificate

## 📊 **Step 6: Monitor & Maintain**

### **Monitoring:**
- **Netlify Analytics**: Built-in traffic monitoring
- **Deploy logs**: Check for build issues
- **Function logs**: Monitor Supabase Edge Functions

### **Updates:**
- **Git push**: Automatic deployment on push to main branch
- **Environment variables**: Update in Netlify dashboard
- **Database**: Manage through Supabase dashboard

## 🎉 **Deployment Complete!**

Your Francesco Fiori & Piante website is now live with:
- ✅ **Live Stripe payments** configured
- ✅ **Real-time order management**
- ✅ **Admin panel** for content management
- ✅ **Mobile-responsive** design
- ✅ **SEO optimized** with proper meta tags
- ✅ **PWA features** for mobile app-like experience

## 🆘 **Troubleshooting**

### **Common Issues:**
1. **Build fails**: Check Node version (should be 18)
2. **Stripe not working**: Verify environment variables
3. **Database connection**: Check Supabase keys
4. **404 errors**: Ensure `_redirects` file is in place

### **Support:**
- **Netlify Docs**: https://docs.netlify.com
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs

---

**🚀 Your flower shop website is ready for customers! 🌸**
