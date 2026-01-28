/**
 * tsup configuration for building the npm package
 * Handles TypeScript compilation and CSS bundling
 *
 * Builds two entry points:
 * 1. Client build (src/index.ts) - React components with "use client" banner
 * 2. Server build (src/server/index.ts) - Server utilities without "use client"
 */

import { defineConfig } from 'tsup';

export default defineConfig([
  // Client build - React components
  {
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
  },
  // Server build - extraction utilities (no "use client" banner)
  {
    entry: ['src/server/index.ts'],
    format: ['esm'],
    dts: {
      entry: ['src/server/index.ts'],
    },
    outDir: 'dist/server',
    sourcemap: true,
    // No banner - server code should NOT have "use client"
    external: [
      'react',
      'react-dom',
      'pdfjs-dist',
      'hazo_llm_api',
      'hazo_llm_api/server',
      'hazo_files',
      'hazo_connect',
      'hazo_connect/server',
      'fs',
      'path',
    ],
    esbuildOptions(options) {
      options.conditions = ['module'];
    },
  },
]);

