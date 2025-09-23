# Rate Limiting Documentation

## Rate Limits by Role

### Per SOT Auth/Security (04-auth-security.md) - Per Minute
| Role | Limit/min | Implementation |
|------|-----------|----------------|
| ADMIN | 1000 | IP + User ID |
| STAFF | 500 | IP + User ID |
| CONTRACTOR | 200 | IP + User ID |
| VIEWER | 100 | IP + User ID |
| PUBLIC | 50 | IP only |

### Per SOT API (02-api-inventory.md) - Per Hour
| Role | Limit/hour |
|------|------------|
| ADMIN/STAFF | 1000 |
| CONTRACTOR | 500 |
| VIEWER | 100 |

## TODO: Reconcile Standards
There is a discrepancy between the two SOT documents:
- Auth/Security specifies per-minute limits
- API Inventory specifies per-hour limits
- Need to standardize on one approach

Recommended: Use per-minute limits from Auth/Security as they are more granular and match the implementation in `lib/api/rate-limit.ts`.

## Rate Limit Headers
All API responses include rate limit information:
- `X-RateLimit-Limit` - Requests allowed per window
- `X-RateLimit-Remaining` - Requests remaining in current window
- `X-RateLimit-Reset` - Unix timestamp when window resets

## Implementation
- File: `lib/api/rate-limit.ts`
- Method: Token bucket algorithm
- Storage: In-memory or Redis (if configured)
- Key: Combination of IP address and User ID (authenticated) or IP only (public)

## Rate Limit Response
When rate limit is exceeded:
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```
HTTP Status: 429 Too Many Requests

## Bypass Rules
- Internal service-to-service calls may bypass rate limits
- Health check endpoints are not rate limited
- Static assets are not rate limited

## Monitoring
- Log rate limit violations
- Alert on repeated violations from same IP
- Track rate limit usage in metrics

## Source
- Primary: SOT Auth/Security (`/docs/04-auth-security.md`)
- Secondary: SOT API Inventory (`/docs/02-api-inventory.md`)
- Implementation: `lib/api/rate-limit.ts`