/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Use the separate tsconfig for Next.js if needed
    tsconfigPath: './tsconfig.next.json',
  },
  // Mark pdfjs-dist as external package to prevent SSR evaluation
  // Note: In Next.js 16, this moved from experimental to top level
  serverExternalPackages: ['pdfjs-dist'],
  // Empty turbopack config to silence the warning
  turbopack: {},
};

export default nextConfig;

