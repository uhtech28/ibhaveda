# Testing Guide

## 🧪 Overview

This comprehensive testing guide covers all aspects of testing the Interactive Ideas Platform, including unit tests, integration tests, end-to-end tests, and performance testing.

## 📋 Testing Strategy

### Testing Pyramid

```
End-to-End Tests (E2E)
    ↕️
Integration Tests
    ↕️
Unit Tests
    ↕️
Static Analysis
```

### Test Categories

- **Unit Tests**: Individual functions and components
- **Integration Tests**: Component and API interactions
- **End-to-End Tests**: Complete user workflows
- **Performance Tests**: Load and performance validation
- **Accessibility Tests**: WCAG compliance
- **Visual Regression Tests**: UI consistency

## 🛠️ Testing Tools

### Core Testing Framework

**Vitest**: Fast unit testing framework
- Native ESM support
- TypeScript integration
- Jest compatibility mode
- Fast test execution

**Playwright**: End-to-end testing
- Cross-browser testing
- Mobile testing
- API testing
- Visual regression testing

### Testing Utilities

```json
{
  "@testing-library/react": "^13.4.0",
  "@testing-library/jest-dom": "^5.16.5",
  "@testing-library/user-event": "^14.4.3",
  "@playwright/test": "^1.35.1",
  "vitest": "^0.34.1",
  "jsdom": "^22.1.0",
  "msw": "^1.2.1"
}
```

## ⚙️ Configuration

### Vitest Configuration

```typescript
// vitest.config.ts
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### Test Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend expect with jest-dom matchers
expect.extend(matchers)

// Clean up after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:all": "npm run test:run && npm run test:e2e"
  }
}
```

## 🧩 Unit Testing

### Component Testing

#### Basic Component Test

```typescript
// src/components/ui/Button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)

    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole('button', { name: /click me/i }))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies correct variant classes', () => {
    render(<Button variant="destructive">Delete</Button>)

    const button = screen.getByRole('button', { name: /delete/i })
    expect(button).toHaveClass('bg-destructive')
  })
})
```

#### Form Component Testing

```typescript
// src/components/forms/IdeaForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IdeaForm } from './IdeaForm'

const mockCreateIdea = vi.fn()

vi.mock('@/convex/ideas', () => ({
  useMutation: () => mockCreateIdea
}))

describe('IdeaForm', () => {
  it('submits valid form data', async () => {
    const user = userEvent.setup()

    render(<IdeaForm />)

    // Fill form fields
    await user.type(screen.getByLabelText(/title/i), 'Test Idea')
    await user.type(screen.getByLabelText(/description/i), 'Test description')
    await user.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(mockCreateIdea).toHaveBeenCalledWith({
        title: 'Test Idea',
        description: 'Test description',
        category: expect.any(String),
        visibility: 'public'
      })
    })
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()

    render(<IdeaForm />)

    await user.click(screen.getByRole('button', { name: /create/i }))

    expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    expect(screen.getByText(/description is required/i)).toBeInTheDocument()
  })
})
```

### Hook Testing

#### Custom Hook Test

```typescript
// src/hooks/useAuth.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from './useAuth'

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: { id: 'user_123', email: 'test@example.com' },
    isLoaded: true
  })
}))

describe('useAuth', () => {
  it('returns user data when authenticated', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toEqual({
      id: 'user_123',
      email: 'test@example.com'
    })
    expect(result.current.isAuthenticated).toBe(true)
  })
})
```

### Utility Function Testing

```typescript
// src/lib/utils.test.ts
import { cn } from './utils'

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('handles conditional classes', () => {
    expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2')
  })

  it('removes duplicate classes', () => {
    expect(cn('class1', 'class1', 'class2')).toBe('class1 class2')
  })
})
```

## 🔗 Integration Testing

### API Integration Tests

#### Convex Function Testing

```typescript
// convex/ideas.test.ts
import { convexTest } from 'convex-test'
import { api } from './_generated/api'

const t = convexTest()

describe('ideas', () => {
  test('createIdea creates an idea', async () => {
    await t.run(async (ctx) => {
      // Create a test user
      const userId = await ctx.db.insert('users', {
        clerkId: 'test_user',
        username: 'testuser',
        displayName: 'Test User',
        createdAt: Date.now(),
        updatedAt: Date.now()
      })

      // Mock Clerk user
      vi.mocked(getCurrentUserId).mockReturnValue(userId)

      // Create idea
      const result = await ctx.runMutation(api.ideas.createIdea, {
        title: 'Test Idea',
        description: 'Test description',
        category: 'Technology',
        visibility: 'public'
      })

      // Verify idea was created
      const idea = await ctx.db.get(result.ideaId)
      expect(idea.title).toBe('Test Idea')
      expect(idea.authorId).toBe(userId)
    })
  })
})
```

### Component Integration Tests

```typescript
// src/components/IdeaCard.test.tsx
import { render, screen } from '@testing-library/react'
import { IdeaCard } from './IdeaCard'
import { convexTest } from 'convex-test'

const t = convexTest()

describe('IdeaCard Integration', () => {
  test('displays idea data with author info', async () => {
    await t.run(async (ctx) => {
      // Create test data
      const userId = await ctx.db.insert('users', {
        clerkId: 'author_123',
        username: 'johndoe',
        displayName: 'John Doe',
        createdAt: Date.now(),
        updatedAt: Date.now()
      })

      const ideaId = await ctx.db.insert('ideas', {
        authorId: userId,
        title: 'Test Idea',
        description: 'Test description',
        category: 'Technology',
        visibility: 'public',
        sparkCount: 5,
        commentCount: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      })

      const idea = await ctx.db.get(ideaId)
      const author = await ctx.db.get(userId)

      render(<IdeaCard idea={idea} author={author} />)

      expect(screen.getByText('Test Idea')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument() // spark count
    })
  })
})
```

## 🌐 End-to-End Testing

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
})
```

### Authentication Test

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('user can sign up', async ({ page }) => {
    await page.goto('/sign-up')

    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.fill('[name="confirmPassword"]', 'password123')

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/onboarding/)
  })

  test('user can sign in', async ({ page }) => {
    await page.goto('/sign-in')

    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/dashboard/)
  })
})
```

### Idea Creation E2E Test

```typescript
// e2e/idea-creation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Idea Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/sign-in')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('user can create an idea', async ({ page }) => {
    await page.goto('/create-idea')

    // Fill form
    await page.fill('[name="title"]', 'My Brilliant Idea')
    await page.fill('[name="description"]', 'This is a detailed description of my idea...')
    await page.selectOption('[name="category"]', 'Technology')

    // Submit form
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page).toHaveURL(/\/idea\//)
    await expect(page.locator('h1')).toContainText('My Brilliant Idea')
  })

  test('form validation works', async ({ page }) => {
    await page.goto('/create-idea')

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Check validation messages
    await expect(page.locator('text=Title is required')).toBeVisible()
    await expect(page.locator('text=Description is required')).toBeVisible()
  })
})
```

### Collaboration Workflow Test

```typescript
// e2e/collaboration.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Collaboration', () => {
  test('user can request collaboration', async ({ page, context }) => {
    // Create two browser contexts for different users
    const user1Page = page
    const user2Page = await context.newPage()

    // User 1 creates an idea
    await user1Page.goto('/sign-in')
    // ... sign in as user1
    await user1Page.goto('/create-idea')
    // ... create idea
    const ideaUrl = user1Page.url()

    // User 2 views the idea and requests collaboration
    await user2Page.goto('/sign-in')
    // ... sign in as user2
    await user2Page.goto(ideaUrl)
    await user2Page.click('button:has-text("Request Collaboration")')
    await user2Page.fill('[name="message"]', 'I would love to contribute!')
    await user2Page.click('button[type="submit"]')

    // Verify request was sent
    await expect(user2Page.locator('text=Request sent!')).toBeVisible()

    // User 1 sees the request
    await user1Page.reload()
    await expect(user1Page.locator('text=New collaboration request')).toBeVisible()
  })
})
```

## 📊 Test Coverage

### Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'src/pages/_*.tsx', // Layout files
        'src/pages/api/',   // API routes
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
})
```

### Coverage Report

```bash
# Run tests with coverage
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## 🚀 Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:run

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## 🐛 Mocking & Test Data

### API Mocking with MSW

```typescript
// src/test/mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.get('/api/user', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User'
      })
    )
  }),

  rest.post('/api/ideas', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 'idea_123',
        title: req.body.title,
        description: req.body.description,
        createdAt: new Date().toISOString()
      })
    )
  })
]
```

### Test Data Factories

```typescript
// src/test/factories.ts
export const createUser = (overrides = {}) => ({
  id: 'user_123',
  email: 'test@example.com',
  name: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  createdAt: new Date(),
  ...overrides
})

export const createIdea = (overrides = {}) => ({
  id: 'idea_123',
  title: 'Test Idea',
  description: 'Test description',
  authorId: 'user_123',
  category: 'Technology',
  visibility: 'public',
  sparkCount: 0,
  commentCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})
```

## 🎯 Best Practices

### Test Organization

1. **Group related tests** in describe blocks
2. **Use descriptive test names** that explain what is being tested
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests independent** - no shared state between tests
5. **Use meaningful assertions** - test behavior, not implementation

### Testing Philosophy

- **Test behavior, not implementation**
- **Keep tests fast and reliable**
- **Write tests before or with code** (TDD/BDD)
- **Maintain high coverage without sacrificing quality**
- **Use mocks sparingly** - prefer integration tests

### Performance Testing

```typescript
// Performance test example
test('idea list renders quickly', async () => {
  const startTime = performance.now()

  render(<IdeaList ideas={largeIdeaList} />)

  const endTime = performance.now()
  const renderTime = endTime - startTime

  expect(renderTime).toBeLessThan(100) // Should render in under 100ms
})
```

This comprehensive testing strategy ensures the Interactive Ideas Platform maintains high quality, reliability, and user experience through all stages of development and deployment.