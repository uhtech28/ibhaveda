import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: [
      'test/**/*.test.{ts,tsx}',
      'src/**/*.test.{ts,tsx}',
    ],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['convex/**/*.ts', 'src/**/*.ts'],
      exclude: [
        '**/*.d.ts',
        '**/*.config.ts',
        '**/.next/**',
        '**/node_modules/**',
        'convex/_generated/**',
        'src/app/**',
      ],
    },
  },
})
