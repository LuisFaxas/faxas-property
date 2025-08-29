/**
 * Security Middleware
 * Implements CSP, HSTS, and other security headers
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Generate a nonce for CSP using Web Crypto API (Edge Runtime compatible)
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

/**
 * Build Content Security Policy
 */
function buildCSP(nonce: string, isDevelopment: boolean): string {
  const directives = [
    `default-src 'self'`,
    // In development, allow unsafe-eval for React Refresh
    isDevelopment 
      ? `script-src 'self' 'unsafe-eval' 'nonce-${nonce}' https:` 
      : `script-src 'self' 'strict-dynamic' 'nonce-${nonce}' https: 'unsafe-inline'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, // Allow inline styles for now
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: blob: https:`,
    `connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebasestorage.googleapis.com https://*.firebaseapp.com https://*.firebaseio.com wss://localhost:* ws://localhost:*`,
    `frame-src 'self' https://*.firebaseapp.com https://*.firebaseio.com`, // Allow Firebase Auth iframes
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `block-all-mixed-content`,
    `upgrade-insecure-requests`
  ];

  return directives.join('; ');
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Check if we're in development mode
  const isDevelopment = request.nextUrl.hostname === 'localhost' || 
                       request.nextUrl.hostname === '127.0.0.1' ||
                       request.nextUrl.hostname.startsWith('192.168.');
  
  // Generate nonce for this request
  const nonce = generateNonce();
  
  // Store nonce in request headers for use in the app
  response.headers.set('x-nonce', nonce);
  
  // Security Headers
  
  // Content Security Policy with nonce
  const csp = buildCSP(nonce, isDevelopment);
  response.headers.set('Content-Security-Policy', csp);
  
  // Strict Transport Security (HSTS) - 1 year
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  
  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy (minimal permissions)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );
  
  // X-Frame-Options (redundant with frame-ancestors in CSP but good for older browsers)
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Remove X-Powered-By header
  response.headers.delete('X-Powered-By');
  
  // Remove legacy X-XSS-Protection (deprecated and can introduce vulnerabilities)
  response.headers.delete('X-XSS-Protection');
  
  // Add security headers for API routes specifically
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // No cookies in cross-site requests for APIs
    response.headers.set('SameSite', 'Strict');
    
    // Additional CORS headers if needed
    const origin = request.headers.get('origin');
    if (origin && isAllowedOrigin(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
      );
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
      );
    }
  }
  
  return response;
}

/**
 * Check if origin is allowed for CORS
 */
function isAllowedOrigin(origin: string): boolean {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.NEXT_PUBLIC_APP_URL
  ].filter(Boolean);
  
  return allowedOrigins.includes(origin);
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};