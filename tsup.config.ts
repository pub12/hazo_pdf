/**
 * tsup configuration for building the npm package
 * Handles TypeScript compilation and CSS bundling
 */

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/styles/index.css', 'src/styles/full.css'],
  format: ['esm'],
  dts: {
    entry: ['src/index.ts'],
  },
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'pdfjs-dist'],
  banner: {
    js: '"use client";',
  },
  esbuildOptions(options) {
    options.conditions = ['module'];
  },
});

