/**
 * Re-export hazo_pdf/server from dist for local development
 * This file allows the test app to import from '@/app/lib/hazo_pdf_server'
 * which resolves to the built dist/server folder
 */
export * from '@/dist/server/index.js';
