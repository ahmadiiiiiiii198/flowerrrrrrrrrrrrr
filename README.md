# 🌸 Francesco Fiori & Piante

**Beautiful flowers and exquisite plants for life's precious moments**

A modern, responsive flower shop website built with React, TypeScript, and Supabase. Features a complete e-commerce system with admin panel, order management, and Stripe integration.

## 🚀 Quick Deployment

**Ready-to-deploy Netlify package available in `netlify-deployment/` folder**

For immediate deployment:
1. Navigate to `netlify-deployment/` folder
2. Follow the instructions in `deployment-guide.md`
3. Deploy the `dist/` folder to Netlify

## ✨ Features

- 🌺 **Modern Flower Shop** - Beautiful, responsive design
- 🛒 **E-commerce System** - Complete order management
- 👨‍💼 **Admin Panel** - Content management system
- 💳 **Stripe Integration** - Secure payment processing
- 📱 **Mobile Responsive** - Optimized for all devices
- 🌐 **Multi-language** - Italian primary, extensible
- ⚡ **Performance Optimized** - Fast loading, SEO ready
- 🔒 **Secure** - Modern security practices

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ and npm 9+
- Git

### Local Development

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd francesco-fiori-piante

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8484`

### Build for Production

```bash
# Build the application
npm run build

# Preview the build
npm run preview
```

## 🏗️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components

### Backend & Database
- **Supabase** - PostgreSQL database with real-time features
- **Row Level Security** - Secure data access
- **Real-time subscriptions** - Live data updates

### Payments & E-commerce
- **Stripe** - Secure payment processing
- **Order management** - Complete order workflow
- **Admin panel** - Content and order management

### Deployment & Performance
- **Netlify** - Optimized for JAMstack deployment
- **Asset optimization** - Automatic image and code optimization
- **SEO ready** - Meta tags, sitemap, robots.txt

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── admin/          # Admin panel components
│   └── ...             # Feature components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API and business logic
├── utils/              # Utility functions
├── integrations/       # Third-party integrations
└── types/              # TypeScript type definitions

netlify-deployment/     # Ready-to-deploy package
├── dist/              # Built application
├── netlify.toml       # Netlify configuration
├── _redirects         # URL routing rules
└── deployment-guide.md # Deployment instructions
```

## 🚀 Deployment

### Option 1: Use Pre-built Package (Recommended)
The `netlify-deployment/` folder contains a complete, ready-to-deploy package:

1. **Navigate to deployment package:**
   ```bash
   cd netlify-deployment/
   ```

2. **Verify package integrity:**
   ```bash
   node verify-deployment.js
   ```

3. **Deploy to Netlify:**
   - Drag `dist/` folder to Netlify dashboard, OR
   - Follow `deployment-guide.md` for Git-based deployment

### Option 2: Build and Deploy Manually
1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy the `dist/` folder** to your preferred hosting platform

### Environment Variables
Required environment variables (set in Netlify dashboard):
```
VITE_SUPABASE_URL=https://despodpgvkszyexvcbft.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📖 Documentation

- **`netlify-deployment/deployment-guide.md`** - Complete deployment instructions
- **`netlify-deployment/DEPLOYMENT_CHECKLIST.md`** - Step-by-step checklist
- **`netlify-deployment/README.md`** - Deployment package overview

## 🎯 Key Features

### Customer Experience
- Beautiful hero section with dynamic content
- Product categories and catalog
- Responsive design for all devices
- Fast loading with optimized images
- Secure checkout with Stripe

### Admin Features
- Content management system
- Order management and tracking
- Image upload and optimization
- Real-time database updates
- Stripe configuration panel

### Technical Features
- Error boundaries and graceful fallbacks
- Real-time data synchronization
- Image optimization and lazy loading
- SEO optimization
- Performance monitoring ready

## 🔧 Configuration

### Database Setup
The application uses Supabase with the following tables:
- `settings` - Application configuration
- `categories` - Product categories
- `products` - Product catalog
- `orders` - Order management
- `content_sections` - Dynamic content

### Admin Panel
Access the admin panel at `/admin` to:
- Configure Stripe payment settings
- Manage product categories and items
- Upload and manage images
- Update website content
- View and manage orders

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private and proprietary to Francesco Fiori & Piante.

## 📞 Support

For deployment or technical support:
- Review the deployment documentation
- Check the troubleshooting guides
- Verify environment variables and database connectivity

---

**Built with ❤️ for Francesco Fiori & Piante**
