/**
 * Re-export hazo_pdf from dist for local development
 * This file allows the test app to import from '@/app/lib/hazo_pdf'
 * which resolves to the built dist/ folder
 */
export * from '../../dist/index.js';
