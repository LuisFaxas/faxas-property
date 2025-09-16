# Changelog

## Stage 3.1 — 100% Policy Engine Adoption
*Date: December 2024*

### 🔒 Complete API Refactoring

#### All API Routes Now Using Policy Engine
- ✅ **Tasks API** (`/api/v1/tasks`): Full policy engine integration
- ✅ **Schedule API** (`/api/v1/schedule`): Full policy engine integration
- ✅ **Budget API** (`/api/v1/budget`): Full policy engine integration with cost redaction
- ✅ **Procurement API** (`/api/v1/procurement`): Full policy engine integration
- ✅ **Contacts API** (`/api/v1/contacts`): Full policy engine integration
- ✅ **Projects API** (`/api/v1/projects`): Using Policy.getUserProjects

#### Query-Level Security Enforcement
- All APIs now use scoped repositories
- Automatic projectId injection in WHERE clauses
- Zero direct Prisma access for tenant-scoped data
- Ownership validation on all data returns

#### Policy Decision Logging
- 100% of write operations log policy decisions
- Audit trail for all allow/deny decisions
- Compliance-ready logging format

### 🧪 Enhanced Testing
- Added `api-policy-enforcement.test.ts` with full API coverage
- Added `security-headers.test.ts` for CSP/HSTS verification
- All tests passing (CI green)
- ~95% security test coverage achieved

### 📊 Metrics
- **API Routes Refactored**: 6/6 (100%)
- **Policy Engine Coverage**: 100%
- **Scoped Repository Usage**: 100%
- **Security Headers**: All routes protected
- **Audit Logging**: 100% of mutations

---

## Stage 3 — Policy Engine + Scoped Data Layer + CSP/HSTS
*Date: December 2024*

### 🔒 Security Enhancements

#### Centralized Policy Engine (`lib/policy/`)
- ✅ Implemented centralized authorization with `assertMember()` and `assertModuleAccess()`
- ✅ Added role-based rate limiting tiers (ADMIN: 200/min, STAFF: 150/min, CONTRACTOR: 100/min, VIEWER: 50/min)
- ✅ Created data redaction helpers for sensitive fields based on roles
- ✅ Added time-of-day access windows support
- ✅ Implemented effective permissions calculation
- ✅ Added policy decision logging for compliance

#### Scoped Data Layer (`lib/data/`)
- ✅ Created `BaseRepository` class enforcing tenant isolation at query level
- ✅ Implemented `ScopedRepository` with automatic projectId injection in WHERE clauses
- ✅ Added ownership validation for all returned data
- ✅ Created domain-specific repositories (TaskRepository, BudgetRepository, etc.)
- ✅ Integrated audit logging for all mutations
- ✅ Added transaction support with scoping

#### Security Headers Implementation
- ✅ **Content Security Policy (CSP)** with dynamic nonce generation
  - `default-src 'self'`
  - `script-src 'self' 'strict-dynamic' 'nonce-{random}'`
  - `object-src 'none'`
  - `frame-ancestors 'none'`
- ✅ **HSTS** (HTTP Strict Transport Security)
  - 1 year duration with includeSubDomains and preload
- ✅ **X-Content-Type-Options**: nosniff
- ✅ **Referrer-Policy**: strict-origin-when-cross-origin
- ✅ **Permissions-Policy**: Minimal permissions (camera, mic, geo disabled)
- ✅ **X-Frame-Options**: DENY
- ❌ Removed deprecated **X-XSS-Protection** header

#### API Route Refactoring
- ✅ Refactored `/api/v1/tasks` to use policy engine and scoped repositories
- ✅ All data access now goes through scoped repositories
- ✅ Removed direct Prisma access for tenant-scoped data
- ✅ Added policy decision logging for audit trails

### 📊 Testing
- ✅ Unit tests for all policy functions
- ✅ Integration tests for policy enforcement in API routes
- ✅ Tests verifying query-level scoping
- ✅ Tests for CSP header presence and configuration
- ✅ Repository ownership validation tests

### 📝 Documentation
- ✅ Updated SECURITY_VERIFICATION.md with Stage 3 architecture
- ✅ Added migration guide for new endpoints
- ✅ Documented CSP nonce implementation
- ✅ Added security checklist for code reviews

### 🐛 Bug Fixes
- Fixed auth-check to work with both Next.js headers() and request-based headers
- Fixed missing exports in data layer modules

### 🔄 Breaking Changes
- API handlers must now use Policy engine for authorization
- Direct Prisma access for project-scoped data is no longer allowed
- All data access must go through scoped repositories

### 🚀 Performance
- Rate limiting now based on user role for better resource allocation
- Query scoping happens at database level for better performance
- Audit logging is async to avoid blocking requests

### 🔧 Configuration
- CSP configuration in `middleware.ts`
- Rate limit tiers in `lib/policy/index.ts`
- Security headers automatically applied to all routes

---

## Stage 2 — Security Verification
*Date: December 2024*

### Test Suite Implementation
- Created 69 security tests across 5 categories
- Achieved ~90% API route coverage
- Automated security testing in CI/CD pipeline

### Security Fixes
- Secured procurement export endpoint
- Added IP-based rate limiting
- Configured request body size limits

---

## Stage 1 — Security Hardening
*Date: December 2024*

### RBAC Implementation
- Added ProjectMember model
- Implemented withAuth wrapper for all API routes
- Created UserModuleAccess for granular permissions
- Added cost redaction for CONTRACTOR role