# Development Environment Setup

## 🖥️ Local Development Environment

This guide covers setting up a complete development environment for the Interactive Ideas Platform, including all necessary tools, configurations, and best practices.

## 📋 Prerequisites

### Hardware Requirements

**Minimum**:
- **CPU**: Dual-core processor (Intel i3/AMD equivalent or better)
- **RAM**: 8GB
- **Storage**: 20GB free disk space
- **Network**: Stable internet connection (10 Mbps+)

**Recommended**:
- **CPU**: Quad-core processor (Intel i5/AMD Ryzen 5 or better)
- **RAM**: 16GB or more
- **Storage**: 50GB SSD free space
- **Network**: High-speed broadband (50 Mbps+)

### Operating System Support

**Supported Platforms**:
- **Windows**: 10 (version 2004+) or 11
- **macOS**: 10.15 (Catalina) or later
- **Linux**: Ubuntu 18.04+, CentOS 7+, or equivalent

**Not Supported**:
- Windows versions older than 10
- macOS versions older than 10.15

## 🛠️ Development Tools Installation

### Node.js & npm

#### Windows Installation

```powershell
# Using winget (recommended)
winget install OpenJS.NodeJS

# Or using chocolatey
choco install nodejs

# Verify installation
node --version
npm --version
```

#### macOS Installation

```bash
# Using Homebrew
brew install node

# Or download from nodejs.org
# Install LTS version

# Verify installation
node --version
npm --version
```

#### Linux Installation

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

### Git Version Control

#### Windows

```powershell
# Using winget
winget install Git.Git

# Or using chocolatey
choco install git

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

#### macOS

```bash
# Using Homebrew
brew install git

# Or Xcode Command Line Tools
xcode-select --install

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

#### Linux

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install git

# CentOS/RHEL
sudo yum install git

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Code Editor: Visual Studio Code

#### Installation

**Windows**:
```powershell
winget install Microsoft.VisualStudioCode
```

**macOS**:
```bash
# Using Homebrew
brew install --cask visual-studio-code
```

**Linux**:
```bash
# Ubuntu/Debian
sudo snap install code --classic

# Or using .deb package
wget -O code.deb https://go.microsoft.com/fwlink/?LinkID=760868
sudo dpkg -i code.deb
```

#### Recommended VS Code Extensions

Install these extensions for optimal development experience:

```bash
# Install essential extensions
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
code --install-extension usernamehw.errorlens
code --install-extension christian-kohler.path-intellisense
code --install-extension ms-vscode.vscode-json
code --install-extension formulahendry.auto-rename-tag
code --install-extension ms-vscode.vscode-eslint
```

### Terminal Setup

#### Windows Terminal (Recommended)

```powershell
winget install Microsoft.WindowsTerminal
```

#### Configure Terminal Profile

Create a profile for efficient development:

```json
{
  "guid": "{07b52e3e-de2c-5db4-bd2d-ba144ed6c273}",
  "hidden": false,
  "name": "Git Bash",
  "source": "Git",
  "commandline": "\"%PROGRAMFILES%\\Git\\bin\\bash.exe\"",
  "icon": "%PROGRAMFILES%\\Git\\mingw64\\share\\git\\git-for-windows.ico",
  "startingDirectory": "%USERPROFILE%"
}
```

## 🔧 Project Setup

### Clone Repository

```bash
# Create projects directory
mkdir ~/projects
cd ~/projects

# Clone the repository
git clone https://github.com/your-org/interactive-ideas-platform.git
cd interactive-ideas-platform
```

### Install Dependencies

```bash
# Install all project dependencies
npm install

# Verify installation
npm list --depth=0
```

### Environment Configuration

#### Create Environment Files

```bash
# Copy example environment file
cp .env.example .env.local

# Edit with your values
code .env.local
```

#### Environment Variables Setup

```bash
# .env.local
# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=https://your-dev-deployment.convex.cloud

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here

# Development settings
NEXT_PUBLIC_DEBUG=true
NODE_ENV=development
```

## 🚀 Running the Development Environment

### Start Convex Backend

```bash
# Terminal 1: Start Convex development server
npx convex dev
```

**Expected Output**:
```
Convex development server started
Dashboard: https://dashboard.convex.dev
URL: https://your-deployment-url.convex.cloud
```

### Start Next.js Frontend

```bash
# Terminal 2: Start Next.js development server
npm run dev
```

**Expected Output**:
```
Next.js development server started
Local: http://localhost:3000
Ready in 2.3s
```

### Verify Setup

Open browser and navigate to `http://localhost:3000`

## 🔍 Development Workflow

### Code Editor Configuration

#### VS Code Settings

Create workspace settings for consistent development:

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "shortest",
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "emmet.includeLanguages": {
    "typescriptreact": "html"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

#### Launch Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

### Git Workflow

#### Branch Naming Convention

```bash
# Feature branches
git checkout -b feature/user-authentication
git checkout -b feature/idea-creation-form

# Bug fix branches
git checkout -b bugfix/login-validation
git checkout -b bugfix/mobile-responsive

# Hotfix branches
git checkout -b hotfix/critical-security-patch
```

#### Commit Message Format

```bash
# Format: type(scope): description
git commit -m "feat(auth): add social login providers"
git commit -m "fix(ui): resolve mobile layout overflow"
git commit -m "docs(setup): update installation instructions"
git commit -m "refactor(api): optimize database queries"
```

### Testing Setup

#### Unit Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

#### End-to-End Testing

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui
```

## 🐛 Debugging & Troubleshooting

### Common Development Issues

#### Port Conflicts

```bash
# Find process using port
lsof -ti:3000

# Kill process
kill -9 <PID>

# Or use different port
npm run dev -- -p 3001
```

#### Node Modules Issues

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Cache Issues

```bash
# Clear Next.js cache
rm -rf .next

# Clear npm cache
npm cache clean --force
```

### Performance Optimization

#### Development Performance

```bash
# Enable Turbopack for faster builds
npm run dev  # Already configured in package.json

# Enable fast refresh
# Already configured in next.config.ts
```

#### Bundle Analysis

```bash
# Analyze bundle size
npm run build:analyze

# View bundle analyzer report
open .next/analyze/client.html
```

## 🔒 Security Best Practices

### Environment Security

```bash
# Never commit secrets
echo ".env*" >> .gitignore

# Use environment-specific variables
# Development: .env.local
# Production: Environment variables in hosting platform
```

### Code Security

- Enable ESLint security rules
- Use TypeScript for type safety
- Regular dependency updates
- Code review requirements

## 📊 Monitoring & Analytics

### Development Monitoring

#### Console Logging

```typescript
// Development logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data)
}
```

#### Performance Monitoring

```typescript
// Performance measurement
const startTime = performance.now()
// ... code to measure
const endTime = performance.now()
console.log(`Operation took ${endTime - startTime} milliseconds`)
```

## 🚀 Deployment Preparation

### Build Optimization

```bash
# Production build
npm run build

# Test production build
npm run start
```

### Environment Validation

```bash
# Validate environment variables
npm run validate-env

# Check for security vulnerabilities
npm audit

# Run comprehensive test suite
npm run test:all
```

## 📚 Additional Resources

### Learning Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Convex Documentation**: https://docs.convex.dev
- **Clerk Documentation**: https://clerk.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

### Community Support

- **GitHub Issues**: Report bugs and request features
- **Stack Overflow**: Get help with technical questions
- **Discord Community**: Join developer discussions
- **Reddit**: r/nextjs, r/reactjs, r/typescript

### Development Tools

- **VS Code Extensions Marketplace**: Discover more helpful extensions
- **npm Trends**: Compare package popularity and maintenance
- **Bundle Analyzer**: Optimize bundle size
- **Lighthouse**: Performance auditing

## ✅ Development Environment Checklist

- [ ] Node.js and npm installed and configured
- [ ] Git installed and configured
- [ ] VS Code installed with recommended extensions
- [ ] Repository cloned successfully
- [ ] Dependencies installed without errors
- [ ] Environment variables configured
- [ ] Development servers starting successfully
- [ ] Application accessible at localhost:3000
- [ ] Authentication flow working
- [ ] Basic functionality tested
- [ ] Tests passing
- [ ] Code formatting and linting working

Your development environment is now ready for productive development on the Interactive Ideas Platform!