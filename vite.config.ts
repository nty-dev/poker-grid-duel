/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Content-Security-Policy for the production build: the app is static and
 * needs no network (connect-src 'none'), no remote scripts and no eval.
 * Dev builds skip the policy: Vite's dev server needs inline scripts.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "connect-src 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
        injectTo: 'head-prepend',
      },
    ],
  };
}

export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
  // Relative base so the build works under any GitHub Pages sub-path.
  base: './',
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
