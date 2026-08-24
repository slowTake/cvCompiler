import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Standalone from vite.config.ts to avoid a plugin type clash between the root
// vite and vitest's bundled vite. Tests run on esbuild; the React plugin isn't
// needed. Aliases mirror vite.config.ts.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@data': path.resolve(__dirname, 'data'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
