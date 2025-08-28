/**
 * Security Headers Tests
 * Verifies CSP, HSTS, and other security headers are properly implemented
 */

import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';

describe('Security Headers', () => {
  const createRequest = (url: string) => {
    return new NextRequest(new URL(url, 'http://localhost:3000'));
  };

  describe('Content Security Policy (CSP)', () => {
    test('CSP header is present with nonce', async () => {
      const request = createRequest('/api/v1/tasks');
      const response = await middleware(request);
      
      const cspHeader = response?.headers.get('content-security-policy');
      expect(cspHeader).toBeDefined();
      
      // Check for nonce-based directives
      expect(cspHeader).toContain("default-src 'self'");
      expect(cspHeader).toContain("script-src 'self' 'strict-dynamic' 'nonce-");
      expect(cspHeader).toContain("object-src 'none'");
      expect(cspHeader).toContain("base-uri 'self'");
      expect(cspHeader).toContain("frame-ancestors 'none'");
      expect(cspHeader).toContain('upgrade-insecure-requests');
    });

    test('Unique nonce is generated for each request', async () => {
      const request1 = createRequest('/api/v1/tasks');
      const request2 = createRequest('/api/v1/budget');
      
      const response1 = await middleware(request1);
      const response2 = await middleware(request2);
      
      const nonce1 = response1?.headers.get('x-nonce');
      const nonce2 = response2?.headers.get('x-nonce');
      
      expect(nonce1).toBeDefined();
      expect(nonce2).toBeDefined();
      expect(nonce1).not.toBe(nonce2);
    });

    test('CSP allows necessary resources', async () => {
      const request = createRequest('/');
      const response = await middleware(request);
      
      const cspHeader = response?.headers.get('content-security-policy');
      
      // Check for necessary allowances
      expect(cspHeader).toContain("img-src 'self' data: https:");
      expect(cspHeader).toContain("font-src 'self' data:");
      expect(cspHeader).toContain("connect-src 'self'");
      expect(cspHeader).toContain("style-src 'self' 'unsafe-inline'");
    });
  });

  describe('HTTP Strict Transport Security (HSTS)', () => {
    test('HSTS header is present with correct values', async () => {
      const request = createRequest('/api/v1/tasks');
      const response = await middleware(request);
      
      const hstsHeader = response?.headers.get('strict-transport-security');
      expect(hstsHeader).toBeDefined();
      
      // Verify 1-year max-age (31536000 seconds)
      expect(hstsHeader).toContain('max-age=31536000');
      
      // Verify includeSubDomains
      expect(hstsHeader).toContain('includeSubDomains');
      
      // Verify preload
      expect(hstsHeader).toContain('preload');
    });

    test('HSTS is applied to all routes', async () => {
      const routes = [
        '/',
        '/api/v1/tasks',
        '/api/v1/budget',
        '/api/v1/schedule',
        '/admin/dashboard',
        '/contractor/tasks'
      ];
      
      for (const route of routes) {
        const request = createRequest(route);
        const response = await middleware(request);
        
        const hstsHeader = response?.headers.get('strict-transport-security');
        expect(hstsHeader).toBeDefined();
        expect(hstsHeader).toContain('max-age=31536000');
      }
    });
  });

  describe('Other Security Headers', () => {
    test('X-Content-Type-Options is set to nosniff', async () => {
      const request = createRequest('/api/v1/tasks');
      const response = await middleware(request);
      
      const header = response?.headers.get('x-content-type-options');
      expect(header).toBe('nosniff');
    });

    test('Referrer-Policy is properly configured', async () => {
      const request = createRequest('/api/v1/tasks');
      const response = await middleware(request);
      
      const header = response?.headers.get('referrer-policy');
      expect(header).toBe('strict-origin-when-cross-origin');
    });

    test('X-Frame-Options is set to DENY', async () => {
      const request = createRequest('/api/v1/tasks');
      const response = await middleware(request);
      
      const header = response?.headers.get('x-frame-options');
      expect(header).toBe('DENY');
    });

    test('Permissions-Policy restricts sensitive features', async () => {
      const request = createRequest('/api/v1/tasks');
      const response = await middleware(request);
      
      const header = response?.headers.get('permissions-policy');
      expect(header).toBeDefined();
      
      // Verify sensitive features are disabled
      expect(header).toContain('camera=()');
      expect(header).toContain('microphone=()');
      expect(header).toContain('geolocation=()');
      expect(header).toContain('payment=()');
      expect(header).toContain('usb=()');
    });

    test('X-XSS-Protection header is NOT present (deprecated)', async () => {
      const request = createRequest('/api/v1/tasks');
      const response = await middleware(request);
      
      const header = response?.headers.get('x-xss-protection');
      expect(header).toBeNull();
    });
  });

  describe('API Routes Security', () => {
    test('API routes have all security headers', async () => {
      const apiRoutes = [
        '/api/v1/tasks',
        '/api/v1/budget',
        '/api/v1/schedule',
        '/api/v1/procurement',
        '/api/v1/contacts',
        '/api/v1/projects'
      ];
      
      for (const route of apiRoutes) {
        const request = createRequest(route);
        const response = await middleware(request);
        
        // Check all security headers are present
        expect(response?.headers.get('content-security-policy')).toBeDefined();
        expect(response?.headers.get('strict-transport-security')).toBeDefined();
        expect(response?.headers.get('x-content-type-options')).toBe('nosniff');
        expect(response?.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
        expect(response?.headers.get('x-frame-options')).toBe('DENY');
        expect(response?.headers.get('permissions-policy')).toBeDefined();
        
        // Verify deprecated header is removed
        expect(response?.headers.get('x-xss-protection')).toBeNull();
      }
    });
  });

  describe('CSP Nonce Integration', () => {
    test('Nonce is accessible in response headers', async () => {
      const request = createRequest('/');
      const response = await middleware(request);
      
      const nonce = response?.headers.get('x-nonce');
      expect(nonce).toBeDefined();
      expect(nonce).toMatch(/^[a-zA-Z0-9+/]+={0,2}$/); // Base64 pattern
      
      // Verify nonce is included in CSP
      const csp = response?.headers.get('content-security-policy');
      expect(csp).toContain(`'nonce-${nonce}'`);
    });

    test('CSP uses strict-dynamic for better security', async () => {
      const request = createRequest('/');
      const response = await middleware(request);
      
      const csp = response?.headers.get('content-security-policy');
      expect(csp).toContain("'strict-dynamic'");
    });
  });

  describe('Security Headers Consistency', () => {
    test('Headers are consistent across different request methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      for (const method of methods) {
        const request = new NextRequest(new URL('/api/v1/tasks', 'http://localhost:3000'), {
          method
        });
        
        const response = await middleware(request);
        
        // Verify security headers are present regardless of method
        expect(response?.headers.get('strict-transport-security')).toBeDefined();
        expect(response?.headers.get('x-content-type-options')).toBe('nosniff');
      }
    });

    test('Headers are applied to error responses', async () => {
      // Request a non-existent route
      const request = createRequest('/api/v1/nonexistent');
      const response = await middleware(request);
      
      // Security headers should still be present
      expect(response?.headers.get('strict-transport-security')).toBeDefined();
      expect(response?.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response?.headers.get('content-security-policy')).toBeDefined();
    });
  });
});