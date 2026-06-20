import '@testing-library/jest-dom'
import { vi } from 'vitest'

// jsdom does not implement URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// File-state API is not available in tests (no Vite dev server) — always 404
global.fetch = vi.fn(() => Promise.resolve({ ok: false } as Response))
