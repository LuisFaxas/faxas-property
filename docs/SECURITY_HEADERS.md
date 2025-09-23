# Security Headers Documentation

## Headers Applied via Middleware
From `middleware.ts`:

```typescript
headers: {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'"
}
```

## Header Descriptions

### X-Frame-Options: DENY
- Prevents the page from being embedded in frames/iframes
- Protects against clickjacking attacks
- Most restrictive setting

### X-Content-Type-Options: nosniff
- Prevents MIME type sniffing
- Forces browser to respect declared Content-Type
- Mitigates certain XSS attacks

### X-XSS-Protection: 1; mode=block
- Enables browser's XSS filter
- Blocks page if XSS attack detected
- Legacy header but still useful for older browsers

### Referrer-Policy: strict-origin-when-cross-origin
- Controls referrer information sent with requests
- Sends full URL for same-origin, only origin for cross-origin
- Balances privacy and functionality

### Content-Security-Policy: default-src 'self'
- Restricts resource loading to same origin by default
- Foundation for CSP implementation
- May need expansion for Firebase, fonts, etc.

## Additional Headers from Caddy (if deployed)
Per SOT Operations (`/docs/06-operations.md`), Caddy adds:
- `Strict-Transport-Security: max-age=31536000` - Forces HTTPS

## Testing Recommendation
Add security snapshot test to verify headers:
```typescript
// __tests__/security/security-headers.test.ts
describe('Security Headers', () => {
  it('should set all required security headers', async () => {
    const response = await fetch('/api/health');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    // ... test all headers
  });
});
```

## TODO
- Assert headers via security snapshot test
- Consider adding:
  - `Permissions-Policy` for feature restrictions
  - Expanded CSP directives for production
  - `X-Permitted-Cross-Domain-Policies: none`

## Source
- Middleware: `middleware.ts`
- Caddy config: `Caddyfile`
- SOT Auth/Security: `/docs/04-auth-security.md`