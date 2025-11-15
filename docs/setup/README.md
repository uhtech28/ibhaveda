# Setup & Installation Guide

## 🚀 Quick Start

Get the Interactive Ideas Platform up and running in minutes with this comprehensive setup guide.

## 📋 Prerequisites

### System Requirements

**Minimum Requirements**:
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (or pnpm/yarn)
- **Git**: Version 2.25 or higher
- **Operating System**: Windows 10+, macOS 10.15+, or Linux

**Recommended**:
- **Node.js**: Latest LTS version (20.x)
- **RAM**: 8GB or more
- **Disk Space**: 2GB free space
- **Internet**: Stable broadband connection

### Development Tools

**Required**:
- **Code Editor**: VS Code (recommended) or any modern editor
- **Terminal**: Command line interface
- **Git**: Version control system

**Optional but Recommended**:
- **GitHub Account**: For repository access and deployment
- **Vercel Account**: For hosting and deployment
- **Postman/Insomnia**: For API testing

## 🛠️ Installation Steps

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-org/interactive-ideas-platform.git

# Navigate to the project directory
cd interactive-ideas-platform

# Verify the clone was successful
ls -la
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

**Expected Output**:
```
interactive-ideas-platform@0.1.0 /path/to/project
├── @clerk/nextjs@6.31.6
├── @radix-ui/react-* (multiple packages)
├── convex@1.27.0
├── next@15.5.2
├── react@19.1.0
└── tailwindcss@4
```

### Step 3: Environment Configuration

#### Create Environment File

```bash
# Copy the example environment file
cp .env.example .env.local
```

#### Configure Environment Variables

Edit `.env.local` with your actual values:

```bash
# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=https://your-deployment-url.convex.cloud

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
CLERK_SECRET_KEY=sk_test_your_secret_key

# Clerk Redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Optional: Analytics and Monitoring
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
SENTRY_DSN=your_sentry_dsn
```

### Step 4: Set Up Convex Backend

#### Install Convex CLI

```bash
# Install Convex CLI globally
npm install -g convex

# Verify installation
convex --version
```

#### Initialize Convex Project

```bash
# Initialize Convex in your project
convex init

# When prompted, choose:
# - Project name: interactive-ideas-platform
# - Choose your preferred package manager: npm
```

#### Deploy Database Schema

```bash
# Deploy the database schema
convex deploy

# This will create all necessary tables and indexes
```

### Step 5: Set Up Clerk Authentication

#### Create Clerk Application

1. **Sign up/Login to Clerk**: https://clerk.com
2. **Create New Application**:
   - Name: Interactive Ideas Platform
   - Environment: Development
   - Social Providers: Enable Google, GitHub (optional)

3. **Configure URLs**:
   - Home URL: `http://localhost:3000`
   - Sign-in URL: `http://localhost:3000/sign-in`
   - Sign-up URL: `http://localhost:3000/sign-up`
   - After sign-in: `http://localhost:3000/dashboard`
   - After sign-up: `http://localhost:3000/onboarding`

4. **Copy API Keys**:
   - Publishable Key: `pk_test_...`
   - Secret Key: `sk_test_...`

#### Update Environment Variables

Add the Clerk keys to your `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key
CLERK_SECRET_KEY=sk_test_your_actual_key
```

### Step 6: Start Development Servers

#### Start Convex Development Server

```bash
# In terminal window 1
npx convex dev
```

**Expected Output**:
```
Convex development server started
Dashboard: https://dashboard.convex.dev
URL: https://your-deployment-url.convex.cloud
```

#### Start Next.js Development Server

```bash
# In terminal window 2
npm run dev
```

**Expected Output**:
```
Next.js development server started
Local: http://localhost:3000
Ready in 2.3s
```

### Step 7: Verify Installation

#### Test Application Access

1. **Open Browser**: Navigate to `http://localhost:3000`
2. **Check Console**: Open developer tools, verify no errors
3. **Test Authentication**: Try sign-up/sign-in flow
4. **Create Test Idea**: Verify idea creation works

#### Verify Backend Connection

```bash
# Check Convex connection
curl https://your-deployment-url.convex.cloud/version
```

## 🔧 Configuration Options

### Development vs Production

#### Development Configuration

```bash
# .env.local (Development)
NEXT_PUBLIC_CONVEX_URL=https://your-dev-deployment.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Enable development features
NEXT_PUBLIC_DEBUG=true
```

#### Production Configuration

```bash
# .env.local (Production)
NEXT_PUBLIC_CONVEX_URL=https://your-prod-deployment.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Disable development features
NEXT_PUBLIC_DEBUG=false
```

### Optional Integrations

#### Analytics (Vercel Analytics)

```bash
# Enable analytics
NEXT_PUBLIC_ANALYTICS_ID=your_vercel_analytics_id
```

#### Error Monitoring (Sentry)

```bash
# Enable error tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
```

#### Email Service (Optional)

```bash
# For email notifications (future feature)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🐛 Troubleshooting Setup Issues

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 <PID>

# Or use different port
npm run dev -- -p 3001
```

#### 2. Convex Connection Issues

```bash
# Check Convex status
npx convex dev --status

# Reinitialize if needed
rm -rf .convex
npx convex init
```

#### 3. Authentication Not Working

```bash
# Verify environment variables
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Check Clerk dashboard for correct URLs
# Ensure Clerk application is in development mode
```

#### 4. Database Schema Errors

```bash
# Reset Convex data
npx convex run clear

# Redeploy schema
npx convex deploy
```

## 🧪 Testing Setup

### Run Test Suite

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/components/Button.test.tsx

# Run tests in watch mode
npm run test:watch
```

### End-to-End Testing

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e
```

## 🚀 Deployment Preparation

### Build for Production

```bash
# Build the application
npm run build

# Test production build
npm run start
```

### Environment Checklist

- [ ] Convex deployment URL configured
- [ ] Clerk production keys set
- [ ] Environment variables validated
- [ ] Build process successful
- [ ] Database schema deployed
- [ ] Authentication flow tested

## 📚 Additional Resources

### Documentation Links

- **Convex Docs**: https://docs.convex.dev
- **Next.js Docs**: https://nextjs.org/docs
- **Clerk Docs**: https://clerk.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

### Community Support

- **GitHub Issues**: Report bugs and request features
- **Discord Community**: Join our developer community
- **Stack Overflow**: Ask technical questions

### Getting Help

If you encounter issues during setup:

1. **Check Logs**: Review console output for error messages
2. **Verify Prerequisites**: Ensure all requirements are met
3. **Clear Cache**: Delete node_modules and reinstall
4. **Check Documentation**: Review relevant documentation sections
5. **Community Support**: Ask in our Discord or GitHub discussions

## ✅ Setup Verification Checklist

- [ ] Repository cloned successfully
- [ ] Dependencies installed without errors
- [ ] Environment variables configured
- [ ] Convex backend initialized and deployed
- [ ] Clerk authentication configured
- [ ] Development servers running
- [ ] Application accessible at localhost:3000
- [ ] Authentication flow working
- [ ] Idea creation functional
- [ ] No console errors in browser

Once all items are checked, your Interactive Ideas Platform is ready for development!