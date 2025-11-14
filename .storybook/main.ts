/**
 * Storybook main configuration
 * Configures Storybook for React, TypeScript, and TailwindCSS
 */

import type { StorybookConfig } from '@storybook/react-vite';
import type { Plugin } from 'vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  async viteFinal(config) {
    // Import fs/path modules asynchronously to avoid ES module issues
    const fs = await import('fs');
    const path = await import('path');
    const url = await import('url');
    
    // Get test/pdfs directory path
    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const testPdfsDir = path.resolve(__dirname, '../test/pdfs');
    
    console.log('[Storybook] PDF directory:', testPdfsDir);
    console.log('[Storybook] PDF files:', fs.existsSync(testPdfsDir) ? fs.readdirSync(testPdfsDir) : 'Directory not found');
    
    // Configure static file serving for test PDFs
    if (config.server) {
      config.server.fs = {
        ...config.server.fs,
        allow: ['..'],
      };
    }
    
    // Get root directory for config file
    const rootDir = path.resolve(__dirname, '..');
    const configFilePath = path.join(rootDir, 'hazo_pdf_config.ini');
    
    // Create PDF server plugin - this runs early in the middleware chain
    const pdfServerPlugin: Plugin = {
      name: 'pdf-server',
      enforce: 'pre', // Run before other plugins
      configureServer(server) {
        // Add middleware early in the chain
        server.middlewares.use((req, res, next) => {
          // Check if request is for config file
          if (req.url === '/hazo_pdf_config.ini' || req.url?.endsWith('/hazo_pdf_config.ini')) {
            console.log(`[Config Server] Request for config file: ${req.url} -> ${configFilePath}`);
            
            if (fs.existsSync(configFilePath)) {
              try {
                const stats = fs.statSync(configFilePath);
                console.log(`[Config Server] Serving: hazo_pdf_config.ini (${stats.size} bytes)`);
                
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Content-Length', stats.size.toString());
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
                res.setHeader('Cache-Control', 'public, max-age=3600');
                
                const stream = fs.createReadStream(configFilePath);
                stream.on('error', (err: Error) => {
                  console.error('[Config Server] Error reading config:', err);
                  if (!res.headersSent) {
                    res.statusCode = 500;
                    res.end('Error reading config file');
                  }
                });
                
                stream.pipe(res);
                return; // Don't call next() - we're handling the request
              } catch (error) {
                console.error('[Config Server] Error serving config:', error);
                // Fall through to next() if there's an error
              }
            } else {
              console.log(`[Config Server] Config file not found: ${configFilePath}`);
            }
          }
          
          // Check if request is for a PDF file at root path
          if (req.url && /^\/[^/?]+\.pdf(\?.*)?$/.test(req.url)) {
            const fileName = req.url.split('?')[0].substring(1);
            const filePath = path.join(testPdfsDir, fileName);
            
            console.log(`[PDF Server] Request for: ${req.url} -> ${filePath}`);
            
            if (fs.existsSync(filePath)) {
              try {
                const stats = fs.statSync(filePath);
                console.log(`[PDF Server] Serving: ${fileName} (${stats.size} bytes)`);
                
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Length', stats.size.toString());
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Range');
                res.setHeader('Accept-Ranges', 'bytes');
                res.setHeader('Cache-Control', 'public, max-age=3600');
                
                const stream = fs.createReadStream(filePath);
                stream.on('error', (err: Error) => {
                  console.error('[PDF Server] Error reading PDF:', err);
                  if (!res.headersSent) {
                    res.statusCode = 500;
                    res.end('Error reading PDF');
                  }
                });
                
                stream.pipe(res);
                return; // Don't call next() - we're handling the request
              } catch (error) {
                console.error('[PDF Server] Error serving PDF:', error);
                // Fall through to next() if there's an error
              }
            } else {
              console.log(`[PDF Server] File not found: ${filePath}`);
            }
          }
          // Not a PDF/config request or file doesn't exist - pass to next middleware
          next();
        });
      },
    };
    
    // Add PDF server plugin
    if (!config.plugins) {
      config.plugins = [];
    }
    config.plugins.push(pdfServerPlugin);
    
    return config;
  },
  // Serve static files from test/pdfs directory
  // Files will be accessible at root path: /sample.pdf, /@sample.pdf, etc.
  staticDirs: ['../test/pdfs'],
};

export default config;
