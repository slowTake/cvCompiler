/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { cvSaves } from './server/savesPlugin';

const root = path.dirname(fileURLToPath(import.meta.url));

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
  plugins: [react(), stripPrivateData(), cvSaves(path.join(root, 'saves'))],
  build: {
    target: 'es2020',
    sourcemap: false,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
