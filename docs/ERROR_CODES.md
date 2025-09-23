# API Error Codes Reference

## Error Code Enum
```typescript
enum ErrorCode {
  // Authentication Errors
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',

  // Authorization Errors
  FORBIDDEN = 'FORBIDDEN',
  ROLE_REQUIRED = 'ROLE_REQUIRED',
  MODULE_ACCESS_DENIED = 'MODULE_ACCESS_DENIED',
  PROJECT_ACCESS_DENIED = 'PROJECT_ACCESS_DENIED',

  // Validation Errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_PROJECT_ID = 'INVALID_PROJECT_ID',

  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}
```

## Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code?: ErrorCode;
  correlationId?: string;
  details?: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
}
```

## HTTP Status Mapping
| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| AUTH_REQUIRED | 401 | No authentication provided |
| AUTH_INVALID_TOKEN | 401 | Invalid authentication token |
| AUTH_TOKEN_EXPIRED | 401 | Token expired, refresh needed |
| FORBIDDEN | 403 | Authenticated but not authorized |
| ROLE_REQUIRED | 403 | Missing required role |
| MODULE_ACCESS_DENIED | 403 | No access to module |
| PROJECT_ACCESS_DENIED | 403 | No access to project |
| VALIDATION_FAILED | 400 | Request validation failed |
| INVALID_INPUT | 400 | Invalid input data |
| NOT_FOUND | 404 | Resource not found |
| ALREADY_EXISTS | 409 | Resource already exists |
| CONFLICT | 409 | Operation conflicts with current state |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |
| DATABASE_ERROR | 500 | Database operation failed |

## Source
Per SOT API documentation (`/docs/02-api-inventory.md`)