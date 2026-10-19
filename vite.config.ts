/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * Second line of defence for data/cv.private.json. The app only reaches for
 * it behind an import.meta.env.DEV guard, but if a production build ever
 * resolves the file anyway, it gets an empty module instead of your data.
 */
function stripPrivateData(): Plugin {
  return {
    name: 'cvcompiler:strip-private-data',
    apply: 'build',
    enforce: 'pre',
    load(id) {
      if (/[\\/]data[\\/]cv\.private\.json(\?.*)?$/.test(id)) {
        // Still JSON, so Vite's JSON plugin turns it into `export default null`.
        return 'null';
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [react(), stripPrivateData()],
  build: {
    target: 'es2020',
    sourcemap: false,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
