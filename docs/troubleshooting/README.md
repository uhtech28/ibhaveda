# Troubleshooting Guide

## 🔧 Overview

This comprehensive troubleshooting guide helps resolve common issues encountered during development, deployment, and usage of the Interactive Ideas Platform.

## 🚀 Development Issues

### Environment Setup Problems

#### Issue: "Command not found" errors

**Symptoms:**
- `npm: command not found`
- `node: command not found`
- `npx: command not found`

**Solutions:**

**Windows:**
```powershell
# Check if Node.js is installed
node --version

# If not installed, download from nodejs.org
# Or use winget
winget install OpenJS.NodeJS

# Add to PATH if needed
# System Properties → Environment Variables → Path
```

**macOS:**
```bash
# Use Homebrew
brew install node

# Or install manually from nodejs.org
# Check if /usr/local/bin is in PATH
echo $PATH
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# Verify installation
node --version
npm --version
```

#### Issue: Permission errors during npm install

**Symptoms:**
- `EACCES: permission denied`
- `npm ERR! Error: EPERM`

**Solutions:**

**Option 1: Use Node Version Manager (Recommended)**
```bash
# Install nvm (Linux/macOS)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js
nvm install 18
nvm use 18

# Windows
# Use nvm-windows: https://github.com/coreybutler/nvm-windows
```

**Option 2: Fix permissions**
```bash
# Linux/macOS
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

#### Issue: Port already in use

**Symptoms:**
- `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions:**

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 <PID>

# Or use different port
npm run dev -- -p 3001
```

### Dependency Issues

#### Issue: Package installation failures

**Symptoms:**
- `npm ERR! code ENOTFOUND`
- `npm ERR! network request to...failed`

**Solutions:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use different registry
npm config set registry https://registry.npmjs.org/

# Try with verbose logging
npm install --verbose
```

#### Issue: Peer dependency conflicts

**Symptoms:**
- `npm WARN ... requires a peer of ...`

**Solutions:**

```bash
# Use npm-force-resolutions (add to package.json)
{
  "scripts": {
    "preinstall": "npx npm-force-resolutions"
  },
  "resolutions": {
    "some-package": "1.2.3"
  }
}

# Or use npm install --legacy-peer-deps
npm install --legacy-peer-deps
```

### Build Issues

#### Issue: TypeScript compilation errors

**Symptoms:**
- `error TS2307: Cannot find module`
- `error TS2322: Type 'X' is not assignable to type 'Y'`

**Solutions:**

```bash
# Check TypeScript version
npx tsc --version

# Clear TypeScript cache
rm -rf node_modules/.cache

# Regenerate type definitions
npx convex typegen

# Check for missing type definitions
npm install --save-dev @types/package-name
```

#### Issue: ESLint errors blocking build

**Symptoms:**
- Build fails due to linting errors
- `error: 'X' is not defined`

**Solutions:**

```bash
# Run linting separately
npm run lint

# Auto-fix issues
npm run lint:fix

# Configure ESLint rules in .eslintrc.js
{
  "rules": {
    "no-unused-vars": "warn", // Change to warn instead of error
    "@typescript-eslint/no-explicit-any": "off"
  }
}
```

## 🗄️ Database Issues

### Convex Connection Problems

#### Issue: Unable to connect to Convex

**Symptoms:**
- `Error: Could not connect to Convex`
- Development server fails to start

**Solutions:**

```bash
# Check Convex CLI installation
npx convex --version

# Reinitialize Convex
rm -rf .convex
npx convex init

# Check environment variables
echo $NEXT_PUBLIC_CONVEX_URL

# Test connection
curl $NEXT_PUBLIC_CONVEX_URL/version
```

#### Issue: Schema deployment failures

**Symptoms:**
- `convex deploy` fails
- Schema validation errors

**Solutions:**

```bash
# Check schema syntax
npx convex typegen

# Validate schema locally
npx convex dev --validate

# Reset database (CAUTION: destroys data)
npx convex run clear

# Redeploy schema
npx convex deploy
```

#### Issue: Database query timeouts

**Symptoms:**
- Queries taking too long
- `ConvexError: Query timed out`

**Solutions:**

```bash
# Add indexes for slow queries
// In convex/schema.ts
ideas: defineTable({
  // ... fields
  .index("by_author_created", ["authorId", "createdAt"])
})

# Optimize query patterns
// Instead of multiple queries, use batch operations
const [user, ideas] = await Promise.all([
  ctx.db.get(userId),
  ctx.db.query("ideas").withIndex("by_author", q => q.eq("authorId", userId)).collect()
])
```

### Data Migration Issues

#### Issue: Migration scripts fail

**Symptoms:**
- Data transformation errors
- Schema incompatibilities

**Solutions:**

```typescript
// Safe migration pattern
export const migrateUserProfiles = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect()

    for (const user of users) {
      try {
        // Perform migration
        await ctx.db.patch(user._id, {
          migratedAt: Date.now(),
          // ... migration logic
        })
      } catch (error) {
        console.error(`Failed to migrate user ${user._id}:`, error)
        // Continue with other users
      }
    }
  }
})
```

## 🔐 Authentication Issues

### Clerk Configuration Problems

#### Issue: Authentication not working

**Symptoms:**
- Users can't sign in/sign up
- Redirect loops
- Invalid token errors

**Solutions:**

```bash
# Check environment variables
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY

# Verify Clerk URLs match application
# In Clerk dashboard:
# - Home URL: http://localhost:3000 (dev) or https://yourdomain.com (prod)
# - Sign-in URL: /sign-in
# - Sign-up URL: /sign-up
# - After sign-in: /dashboard

# Clear Clerk session
localStorage.clear()
sessionStorage.clear()
```

#### Issue: Social login failures

**Symptoms:**
- OAuth redirects fail
- Social provider errors

**Solutions:**

```bash
# Check social provider configuration in Clerk
# Ensure callback URLs are correct
# Verify API keys are valid

# Test OAuth flow manually
# Check browser network tab for errors
```

### Session Management Issues

#### Issue: Unexpected logouts

**Symptoms:**
- Users logged out unexpectedly
- Session persistence problems

**Solutions:**

```typescript
// Check session configuration
// In Clerk dashboard → Sessions
// - Session timeout: appropriate duration
// - Remember me: enabled if desired

// Handle session refresh
import { useUser } from '@clerk/nextjs'

function ProtectedComponent() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>

  return <div>Welcome {user.firstName}!</div>
}
```

## 🚀 Deployment Issues

### Vercel Build Failures

#### Issue: Build fails in production

**Symptoms:**
- Vercel build logs show errors
- Production deployment fails

**Solutions:**

```bash
# Test build locally
npm run build

# Check for missing dependencies
npm ls --depth=0

# Verify environment variables in Vercel
# Dashboard → Project → Settings → Environment Variables

# Check Node.js version in Vercel
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "nodeVersion": "18.x"
}
```

#### Issue: Runtime errors in production

**Symptoms:**
- Application works locally but fails in production
- Environment-specific errors

**Solutions:**

```typescript
// Environment-specific code
const isProduction = process.env.NODE_ENV === 'production'
const apiUrl = isProduction
  ? process.env.NEXT_PUBLIC_PROD_API_URL
  : process.env.NEXT_PUBLIC_DEV_API_URL

// Check for undefined environment variables
if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL is required')
}
```

### Performance Issues

#### Issue: Slow page loads

**Symptoms:**
- High loading times
- Poor Core Web Vitals scores

**Solutions:**

```typescript
// Optimize images
import Image from 'next/image'
<Image src={imageUrl} width={400} height={300} alt="Description" />

// Implement caching
export const revalidate = 3600 // 1 hour

// Code splitting
const HeavyComponent = dynamic(() => import('../components/HeavyComponent'), {
  loading: () => <div>Loading...</div>
})
```

## 🌐 Browser Compatibility Issues

### Cross-browser Problems

#### Issue: Inconsistent behavior across browsers

**Symptoms:**
- Works in Chrome but not Firefox
- CSS layout issues
- JavaScript errors in specific browsers

**Solutions:**

```typescript
// Use CSS vendor prefixes
.element {
  -webkit-border-radius: 5px;
  -moz-border-radius: 5px;
  border-radius: 5px;
}

// Feature detection
if ('serviceWorker' in navigator) {
  // Use service worker
}

// Polyfills for older browsers
import 'core-js/stable'
import 'regenerator-runtime/runtime'
```

#### Issue: Mobile responsiveness issues

**Solutions:**

```css
/* Ensure proper viewport */
<meta name="viewport" content="width=device-width, initial-scale=1">

/* Touch-friendly targets */
.button {
  min-height: 44px;
  min-width: 44px;
}

/* Responsive images */
img {
  max-width: 100%;
  height: auto;
}
```

## 🔧 Development Tool Issues

### VS Code Problems

#### Issue: IntelliSense not working

**Solutions:**

```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.autoImports": true,
  "editor.quickSuggestions": {
    "strings": true
  }
}
```

#### Issue: Debugging not working

**Solutions:**

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

## 📊 Performance Issues

### Bundle Size Problems

#### Issue: Large bundle size

**Solutions:**

```javascript
// Analyze bundle
npm install --save-dev @next/bundle-analyzer

// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false
    }
    return config
  },
  experimental: {
    optimizeCss: true,
  }
}
```

### Memory Leaks

#### Issue: Memory usage growing over time

**Solutions:**

```typescript
// Clean up event listeners
useEffect(() => {
  const handler = () => setCount(c => c + 1)
  window.addEventListener('click', handler)
  return () => window.removeEventListener('click', handler)
}, [])

// Avoid memory leaks in subscriptions
useEffect(() => {
  const unsubscribe = convexClient.subscribe('ideas', callback)
  return unsubscribe
}, [])
```

## 🔍 Testing Issues

### Test Failures

#### Issue: Tests failing inconsistently

**Solutions:**

```typescript
// Use proper cleanup
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Avoid shared state
let counter = 0
beforeEach(() => {
  counter = 0 // Reset for each test
})
```

#### Issue: E2E tests timing out

**Solutions:**

```typescript
// Increase timeout
test('slow operation', async () => {
  test.setTimeout(10000) // 10 seconds
})

// Wait for specific conditions
await page.waitForSelector('.loaded', { timeout: 5000 })
```

## 🌐 Network Issues

### API Connection Problems

#### Issue: API calls failing

**Solutions:**

```typescript
// Add retry logic
const apiCall = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch('/api/data')
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

// Handle offline scenarios
const handleOffline = () => {
  if (!navigator.onLine) {
    showOfflineMessage()
  }
}

window.addEventListener('offline', handleOffline)
```

## 📞 Getting Help

### Debug Information to Collect

When reporting issues, include:

```bash
# System information
node --version
npm --version
npx convex --version

# Environment
echo $NODE_ENV
echo $NEXT_PUBLIC_CONVEX_URL

# Error logs
npm run build 2>&1 | head -50

# Browser console errors
# Copy from browser developer tools
```

### Support Resources

1. **Check Documentation**: Review relevant sections in this docs
2. **Search Issues**: Check GitHub issues for similar problems
3. **Community Help**: Post in Discord or Stack Overflow
4. **Professional Support**: Contact Vercel/Convex/Clerk support

### Issue Reporting Template

```
## Issue Description
Brief description of the problem

## Environment
- OS: [Windows/macOS/Linux]
- Node.js version: [run `node --version`]
- npm version: [run `npm --version`]
- Browser: [Chrome/Firefox/Safari]

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Error Messages
```
error message here
```

## Screenshots
Attach screenshots if applicable

## Additional Context
Any other relevant information
```

This troubleshooting guide covers the most common issues encountered during development and deployment of the Interactive Ideas Platform. Most problems can be resolved by following these systematic approaches.