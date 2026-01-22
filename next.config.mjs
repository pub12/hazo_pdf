/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Use the separate tsconfig for Next.js if needed
    tsconfigPath: './tsconfig.next.json',
  },
  // Mark pdfjs-dist as external package to prevent SSR evaluation
  // Note: In Next.js 16, this moved from experimental to top level
  serverExternalPackages: ['pdfjs-dist', 'hazo_logs', 'hazo_llm_api', 'sql.js'],
  // Turbopack config for Node.js-only module aliases
  // These stubs allow hazo_logs to be dynamically imported in client components
  // The import will succeed but fall back to console logging since Node.js APIs aren't available
  turbopack: {
    resolveAlias: {
      // Node.js built-in module stubs for browser builds
      'fs': { browser: './app/lib/stubs/fs.js' },
      'path': { browser: './app/lib/stubs/path.js' },
      'os': { browser: './app/lib/stubs/os.js' },
      'readline': { browser: './app/lib/stubs/readline.js' },
      'crypto': { browser: './app/lib/stubs/crypto.js' },
      'stream': { browser: './app/lib/stubs/stream.js' },
      'zlib': { browser: './app/lib/stubs/zlib.js' },
      'string_decoder': { browser: './app/lib/stubs/string_decoder.js' },
      'util': { browser: './app/lib/stubs/util.js' },
      'async_hooks': { browser: './app/lib/stubs/async_hooks.js' },
      'events': { browser: './app/lib/stubs/events.js' },
      // Additional Node.js modules - use empty stub for browser
      'net': { browser: './app/lib/stubs/empty.js' },
      'tls': { browser: './app/lib/stubs/empty.js' },
      'http': { browser: './app/lib/stubs/empty.js' },
      'https': { browser: './app/lib/stubs/empty.js' },
      'child_process': { browser: './app/lib/stubs/empty.js' },
      'dns': { browser: './app/lib/stubs/empty.js' },
      'dgram': { browser: './app/lib/stubs/empty.js' },
      'cluster': { browser: './app/lib/stubs/empty.js' },
      'module': { browser: './app/lib/stubs/empty.js' },
      'vm': { browser: './app/lib/stubs/empty.js' },
      'worker_threads': { browser: './app/lib/stubs/empty.js' },
      'perf_hooks': { browser: './app/lib/stubs/empty.js' },
      'inspector': { browser: './app/lib/stubs/empty.js' },
      'v8': { browser: './app/lib/stubs/empty.js' },
      'trace_events': { browser: './app/lib/stubs/empty.js' },
    },
  },
  // Webpack config to handle Node.js-only modules in browser builds (for non-Turbopack builds)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Provide empty fallbacks for Node.js built-in modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false,
        fs: false,
        path: false,
        os: false,
        readline: false,
        crypto: false,
        stream: false,
        zlib: false,
        string_decoder: false,
        util: false,
        events: false,
        net: false,
        tls: false,
        http: false,
        https: false,
        child_process: false,
        dns: false,
        dgram: false,
        cluster: false,
        module: false,
        vm: false,
        worker_threads: false,
        perf_hooks: false,
        inspector: false,
        v8: false,
      };
    }
    return config;
  },
};

export default nextConfig;

