import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

// Auto-cleanup mocks after each test
afterEach(() => {
  vi.restoreAllMocks()
})
