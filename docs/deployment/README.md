# Deployment Guide

## 🚀 Overview

This guide covers deploying the Interactive Ideas Platform to production using Vercel for the frontend and Convex for the backend, with Clerk for authentication.

## 📋 Deployment Checklist

### Pre-deployment Checklist

- [ ] All tests passing (`npm run test`)
- [ ] Production build successful (`npm run build`)
- [ ] Environment variables configured
- [ ] Database schema deployed to Convex
- [ ] Clerk application configured for production
- [ ] Domain configured (optional)
- [ ] SSL certificate ready (handled by Vercel)

### Environment Requirements

**Production Environment Variables**:
```bash
# Convex (Production)
NEXT_PUBLIC_CONVEX_URL=https://your-prod-deployment.convex.cloud

# Clerk (Production Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Optional: Analytics & Monitoring
NEXT_PUBLIC_ANALYTICS_ID=your_vercel_analytics_id
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Production Settings
NODE_ENV=production
NEXT_PUBLIC_DEBUG=false
```

## 🏗️ Convex Backend Deployment

### Step 1: Prepare Convex for Production

```bash
# Ensure you're in the project directory
cd interactive-ideas-platform

# Deploy database schema to production
npx convex deploy

# This will create/update all tables and indexes
# Follow prompts to confirm deployment
```

### Step 2: Configure Convex Environment

1. **Access Convex Dashboard**: https://dashboard.convex.dev
2. **Select Production Environment**
3. **Configure Environment Variables** (if needed):
   - Convex handles most configuration automatically
   - Add custom environment variables if required

### Step 3: Verify Backend Deployment

```bash
# Test Convex functions
curl https://your-prod-deployment.convex.cloud/version

# Expected response: {"version": "1.x.x"}
```

## ⚛️ Vercel Frontend Deployment

### Method 1: Vercel CLI Deployment

#### Install Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login
```

#### Deploy Application

```bash
# Deploy to production
vercel --prod

# Follow the prompts:
# - Link to existing project or create new
# - Set project name: interactive-ideas-platform
# - Configure build settings (should auto-detect Next.js)
```

#### Configure Environment Variables

```bash
# Set production environment variables
vercel env add NEXT_PUBLIC_CONVEX_URL
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY

# Or use the dashboard method below
```

### Method 2: Vercel Dashboard Deployment

#### Connect Repository

1. **Access Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "New Project"**
3. **Import Git Repository**:
   - Connect GitHub/GitLab account
   - Select repository: `interactive-ideas-platform`
4. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (automatic)

#### Environment Variables Setup

1. **Navigate to Project Settings**
2. **Go to "Environment Variables"**
3. **Add Production Variables**:
   ```
   NEXT_PUBLIC_CONVEX_URL = https://your-prod-deployment.convex.cloud
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_live_your_key
   CLERK_SECRET_KEY = sk_live_your_secret
   NODE_ENV = production
   NEXT_PUBLIC_DEBUG = false
   ```

#### Custom Domain (Optional)

1. **Go to Project Settings → Domains**
2. **Add Custom Domain**: `your-app.com`
3. **Configure DNS**: Follow Vercel's instructions
4. **SSL Certificate**: Automatic (Let's Encrypt)

### Step 4: Deploy and Verify

```bash
# Trigger deployment
vercel --prod

# Or push to main branch for automatic deployment
git push origin main
```

**Monitor Deployment**:
1. Check Vercel dashboard for build status
2. View build logs for any errors
3. Test deployed application
4. Verify all features work in production

## 🔐 Clerk Authentication Setup

### Production Configuration

1. **Access Clerk Dashboard**: https://dashboard.clerk.com
2. **Select Production Instance**
3. **Configure Settings**:

#### Authentication Settings
- **Sign-in & Sign-up**: Configure allowed methods
- **Social Providers**: Enable production OAuth apps
- **Password Policy**: Set security requirements

#### URL Configuration
```
Home URL: https://your-app.com
Sign-in URL: https://your-app.com/sign-in
Sign-up URL: https://your-app.com/sign-up
After sign-in: https://your-app.com/dashboard
After sign-up: https://your-app.com/onboarding
```

#### Domain Settings
- Add your custom domain if using one
- Configure authorized redirect URLs

### API Keys
- **Publishable Key**: `pk_live_...`
- **Secret Key**: `sk_live_...`
- Update environment variables with production keys

## 🔄 Deployment Workflow

### Git-based Deployments

#### Branch Strategy

```bash
# Development workflow
git checkout -b feature/new-feature
# ... make changes
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Create pull request
# Code review and testing
# Merge to main branch

# Automatic deployment triggered
```

#### Deployment Automation

**Vercel Configuration** (`vercel.json`):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/pages/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

### Manual Deployments

```bash
# Deploy specific branch
vercel --prod --ref branch-name

# Deploy with custom environment
vercel --prod --env NODE_ENV=production

# Rollback to previous deployment
vercel rollback
```

## 📊 Performance Optimization

### Build Optimization

#### Next.js Configuration

```javascript
// next.config.js
module.exports = {
  // Enable experimental features for performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Image optimization
  images: {
    domains: ['your-image-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // Compression
  compress: true,

  // Bundle analyzer (conditionally)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      // Add bundle analyzer
      return config
    }
  })
}
```

#### Bundle Analysis

```bash
# Analyze bundle size
npm install --save-dev @next/bundle-analyzer

# Add to package.json scripts
"analyze": "ANALYZE=true npm run build"

# Run analysis
npm run analyze
```

### CDN and Caching

#### Static Asset Optimization

- **Image Optimization**: Automatic WebP/AVIF conversion
- **Font Loading**: `next/font` for optimized font loading
- **CSS Optimization**: Automatic CSS minification
- **JavaScript**: Automatic code splitting and minification

#### Cache Headers

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

## 🔍 Monitoring & Analytics

### Vercel Analytics

1. **Enable Analytics**: Project Settings → Analytics
2. **View Metrics**:
   - Page views and unique visitors
   - Performance metrics (Core Web Vitals)
   - Error rates and response times

### Error Monitoring

#### Sentry Integration

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure Sentry
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

### Performance Monitoring

#### Real User Monitoring (RUM)

```bash
# Install performance monitoring
npm install web-vitals

// pages/_app.js
import { reportWebVitals } from '../utils/analytics'

export function reportWebVitals(metric) {
  // Send to analytics service
  console.log(metric)
}
```

## 🔧 Maintenance & Updates

### Rolling Updates

```bash
# Update dependencies
npm update

# Test updates in development
npm run test

# Deploy updates
npm run build
vercel --prod
```

### Database Migrations

```bash
# Deploy schema changes
npx convex deploy

# Run data migrations (if needed)
npx convex run migrationScript

# Backup data before major changes
npx convex run exportData
```

### Rollback Strategy

```bash
# Quick rollback via Vercel
vercel rollback

# Or redeploy previous commit
git revert HEAD~1
git push origin main
```

## 🚨 Troubleshooting Deployment Issues

### Common Issues

#### 1. Build Failures

```bash
# Check build logs in Vercel dashboard
# Common causes:
# - Missing environment variables
# - TypeScript errors
# - Missing dependencies
# - Build timeout (increase timeout in vercel.json)
```

#### 2. Runtime Errors

```bash
# Check application logs
vercel logs

# Common causes:
# - Environment variable issues
# - Database connection problems
# - Authentication configuration
```

#### 3. Performance Issues

```bash
# Use Vercel Analytics to identify bottlenecks
# Check Core Web Vitals scores
# Optimize images and bundles
# Implement caching strategies
```

#### 4. Database Issues

```bash
# Check Convex dashboard for errors
# Verify schema is deployed
# Check function logs
# Monitor query performance
```

### Health Checks

#### Application Health

```bash
# Test application endpoints
curl https://your-app.com/api/health

# Check database connectivity
curl https://your-convex-url.convex.cloud/version
```

#### Monitoring Alerts

Set up alerts for:
- Application downtime
- Error rate spikes
- Performance degradation
- Database connection issues

## 📈 Scaling Considerations

### Vertical Scaling

- **Serverless Functions**: Automatic scaling with Vercel
- **Database**: Convex handles scaling automatically
- **CDN**: Global content delivery via Vercel Edge

### Horizontal Scaling

- **Load Balancing**: Automatic with Vercel
- **Database Sharding**: Convex manages data distribution
- **Caching**: Implement Redis for session/cache data

### Cost Optimization

- **Function Optimization**: Minimize cold starts
- **Image Optimization**: Reduce bandwidth usage
- **Caching**: Implement appropriate cache headers
- **Monitoring**: Track usage to optimize resource allocation

## 🔒 Security Checklist

### Pre-deployment Security

- [ ] Environment variables not committed
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Authentication properly configured
- [ ] Authorization checks in place
- [ ] Input validation implemented
- [ ] CORS properly configured
- [ ] Security headers set

### Post-deployment Security

- [ ] SSL certificate valid
- [ ] Security monitoring active
- [ ] Regular security updates
- [ ] Access logs monitored
- [ ] Backup procedures in place

## 📚 Additional Resources

### Documentation Links

- **Vercel Deployment**: https://vercel.com/docs/deployments/overview
- **Convex Deployment**: https://docs.convex.dev/production/hosting
- **Clerk Production**: https://clerk.com/docs/deployments/overview
- **Next.js Deployment**: https://nextjs.org/docs/deployment

### Support Resources

- **Vercel Support**: https://vercel.com/help
- **Convex Support**: https://convex.dev/community
- **Clerk Support**: https://clerk.com/support

Your Interactive Ideas Platform is now deployed and ready to serve users! Monitor performance, gather feedback, and iterate on improvements.