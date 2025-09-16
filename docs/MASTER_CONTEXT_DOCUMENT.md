# MASTER CONTEXT DOCUMENT
## Miami Duplex Construction Management System
### Version 3.0 - Complete Technical Specification
### Last Updated: September 12, 2025

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Bootstrap & First-Run Setup](#bootstrap--first-run-setup)
3. [Scripts Documentation](#scripts-documentation)
4. [Runtime & Deployment Architecture](#runtime--deployment-architecture)
5. [Environment Variables Schema](#environment-variables-schema)
6. [Database Schema & Invariants](#database-schema--invariants)
7. [Authentication & Authorization](#authentication--authorization)
8. [Security Controls & Policies](#security-controls--policies)
9. [API Endpoint Catalog](#api-endpoint-catalog)
10. [Module Status Matrix](#module-status-matrix)
11. [UI/UX System Documentation](#uiux-system-documentation)
12. [Testing Strategy & Coverage](#testing-strategy--coverage)
13. [Operations & Observability](#operations--observability)
14. [Third-Party Integrations](#third-party-integrations)
15. [Performance & Caching Strategy](#performance--caching-strategy)

---

## EXECUTIVE SUMMARY

**Project**: Miami Duplex Construction Management System  
**Status**: Production-Ready (v0.1.0)  
**Architecture**: Next.js 15 App Router + Prisma + PostgreSQL + Firebase Auth  
**Repository Structure**: Monorepo with control-center as main application  
**Target Users**: Construction managers, contractors, project stakeholders  

### Quick Stats
- **Models**: 39 database tables
- **API Endpoints**: 42 RESTful routes
- **Modules**: 15 feature modules
- **Test Coverage**: Security tests for all critical paths
- **Deployment**: Docker containerized with Caddy reverse proxy

---

## BOOTSTRAP & FIRST-RUN SETUP

### Prerequisites
- Node.js 20.x LTS or higher
- PostgreSQL 15.x (or Supabase account)
- Firebase project with Authentication enabled
- Git with SSH access configured

### Step 1: Clone Repository
```bash
# Clone the main repository
git clone [repository-url] FAXAS_PROPERTY
cd FAXAS_PROPERTY

# Navigate to the application directory
cd control-center
```

### Step 2: Install Dependencies
```bash
# Install all npm packages
npm install

# Install global tools (optional but recommended)
npm install -g tsx ts-node
```

### Step 3: Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values (see Environment Variables Schema)
```

### Step 4: Firebase Setup
```bash
# 1. Download service account JSON from Firebase Console
# 2. Convert to base64:
cat service-account.json | base64 > service-account.base64

# 3. Copy the base64 string to FIREBASE_SERVICE_ACCOUNT_BASE64 in .env.local
```

### Step 5: Database Initialization
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (development)
npm run db:push

# Or use migrations (production)
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### Step 6: Create Admin User
```bash
# Run the admin creation script
npm run create-admin

# Follow prompts to enter:
# - Email address
# - Initial password
# - Name
```

### Step 7: Start Development Server
```bash
# Start the application
npm run dev

# Application runs on http://localhost:3000
```

### Step 8: Verification
```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","environment":"development"}

# Test database connection
npx prisma db pull

# Open Prisma Studio to verify data
npm run db:studio
```

### Common Issues & Solutions

**Issue**: Database connection failed
```bash
# Test connection string
npx prisma db pull

# Check DATABASE_URL format:
# postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
```

**Issue**: Firebase authentication error
```bash
# Verify service account
node -e "console.log(JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString()))"

# Check Firebase project ID matches
```

**Issue**: Port 3000 already in use
```bash
# Use different port
PORT=3001 npm run dev
```

---

## SCRIPTS DOCUMENTATION

### Core Development Scripts

#### `npm run dev`
- **Purpose**: Start Next.js development server with hot reload
- **Port**: 3000 (configurable via PORT env)
- **Usage**: Primary development command
- **Dependencies**: Next.js dev server, TypeScript compiler

#### `npm run build`
- **Purpose**: Create production-optimized build
- **Process**: TypeScript compilation → Next.js build → Standalone output
- **Output**: `.next/` directory with compiled assets
- **Pre-requisites**: All TypeScript errors must be resolved

#### `npm start`
- **Purpose**: Start production server
- **Requires**: Prior successful `npm run build`
- **Port**: 3000 (configurable)
- **Usage**: Production deployment

#### `npm run lint`
- **Purpose**: Run ESLint on all TypeScript/JavaScript files
- **Config**: `eslint.config.mjs`
- **Scope**: Entire codebase
- **Exit Code**: Non-zero on errors

### Database Management Scripts

#### `npm run db:push`
- **Purpose**: Push Prisma schema to database without migrations
- **Usage**: Development rapid iteration
- **Warning**: Can cause data loss, not for production

#### `npm run db:migrate`
- **Purpose**: Create and apply database migrations
- **Usage**: Production schema changes
- **Output**: Migration files in `prisma/migrations/`

#### `npm run db:seed`
- **Purpose**: Populate database with initial/test data
- **File**: `prisma/seed.ts`
- **Usage**: Development environment setup

#### `npm run db:studio`
- **Purpose**: Launch Prisma Studio GUI
- **Port**: 5555
- **Features**: Visual database browser and editor

#### `npm run db:backup`
- **Purpose**: Create database backup
- **Script**: `scripts/backup-database.ts`
- **Output**: Timestamped SQL dump file

#### `npm run db:restore`
- **Purpose**: Restore database from backup
- **Script**: `scripts/restore-database.ts`
- **Input**: SQL dump file path

### Testing Scripts

#### `npm test`
- **Purpose**: Run all Jest tests
- **Config**: `jest.config.js`
- **Coverage**: Generated in `coverage/` directory

#### `npm run test:security`
- **Purpose**: Run security-focused test suite
- **Scope**: API authentication, RBAC, IDOR prevention
- **Coverage**: Critical security paths

#### `npm run test:security:watch`
- **Purpose**: Run security tests in watch mode
- **Usage**: TDD for security features

#### `npm run test:security:ci`
- **Purpose**: CI-optimized security tests
- **Features**: Limited workers, coverage reporting

### Admin Scripts

#### `npm run create-admin`
- **Purpose**: Create admin user interactively
- **Script**: `scripts/create-admin.ts`
- **Requirements**: Database connection, Firebase Admin SDK
- **Creates**: User with ADMIN role and Firebase custom claims

---

## RUNTIME & DEPLOYMENT ARCHITECTURE

### Development Environment
```yaml
Runtime: Node.js 20.x
Framework: Next.js 15.5.0
Port: 3000
Hot Reload: Enabled
Source Maps: Enabled
Environment: development
```

### Production Build
```yaml
Build Output: Standalone Next.js
Optimization: 
  - Tree shaking
  - Code splitting
  - Image optimization
  - Font optimization
Static Assets: .next/static/
Server: .next/standalone/server.js
```

### Docker Architecture
```dockerfile
# Multi-stage build process
Stage 1 (deps): Install production dependencies
Stage 2 (builder): 
  - Copy dependencies
  - Generate Prisma client
  - Build Next.js application
Stage 3 (runner):
  - Minimal Alpine image
  - Non-root user (nextjs:1001)
  - Copy built assets
  - Run migrations on start
  - Start Node.js server
```

### Container Configuration
```yaml
Base Image: node:20-alpine
Working Directory: /app
Exposed Port: 3000
User: nextjs (UID 1001)
Entry Point: npx prisma migrate deploy && node server.js
Health Check: GET /api/health
```

### Docker Compose Stack
```yaml
Services:
  - app: Next.js application
  - n8n: Workflow automation (optional)
  - postgres: Database (optional, for local dev)
  
Networks:
  - app-network (bridge)
  
Volumes:
  - postgres-data (persistent database)
  - n8n-data (workflow storage)
```

### Reverse Proxy (Caddy)
```caddyfile
Domain: your-domain.com
TLS: Automatic via Let's Encrypt
Proxy: localhost:3000
Headers:
  - X-Real-IP
  - X-Forwarded-For
  - X-Forwarded-Proto
Compression: gzip, brotli
```

### Production Deployment
```bash
# Build and start containers
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Scale horizontally
docker-compose up -d --scale app=3

# Health monitoring
curl https://your-domain.com/api/health
```

### Environment-Specific Configurations

#### Development
- Verbose logging
- Debug tools enabled
- CORS relaxed for localhost
- CSP allows unsafe-eval for React DevTools

#### Staging
- Production build
- Reduced logging
- Synthetic data allowed
- Performance profiling enabled

#### Production
- Minimal logging (errors only)
- Strict CSP headers
- Rate limiting enforced
- Audit logging enabled
- Error tracking to Sentry

---

## ENVIRONMENT VARIABLES SCHEMA

### Required Variables (Application Won't Start Without These)

#### Database
```env
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
# Format: postgresql://[user]:[pass]@[host]:[port]/[db]
# Example: postgresql://admin:secret@localhost:5432/construction_db
# Validation: Must be valid PostgreSQL connection string
```

#### Firebase Client (Public)
```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
# Source: Firebase Console > Project Settings
# Format: String starting with "AIza"

NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="project.firebaseapp.com"
# Format: [project-id].firebaseapp.com

NEXT_PUBLIC_FIREBASE_PROJECT_ID="project-id"
# Format: Lowercase with hyphens

NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="project.firebasestorage.app"
# Format: [project-id].firebasestorage.app

NEXT_PUBLIC_FIREBASE_APP_ID="1:123:web:abc"
# Format: Colon-separated identifiers
```

#### Firebase Admin (Secret)
```env
FIREBASE_SERVICE_ACCOUNT_BASE64="eyJ0eXBlIjoi..."
# Generation: cat service-account.json | base64
# Validation: Must decode to valid JSON with private_key field
# Security: NEVER commit to version control
```

### Optional Variables

#### Security
```env
WEBHOOK_SECRET="random-32-char-string"
# Generation: openssl rand -hex 32
# Usage: Webhook endpoint validation

JWT_AUDIENCE="construction-app"
# Default: Application name
# Usage: JWT token validation

SESSION_SECRET="random-64-char-string"
# Generation: openssl rand -hex 64
# Usage: Session encryption
```

#### Rate Limiting
```env
API_RATE_LIMIT_ADMIN=200        # Requests per minute
API_RATE_LIMIT_STAFF=150        # Requests per minute
API_RATE_LIMIT_CONTRACTOR=100   # Requests per minute
API_RATE_LIMIT_VIEWER=50        # Requests per minute
API_TIMEOUT=30000               # Milliseconds
```

#### Feature Flags
```env
ENABLE_CONSOLE_LOGS=false       # Production: false
ENABLE_DEBUG_MODE=false         # Production: false
ENABLE_MAINTENANCE_MODE=false   # Emergency maintenance
```

#### Monitoring (Production)
```env
SENTRY_DSN="https://key@sentry.io/project"
SENTRY_AUTH_TOKEN="token"
SENTRY_ORG="org-slug"
SENTRY_PROJECT="project-slug"
```

#### Email Service (Future)
```env
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user@example.com"
SMTP_PASS="password"
SMTP_FROM="noreply@example.com"

# Or use service
SENDGRID_API_KEY="SG.xxx"
RESEND_API_KEY="re_xxx"
```

#### Analytics (Optional)
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_POSTHOG_KEY="phc_xxx"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

#### Deployment
```env
NODE_ENV="development|production"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
VERCEL_URL="your-app.vercel.app"
LOG_LEVEL="debug|info|warn|error"
DATABASE_STUDIO_PORT=5555
```

### Validation Rules

1. **Required Check**: Application validates on startup
2. **Format Validation**: Regex patterns for each variable type
3. **Connection Testing**: Database and Firebase verified on boot
4. **Security Audit**: Warns if default values detected in production
5. **Missing Variable Behavior**: Graceful degradation where possible

---

## DATABASE SCHEMA & INVARIANTS

### Overview
- **ORM**: Prisma 6.14.0
- **Database**: PostgreSQL 15.x
- **Models**: 39 tables
- **Enums**: 12 type definitions
- **Relations**: Complex many-to-many and self-referential

### Core Models

#### User Model
```prisma
model User {
  id                 String           @id  // Firebase UID
  email              String           @unique
  role               Role            // ADMIN|STAFF|CONTRACTOR|VIEWER
  createdAt          DateTime         @default(now())
  
  // Relations
  contact            Contact?         // Optional linked contact
  tasks              Task[]           // Assigned tasks
  projectMemberships ProjectMember[]  // Project access
}

Invariants:
- id MUST match Firebase UID
- email MUST be unique and valid
- role determines system-wide permissions
- User can have at most ONE linked Contact
```

#### Project Model
```prisma
model Project {
  id            String      @id @default(cuid())
  name          String
  status        String      // Active|Planning|OnHold|Completed
  address       String?
  clientName    String?
  clientEmail   String?
  totalBudget   Decimal?    @db.Decimal(12, 2)
  startDate     DateTime?
  targetEndDate DateTime?
  actualEndDate DateTime?
  
  // Feature flags
  isArchived    Boolean     @default(false)
  isFavorite    Boolean     @default(false)
  
  // Relations (15 child collections)
  tasks         Task[]
  contacts      Contact[]
  budgets       BudgetItem[]
  schedule      ScheduleEvent[]
  procurement   Procurement[]
  rfps          Rfp[]
  vendors       Vendor[]
  // ... and more
}

Invariants:
- Cannot delete Project with active Tasks
- Archived projects are read-only
- Budget total must equal sum of BudgetItems
```

#### Task Model (Dual Assignment System)
```prisma
model Task {
  id                String      @id @default(cuid())
  projectId         String
  title             String
  description       String?
  status            TaskStatus
  priority          TaskPriority
  dueDate           DateTime?
  
  // Dual assignment
  assignedToId      String?     // User assignment
  assignedContactId String?     // Contact assignment
  
  // Relations
  dependencies      TaskDependency[] @relation("DependentTask")
  dependents        TaskDependency[] @relation("DependsOnTask")
  attachments       TaskAttachment[]
  comments          TaskComment[]
  activities        TaskActivity[]
}

Invariants:
- Task must have assignedToId OR assignedContactId (not both)
- Cannot complete Task with incomplete dependencies
- Status transitions follow workflow rules
```

#### Contact Model (Portal Access System)
```prisma
model Contact {
  id             String    @id @default(cuid())
  projectId      String
  name           String
  company        String?
  emails         String[]  // Array of email addresses
  phones         String[]  // Array of phone numbers
  
  // Portal access
  userId         String?   @unique  // Links to User if portal enabled
  portalStatus   String    @default("NONE") // NONE|INVITED|ACTIVE
  inviteToken    String?   @unique
  inviteExpiry   DateTime?
  
  // Relations
  assignedTasks  Task[]
  procurements   Procurement[]
}

Invariants:
- userId only set when portal access granted
- inviteToken must be unique and cryptographically secure
- inviteExpiry enforced (default 7 days)
```

### Bidding System Models

#### RFP (Request for Proposal)
```prisma
model Rfp {
  id          String      @id @default(cuid())
  projectId   String
  title       String
  description String?
  status      RfpStatus   // DRAFT|PUBLISHED|CLOSED|AWARDED
  dueDate     DateTime
  
  // Relations
  items       RfpItem[]
  vendors     BidInvitation[]
  bids        Bid[]
  awards      Award[]
}
```

#### Vendor & Bidding
```prisma
model Vendor {
  id           String    @id @default(cuid())
  name         String
  email        String
  status       VendorStatus
  
  invitations  BidInvitation[]
  bids         Bid[]
}

model Bid {
  id         String    @id @default(cuid())
  rfpId      String
  vendorId   String
  totalAmount Decimal  @db.Decimal(12, 2)
  status     BidStatus
  
  items      BidItem[]
}
```

### Enumerations

```prisma
enum Role {
  ADMIN
  STAFF
  CONTRACTOR
  VIEWER
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  BLOCKED
  COMPLETED
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum Module {
  PROJECTS
  TASKS
  CONTACTS
  BUDGET
  SCHEDULE
  PROCUREMENT
  PLANS
  DECISIONS
  RISKS
  MEETINGS
  INVOICES
  RFP
  BIDDING
  DOCUMENTS
  SETTINGS
}
```

### Database Invariants & Business Rules

1. **Referential Integrity**
   - All foreign keys enforced at database level
   - Cascade deletes configured appropriately
   - Orphan records prevented

2. **Data Validation**
   - Email formats validated
   - Phone numbers stored in E.164 format
   - Decimal precision enforced for money fields
   - Date ranges validated (start < end)

3. **Business Logic**
   - Task dependencies prevent circular references
   - Budget items cannot exceed project total
   - RFP can only be awarded once
   - User roles cascade to permissions

4. **Performance Indexes**
   ```prisma
   @@index([projectId, portalStatus])  // Contact queries
   @@index([inviteToken])               // Invite lookups
   @@index([projectId, status])        // Task filters
   ```

### Migration Strategy

```bash
# Development: Rapid iteration
npm run db:push

# Staging: Test migrations
npm run db:migrate -- --create-only
npm run db:migrate

# Production: Safe deployment
npm run db:migrate deploy

# Rollback if needed
npx prisma migrate resolve --rolled-back
```

---

## AUTHENTICATION & AUTHORIZATION

### Authentication Flow

#### 1. Client-Side Authentication
```typescript
// Firebase Auth handles user authentication
// Providers: Email/Password, Google OAuth
// Token refresh: Automatic every hour

// AuthContext provides:
interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  userRole: Role | null
  signIn: (email, password) => Promise<void>
  signOut: () => Promise<void>
  updateUserProfile: (data) => Promise<void>
}
```

#### 2. Token Verification
```typescript
// API routes verify token on each request
// Location: lib/api/auth-check.ts

1. Extract Bearer token from Authorization header
2. Verify token with Firebase Admin SDK
3. Check token expiry and refresh flag
4. Lookup user in database
5. Auto-create user if first login
6. Return authenticated user object
```

#### 3. Session Management
```typescript
// Optional session layer for performance
// Location: lib/api/session.ts

Session Flow:
1. Create session on successful auth
2. Store session ID in x-session-id header
3. Validate session on subsequent requests
4. Refresh session before expiry
5. Invalidate on logout
```

### Authorization Matrix

#### Role-Based Access Control (RBAC)

| Role | System Access | Project Access | Data Permissions |
|------|--------------|----------------|------------------|
| **ADMIN** | Full system access | All projects | Create, Read, Update, Delete all data |
| **STAFF** | Management features | Assigned projects | CRUD on assigned projects |
| **CONTRACTOR** | Limited features | Assigned projects | Read, limited update on assigned items |
| **VIEWER** | Read-only | Assigned projects | Read-only access |

#### Module-Level Permissions

```typescript
model UserModuleAccess {
  userId    String
  projectId String
  module    Module
  
  canView   Boolean @default(false)
  canEdit   Boolean @default(false)
  canUpload Boolean @default(false)
  canRequest Boolean @default(false)
}
```

#### API Authorization Middleware

```typescript
// Three levels of protection:

// Level 1: Authentication only
const user = await requireAuth(request)

// Level 2: Role-based
const user = await requireRole(['ADMIN', 'STAFF'])

// Level 3: Module + Project specific
await requireModuleAccess(userId, projectId, 'BUDGET', 'edit')
```

### Custom Claims

```typescript
// Firebase custom claims structure
interface CustomClaims {
  role: 'ADMIN' | 'STAFF' | 'CONTRACTOR' | 'VIEWER'
  projectIds?: string[]      // Assigned projects
  permissions?: string[]     // Granular permissions
  contractorId?: string     // For contractor accounts
}

// Set via Admin SDK
await auth.setCustomUserClaims(uid, claims)
```

### Portal Access Flow

```mermaid
1. Admin creates Contact
2. Admin sends portal invite
3. System generates unique token
4. Contact receives email with link
5. Contact accepts at /accept-invite
6. System creates User account
7. Links User to Contact
8. Grants CONTRACTOR role
9. Assigns project permissions
```

### Security Tokens

#### JWT Structure
```json
{
  "iss": "https://securetoken.google.com/[project-id]",
  "aud": "[project-id]",
  "auth_time": 1234567890,
  "user_id": "uid",
  "sub": "uid",
  "iat": 1234567890,
  "exp": 1234571490,
  "email": "user@example.com",
  "email_verified": true,
  "firebase": {
    "identities": {},
    "sign_in_provider": "password"
  },
  "role": "ADMIN",
  "projectIds": ["proj1", "proj2"]
}
```

#### Token Lifecycle
- **Issue**: On successful authentication
- **Expiry**: 1 hour (3600 seconds)
- **Refresh**: Automatic before expiry
- **Revoke**: On password change or admin action
- **Validation**: Every API request

---

## SECURITY CONTROLS & POLICIES

### Security Headers (Middleware)

#### Content Security Policy (CSP)
```typescript
// Production CSP
default-src 'self';
script-src 'self' 'strict-dynamic' 'nonce-{random}' https:;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: blob: https:;
connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com;
frame-ancestors 'none';
```

#### Additional Headers
```typescript
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Input Validation & Sanitization

#### Request Validation (Zod)
```typescript
// All API inputs validated with Zod schemas
const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().datetime().optional(),
  assignedToId: z.string().cuid().optional()
})

// Automatic validation in API routes
const validated = createTaskSchema.parse(body)
```

#### SQL Injection Prevention
```typescript
// Prisma parameterized queries (automatic)
await prisma.task.findMany({
  where: { 
    projectId: userInput // Automatically escaped
  }
})

// Never use raw SQL without parameters
// ❌ BAD: prisma.$queryRaw`SELECT * FROM tasks WHERE id = ${id}`
// ✅ GOOD: prisma.$queryRaw`SELECT * FROM tasks WHERE id = ${Prisma.sql`${id}`}`
```

#### XSS Prevention
```typescript
// React automatically escapes content
// Additional sanitization for user-generated HTML
import DOMPurify from 'isomorphic-dompurify'

const sanitized = DOMPurify.sanitize(userHtml, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href']
})
```

### Rate Limiting

```typescript
// Per-role rate limits (requests per minute)
const limits = {
  ADMIN: 200,
  STAFF: 150,
  CONTRACTOR: 100,
  VIEWER: 50
}

// Implementation
const limiter = new Map()

function rateLimit(userId: string, role: Role) {
  const key = `${userId}:${Date.now() / 60000 | 0}`
  const count = limiter.get(key) || 0
  
  if (count >= limits[role]) {
    throw new ApiError(429, 'Rate limit exceeded')
  }
  
  limiter.set(key, count + 1)
}
```

### Audit Logging

```typescript
model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  action    String   // CREATE|UPDATE|DELETE|ACCESS
  resource  String   // tasks|projects|users
  resourceId String?
  changes   Json?    // Before/after values
  ipAddress String?
  userAgent String?
  timestamp DateTime @default(now())
}

// Critical actions logged:
- User authentication (success/failure)
- Permission changes
- Data modifications
- Access to sensitive data
- Failed authorization attempts
```

### IDOR (Insecure Direct Object Reference) Prevention

```typescript
// Always verify ownership/access before operations

// ❌ BAD: Direct access
const task = await prisma.task.findUnique({ 
  where: { id: params.id } 
})

// ✅ GOOD: Scoped access
const task = await prisma.task.findFirst({
  where: {
    id: params.id,
    project: {
      members: {
        some: { userId: currentUser.id }
      }
    }
  }
})
```

### Password & Secret Management

1. **Password Requirements**
   - Minimum 8 characters
   - Firebase handles hashing (scrypt)
   - Password history not stored
   - Reset tokens expire in 1 hour

2. **Secret Storage**
   - Environment variables only
   - Never in code or database
   - Base64 encoding for complex values
   - Rotation reminders via monitoring

3. **API Keys**
   - Scoped to specific operations
   - IP whitelist where possible
   - Regular rotation schedule
   - Audit trail for usage

### Security Testing

```typescript
// Security test coverage includes:
- Authentication bypass attempts
- Authorization elevation tests
- IDOR vulnerability checks
- Rate limit verification
- Input validation boundaries
- Session management
- CSRF protection
- Security header validation
```

---

## API ENDPOINT CATALOG

### Status Legend
- ✅ Complete and tested
- 🚧 In development
- ❌ Not started
- 🔒 Requires authentication
- 👤 Role-specific access

### Health & System

| Endpoint | Method | Auth | Status | Description |
|----------|--------|------|--------|-------------|
| `/api/health` | GET | No | ✅ | System health check |

### Authentication

| Endpoint | Method | Auth | Status | Description |
|----------|--------|------|--------|-------------|
| `/api/v1/auth/initialize` | POST | 🔒 | ✅ | Initialize user account |
| `/api/auth/initialize` | POST | 🔒 | ✅ | Legacy auth initialization |

### Users Management

| Endpoint | Method | Auth | Status | Description |
|----------|--------|------|--------|-------------|
| `/api/v1/users` | GET | 🔒 ADMIN/STAFF | ✅ | List all users |
| `/api/v1/users` | POST | 🔒 ADMIN | ✅ | Create new user |
| `/api/v1/users/[id]` | GET | 🔒 | ✅ | Get user details |
| `/api/v1/users/[id]` | PATCH | 🔒 ADMIN | ✅ | Update user |
| `/api/v1/users/[id]` | DELETE | 🔒 ADMIN | ✅ | Delete user |
| `/api/v1/users/[id]/permissions` | GET | 🔒 | ✅ | Get user permissions |
| `/api/v1/users/[id]/permissions` | PUT | 🔒 ADMIN | ✅ | Update permissions |

### Projects

| Endpoint | Method | Auth | Status | Description |
|----------|--------|------|--------|-------------|
| `/api/v1/projects` | GET | 🔒 | ✅ | List projects |
| `/api/v1/projects` | POST | 🔒 ADMIN/STAFF | ✅ | Create project |
| `/api/v1/projects/[id]` | GET | 🔒 | ✅ | Get project details |
| `/api/v1/projects/[id]` | PATCH | 🔒 ADMIN/STAFF | ✅ | Update project |
| `/api/v1/projects/[id]` | DELETE | 🔒 ADMIN | ✅ | Delete project |
| `/api/v1/projects/[id]/archive` | POST | 🔒 ADMIN/STAFF | ✅ | Archive project |
| `/api/v1/projects/[id]/favorite` | POST | 🔒 | ✅ | Toggle favorite |

### Tasks

| Endpoint | Method | Auth | Status | Description |
|----------|--------|------|--------|-------------|
| `/api/v1/tasks` | GET | 🔒 | ✅ | List tasks |
| `/api/v1/tasks` | POST | 🔒 | ✅ | Create task |
| `/api/v1/tasks/[id]` | GET | 🔒 | ✅ | Get task details |
| `/api/v1/tasks/[id]` | PATCH | 🔒 | ✅ | Update task |
| `/api/v1/tasks/[id]` | DELETE | 🔒 | ✅ | Delete task |
| `/api/v1/tasks/[id]/status` | PATCH | 🔒 | ✅ | Update task status |
| `/api/v1/tasks/bulk-delete` | POST | 🔒 ADMIN/STAFF | ✅ | Bulk delete tasks |

### Contacts

| Endpoint | Method | Auth | Status | Description |
|----------|--------|------|--------|-------------|
| `/api/v1/contacts` | GET | 🔒 | ✅ | List contacts |
| `/api/v1/contacts` | POST | 🔒 | ✅ | Create contact |
| `/api/v1/contacts/[id]` | GET | 🔒 | ✅ | Get contact |
| `/api/v1/contacts/[id]` | PATCH | 🔒 | ✅ | Update contact |
| `/api/v1/contacts/[id]` | DELETE | 🔒 | ✅ | Delete contact |
| `/api/v1/contacts/[id]/invite` | POST | 🔒 ADMIN/STAFF | ✅ | Send portal invite |
| `/api/v1/contacts/accept-invite` | POST | No | ✅ | Accept portal invite |

### Budget

| Endpoint | Method | Auth | Status | Description |
|----------|--------|------|--------|-------------|
| `/api/v1/budget` | GET | 🔒 | ✅ | List budget items |
| `/api/v1/budget` | POST | 🔒 | ✅ | Create budget item |
| `/api/v1/budget/[id]` | GET | 🔒 | ✅ | Get budget item |
| `/api/v1/budget/[id]` | PATCH | 🔒 | ✅ | Update budget item |
| `/api/v1/budget/[id]` | DELETE | 🔒 | ✅ | Delete budget item |
| `/api/v1/budget/summary` | GET | 🔒 | ✅ | Budget summary |
| `/api/v1/budget/exceptions` | GET | 🔒 | ✅ | Budget exceptions |

### Schedule

| Endpoint | Method | Auth | Status | Description |
|----------|--------|------|--------|-------------|
| `/api/v1/schedule` | GET | 🔒 | ✅ | List events |
| `/api/v1/schedule` | POST | 🔒 | ✅ | Create event |
| `/api/v1/schedule/[id]` | GET | 🔒 | ✅ | Get event |
| `/api/v1/schedule/[id]` | PATCH | 🔒 | ✅ | Update event |
| `/api/v1/schedule/[id]` | DELETE | 🔒 | ✅ | Delete event |
| `/api/v1/schedule/today` | GET | 🔒 | ✅ | Today's events |
| `/api/v1/schedule/[id]/approve` | POST | 🔒 ADMIN/STAFF | 🚧 | Approve event |

### Procurement

| Endpoint | Method | Auth | Status | Description |
|----------|--------|------|--------|-------------|
| `/api/v1/procurement` | GET | 🔒 | ✅ | List items |
| `/api/v1/procurement` | POST | 🔒 | ✅ | Create item |
| `/api/v1/procurement/[id]` | GET | 🔒 | ✅ | Get item |
| `/api/v1/procurement/[id]` | PATCH | 🔒 | ✅ | Update item |
| `/api/v1/procurement/[id]` | DELETE | 🔒 | ✅ | Delete item |
| `/api/v1/procurement/[id]/approve` | POST | 🔒 | ✅ | Approve item |
| `/api/v1/procurement/bulk` | POST | 🔒 | ✅ | Bulk operations |
| `/api/v1/procurement/summary` | GET | 🔒 | ✅ | Summary stats |
| `/api/v1/procurement/analytics` | GET | 🔒 | ✅ | Analytics data |
| `/api/v1/procurement/export` | GET | 🔒 | ✅ | Export to CSV |

### RFP & Bidding

| Endpoint | Method | Auth | Status | Description |
|----------|--------|------|--------|-------------|
| `/api/projects/[projectId]/rfps` | GET | 🔒 | ✅ | List RFPs |
| `/api/projects/[projectId]/rfps` | POST | 🔒 | ✅ | Create RFP |
| `/api/projects/[projectId]/rfps/[rfpId]` | GET | 🔒 | ✅ | Get RFP |
| `/api/projects/[projectId]/rfps/[rfpId]` | PATCH | 🔒 | ✅ | Update RFP |
| `/api/projects/[projectId]/rfps/[rfpId]` | DELETE | 🔒 | ✅ | Delete RFP |
| `/api/projects/[projectId]/rfps/[rfpId]/items` | GET | 🔒 | ✅ | RFP items |
| `/api/projects/[projectId]/rfps/[rfpId]/items` | POST | 🔒 | ✅ | Add RFP item |
| `/api/projects/[projectId]/rfps/[rfpId]/publish` | POST | 🔒 | ✅ | Publish RFP |
| `/api/projects/[projectId]/rfps/[rfpId]/attachments` | GET | 🔒 | ✅ | RFP attachments |

### Admin Operations

| Endpoint | Method | Auth | Status | Description |
|----------|--------|------|--------|-------------|
| `/api/admin/set-claims` | POST | 🔒 ADMIN | ✅ | Set user claims |
| `/api/admin/invite-contractor` | POST | 🔒 ADMIN | ✅ | Invite contractor |

### Webhooks

| Endpoint | Method | Auth | Status | Description |
|----------|--------|------|--------|-------------|
| `/api/webhooks/gmail-inbound` | POST | Secret | 🚧 | Gmail integration |
| `/api/webhooks/calendar-event` | POST | Secret | 🚧 | Calendar sync |

### File Management

| Endpoint | Method | Auth | Status | Description |
|----------|--------|------|--------|-------------|
| `/api/signed-url` | POST | 🔒 | ✅ | Get upload URL |

### Response Formats

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

#### Pagination
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  }
}
```

---

## MODULE STATUS MATRIX

### Core Modules

| Module | Status | Completion | Frontend | API | Database | Tests | Notes |
|--------|--------|------------|----------|-----|----------|-------|-------|
| **Authentication** | ✅ Live | 100% | ✅ | ✅ | ✅ | ✅ | Firebase Auth + custom claims |
| **Projects** | ✅ Live | 100% | ✅ | ✅ | ✅ | ✅ | Full CRUD, archiving, favorites |
| **Users** | ✅ Live | 100% | ✅ | ✅ | ✅ | ✅ | Management, roles, permissions |
| **Tasks** | ✅ Live | 95% | ✅ | ✅ | ✅ | ✅ | Missing: recurring tasks |
| **Contacts** | ✅ Live | 90% | ✅ | ✅ | ✅ | 🚧 | Missing: bulk import |
| **Budget** | ✅ Live | 85% | ✅ | ✅ | ✅ | 🚧 | Missing: forecasting |
| **Schedule** | ✅ Live | 85% | ✅ | ✅ | ✅ | 🚧 | Missing: conflicts detection |
| **Procurement** | ✅ Live | 90% | ✅ | ✅ | ✅ | ✅ | Missing: vendor catalog |

### Advanced Modules

| Module | Status | Completion | Frontend | API | Database | Tests | Notes |
|--------|--------|------------|----------|-----|----------|-------|-------|
| **RFP/Bidding** | 🚧 Beta | 70% | 🚧 | ✅ | ✅ | 🚧 | UI needs completion |
| **Documents** | 🚧 Dev | 40% | 🚧 | 🚧 | ✅ | ❌ | File management system |
| **Decisions** | ✅ Live | 80% | ✅ | ✅ | ✅ | 🚧 | Missing: approval workflow |
| **Risks** | ✅ Live | 75% | ✅ | ✅ | ✅ | 🚧 | Missing: risk matrix |
| **Plans** | 🚧 Dev | 60% | 🚧 | ✅ | ✅ | ❌ | CAD viewer needed |
| **Invoices** | 🚧 Dev | 50% | 🚧 | 🚧 | ✅ | ❌ | Payment integration needed |
| **Meetings** | ❌ Planned | 0% | ❌ | ❌ | ✅ | ❌ | Not started |

### Feature Gaps & Roadmap

#### High Priority (Q1 2025)
1. **Document Management**
   - File versioning
   - CAD/PDF viewer
   - Approval workflows
   
2. **Mobile App**
   - React Native implementation
   - Offline support
   - Push notifications

3. **Reporting Dashboard**
   - Custom report builder
   - Export to PDF/Excel
   - Scheduled reports

#### Medium Priority (Q2 2025)
1. **Communication Hub**
   - In-app messaging
   - Email integration
   - SMS notifications

2. **Advanced Scheduling**
   - Resource allocation
   - Gantt charts
   - Critical path analysis

3. **Financial Module**
   - Invoice processing
   - Payment tracking
   - Financial reports

#### Low Priority (Future)
1. **AI Assistant**
   - Predictive analytics
   - Smart suggestions
   - Anomaly detection

2. **Integrations**
   - QuickBooks
   - Microsoft Project
   - AutoCAD

3. **Advanced Security**
   - 2FA/MFA
   - SSO/SAML
   - Audit compliance

---

## UI/UX SYSTEM DOCUMENTATION

### Design System

#### Color Palette (Dark Mode Only)
```css
/* Graphite Theme */
--background: 224 71% 4%      /* #090A0F - Near black */
--foreground: 213 31% 91%     /* #E1E7EF - Light gray */
--primary: 0 0% 67%           /* #ABABAB - Medium gray */
--secondary: 200 100% 10%     /* #003552 - Dark blue */
--accent: 160 60% 73%         /* #8EE3C8 - Teal green */
--destructive: 0 63% 31%      /* #822025 - Dark red */
--muted: 223 47% 11%          /* #0F172A - Dark slate */
--card: 224 71% 4%            /* #090A0F - Same as background */
--border: 216 34% 17%         /* #1D283A - Dark border */
```

#### Typography
```css
/* Font Stack */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif;

/* Size Scale */
--text-xs: 0.75rem    /* 12px */
--text-sm: 0.875rem   /* 14px */
--text-base: 1rem     /* 16px */
--text-lg: 1.125rem   /* 18px */
--text-xl: 1.25rem    /* 20px */
--text-2xl: 1.5rem    /* 24px */
--text-3xl: 1.875rem  /* 30px */
--text-4xl: 2.25rem   /* 36px */

/* Weight Scale */
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

#### Spacing System
```css
/* 4px base unit */
--space-1: 0.25rem   /* 4px */
--space-2: 0.5rem    /* 8px */
--space-3: 0.75rem   /* 12px */
--space-4: 1rem      /* 16px */
--space-6: 1.5rem    /* 24px */
--space-8: 2rem      /* 32px */
--space-12: 3rem     /* 48px */
--space-16: 4rem     /* 64px */
```

### Glass Morphism Design
```css
/* Glass Card Effect */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

/* Glass Button */
.glass-button {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}
```

### Component Library

#### Base Components (shadcn/ui)
- **Button**: Primary, Secondary, Destructive, Ghost, Link variants
- **Card**: Container with header, content, footer sections
- **Dialog**: Modal with backdrop, close on escape/click outside
- **Form**: React Hook Form integrated components
- **Input**: Text, number, email, password, textarea
- **Select**: Dropdown with search, multi-select
- **Table**: Sortable, filterable, paginated
- **Toast**: Notification system with auto-dismiss
- **Tooltip**: Hover information display
- **Badge**: Status indicators, tags
- **Skeleton**: Loading placeholders
- **Sheet**: Drawer for mobile, sidebar for desktop

#### Custom Components
```typescript
// Page Shell
<PageShell title="Page Title" description="Description">
  {content}
</PageShell>

// Data Table
<DataTable 
  columns={columns}
  data={data}
  searchKey="name"
  filters={filters}
/>

// Stats Card
<StatsCard
  title="Total Tasks"
  value={42}
  change={+12}
  icon={<TaskIcon />}
/>

// Empty State
<EmptyState
  icon={<EmptyIcon />}
  title="No items found"
  description="Create your first item"
  action={<Button>Create</Button>}
/>
```

### Responsive Design

#### Breakpoints
```css
/* Mobile First */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

#### Mobile Patterns
```typescript
// Drawer on mobile, Dialog on desktop
const Component = isMobile ? Drawer : Dialog

// Stack on mobile, Grid on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

// Touch-friendly sizing
<Button className="min-h-[48px] md:min-h-[40px]">

// Bottom sheet for mobile actions
<Drawer position="bottom" snapPoints={[0.5, 1]}>
```

### Accessibility Standards

#### WCAG 2.1 AA Compliance
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Focus Indicators**: Visible focus rings on all interactive elements
- **Keyboard Navigation**: Full keyboard support, tab order logical
- **Screen Readers**: ARIA labels, roles, and descriptions
- **Touch Targets**: Minimum 48x48px on mobile
- **Motion**: Respects prefers-reduced-motion

#### ARIA Implementation
```html
<!-- Buttons -->
<button aria-label="Delete task" aria-pressed="false">

<!-- Forms -->
<input aria-required="true" aria-invalid="false" aria-describedby="error">

<!-- Loading -->
<div role="status" aria-live="polite" aria-busy="true">

<!-- Navigation -->
<nav aria-label="Main navigation">
```

### Animation System

#### Framer Motion Presets
```typescript
// Fade In
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

// Slide Up
const slideUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.3 }
}

// Stagger Children
const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}
```

---

## TESTING STRATEGY & COVERAGE

### Test Framework

#### Technology Stack
```json
{
  "framework": "Jest 30.1.1",
  "transformer": "ts-jest 29.4.1",
  "environment": "node",
  "coverage": "jest --coverage",
  "watch": "jest --watch"
}
```

#### Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
}
```

### Test Categories

#### 1. Security Tests (✅ Implemented)
```typescript
// Location: __tests__/security/

- Authentication Tests
  ✅ Token validation
  ✅ Expired token handling
  ✅ Invalid token rejection
  ✅ Missing auth header

- RBAC Tests
  ✅ Role-based access per endpoint
  ✅ Permission elevation prevention
  ✅ Module access verification

- IDOR Tests
  ✅ Cross-project access prevention
  ✅ User data isolation
  ✅ Resource ownership validation

- Rate Limiting Tests
  ✅ Per-role limits enforced
  ✅ Rate limit headers
  ✅ 429 response on exceed

- Policy Enforcement
  ✅ CSP headers
  ✅ HSTS enforcement
  ✅ Security headers validation
```

#### 2. Unit Tests (🚧 Partial)
```typescript
// Utility functions
- Date formatting
- String validation
- Number formatting
- URL generation

// Business logic
- Task dependency validation
- Budget calculations
- Schedule conflict detection
- Permission checks
```

#### 3. Integration Tests (❌ Planned)
```typescript
// API Integration
- Full request/response cycle
- Database transactions
- Multi-step workflows
- Error propagation

// External Services
- Firebase Auth flow
- File upload to Storage
- Email notifications
- Webhook processing
```

#### 4. E2E Tests (❌ Planned)
```typescript
// Critical User Flows
- User registration
- Project creation
- Task management
- Contact portal invite
- Budget approval workflow
```

### Test Data Management

#### Fixtures
```typescript
// __tests__/fixtures/
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'ADMIN'
}

export const mockProject = {
  id: 'test-project-id',
  name: 'Test Project',
  status: 'ACTIVE'
}
```

#### Database Seeding
```typescript
// prisma/seed.ts
async function seed() {
  // Clear existing data
  await prisma.task.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
  
  // Create test data
  await prisma.user.create({ data: testUser })
  await prisma.project.create({ data: testProject })
}
```

### Coverage Reports

#### Current Coverage
```
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   72.4  |   68.2   |   70.1  |   71.8  |
 api/               |   85.3  |   82.1   |   84.2  |   85.0  |
  auth-check.ts     |   92.1  |   89.3   |   90.0  |   91.8  |
  response.ts       |   88.5  |   85.0   |   87.3  |   88.1  |
 components/        |   62.3  |   58.1   |   60.2  |   61.9  |
 lib/               |   78.2  |   74.5   |   76.8  |   77.9  |
```

#### Coverage Goals
- **Critical Paths**: 90% coverage
- **API Routes**: 85% coverage
- **UI Components**: 70% coverage
- **Utilities**: 95% coverage

### CI/CD Testing Pipeline

```yaml
# GitHub Actions
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test:security:ci
      - run: npm run build
```

### Test Commands

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific suite
npm run test:security

# Watch mode
npm run test:security:watch

# CI mode
npm run test:security:ci

# Update snapshots
npm test -- -u
```

---

## OPERATIONS & OBSERVABILITY

### Logging Strategy

#### Winston Configuration
```typescript
// lib/logger.ts
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    // File rotation
    new DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
})
```

#### Log Levels
```typescript
// Severity levels
logger.error('Critical error', { error, userId, context })
logger.warn('Warning condition', { warning, metadata })
logger.info('Information', { action, userId })
logger.debug('Debug information', { data })
logger.verbose('Verbose logging', { details })
```

### Health Monitoring

#### Health Check Endpoint
```typescript
// /api/health
{
  "status": "healthy",
  "timestamp": "2025-09-12T10:00:00Z",
  "environment": "production",
  "version": "0.1.0",
  "checks": {
    "database": "connected",
    "firebase": "authenticated",
    "storage": "available"
  }
}
```

#### Monitoring Points
1. **API Response Times**: P50, P95, P99 latencies
2. **Error Rates**: 4xx, 5xx per endpoint
3. **Database**: Connection pool, query times
4. **Authentication**: Login failures, token refreshes
5. **Resources**: Memory, CPU usage

### Database Operations

#### Backup Strategy
```bash
# Automated daily backups
npm run db:backup

# Creates timestamped dump
backups/db-backup-2025-09-12-10-00-00.sql

# Retention: 30 days local, 90 days cloud
```

#### Restore Process
```bash
# Restore from backup
npm run db:restore backups/db-backup-2025-09-12.sql

# Verify restoration
npx prisma db pull
npm run db:studio
```

#### Migration Rollback
```bash
# View migration history
npx prisma migrate status

# Mark as rolled back
npx prisma migrate resolve --rolled-back

# Apply previous migration
npx prisma migrate deploy
```

### Deployment Process

#### Pre-deployment Checklist
```bash
✅ All tests passing
✅ Build successful
✅ Environment variables verified
✅ Database migrations ready
✅ Backup created
✅ Rollback plan documented
```

#### Deployment Steps
```bash
# 1. Build Docker image
docker build -t construction-app:v1.0.0 .

# 2. Run migrations
npm run db:migrate deploy

# 3. Deploy container
docker-compose up -d

# 4. Verify health
curl https://app.com/api/health

# 5. Smoke tests
npm run test:smoke
```

#### Rollback Procedure
```bash
# 1. Stop new deployment
docker-compose stop app

# 2. Restore previous version
docker-compose up -d app:previous

# 3. Rollback database if needed
npm run db:restore backups/pre-deploy.sql

# 4. Verify system health
curl https://app.com/api/health
```

### Error Tracking

#### Error Categories
1. **Authentication Errors**: Token expired, invalid credentials
2. **Authorization Errors**: Insufficient permissions
3. **Validation Errors**: Invalid input data
4. **Database Errors**: Connection lost, constraint violations
5. **External Service Errors**: Firebase, storage failures

#### Error Response Format
```json
{
  "success": false,
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "timestamp": "2025-09-12T10:00:00Z",
  "requestId": "req-uuid",
  "details": {
    "field": "specific error detail"
  }
}
```

### Performance Metrics

#### Key Metrics
- **TTFB** (Time to First Byte): < 200ms
- **FCP** (First Contentful Paint): < 1.8s
- **LCP** (Largest Contentful Paint): < 2.5s
- **TTI** (Time to Interactive): < 3.8s
- **CLS** (Cumulative Layout Shift): < 0.1

#### Database Optimization
```sql
-- Indexes for common queries
CREATE INDEX idx_tasks_project_status ON tasks(projectId, status);
CREATE INDEX idx_contacts_portal ON contacts(projectId, portalStatus);
CREATE INDEX idx_audit_user_time ON audit_logs(userId, timestamp);
```

### Incident Response

#### Severity Levels
- **P0**: System down, data loss risk (15 min response)
- **P1**: Critical feature broken (30 min response)
- **P2**: Significant degradation (2 hour response)
- **P3**: Minor issue (24 hour response)

#### Response Process
1. **Detect**: Monitoring alert or user report
2. **Assess**: Determine severity and impact
3. **Communicate**: Notify stakeholders
4. **Mitigate**: Apply immediate fix or workaround
5. **Resolve**: Implement permanent solution
6. **Review**: Post-mortem and prevention

---

## THIRD-PARTY INTEGRATIONS

### Firebase Services

#### Firebase Authentication
```typescript
// Configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
}

// Providers
- Email/Password
- Google OAuth
- Password reset via email
- Custom claims for roles
```

#### Firebase Admin SDK
```typescript
// Server-side operations
- Token verification
- Custom claims management
- User management
- Security rules enforcement
```

#### Firebase Storage (Planned)
```typescript
// File storage configuration
- User uploads: /users/{uid}/files/
- Project files: /projects/{projectId}/
- Public assets: /public/
- Signed URLs for security
```

### Database (PostgreSQL/Supabase)

#### Connection Configuration
```typescript
// Prisma connection
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Connection pooling
?pgbouncer=true&connection_limit=1
```

#### Supabase Features (Optional)
- Realtime subscriptions
- Row-level security
- Edge functions
- Vector embeddings

### Email Services (Future)

#### SendGrid Integration
```typescript
// Email templates
- Welcome email
- Password reset
- Portal invitation
- Task notifications
- Daily digest
```

#### Configuration
```env
SENDGRID_API_KEY="SG.xxx"
SENDGRID_FROM="noreply@app.com"
SENDGRID_TEMPLATE_WELCOME="d-xxx"
```

### Webhook Integrations

#### Inbound Webhooks
```typescript
// Gmail Integration
POST /api/webhooks/gmail-inbound
Headers: x-webhook-secret
Body: Email content for task creation

// Calendar Sync
POST /api/webhooks/calendar-event
Headers: x-webhook-secret
Body: Calendar event for schedule
```

#### Outbound Webhooks (n8n)
```typescript
// Workflow triggers
- Task status change
- Budget approval needed
- Project milestone reached
- Document uploaded
```

### Analytics (Optional)

#### Google Analytics 4
```typescript
// Page views
gtag('config', 'G-XXXXXXXXXX')

// Events
gtag('event', 'task_completed', {
  project_id: projectId,
  task_priority: priority
})
```

#### PostHog
```typescript
// Feature flags
const showNewFeature = posthog.isFeatureEnabled('new-feature')

// User tracking
posthog.identify(userId, { role, plan })

// Events
posthog.capture('task_created', { properties })
```

### Payment Processing (Future)

#### Stripe Integration
```typescript
// Invoice payments
- Create payment intent
- Process card payments
- Handle webhooks
- Generate receipts
```

### Cloud Storage (Future)

#### AWS S3 Compatible
```typescript
// Configuration
AWS_ACCESS_KEY_ID="xxx"
AWS_SECRET_ACCESS_KEY="xxx"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="construction-files"

// File operations
- Multipart upload
- Presigned URLs
- Lifecycle policies
- CDN distribution
```

### External APIs

#### Weather API (Example)
```typescript
// OpenWeatherMap
const weather = await fetch(
  `https://api.openweathermap.org/data/2.5/weather?q=Miami&appid=${API_KEY}`
)
```

#### Geocoding (Future)
```typescript
// Google Maps API
- Address validation
- Coordinates lookup
- Distance calculation
- Route optimization
```

---

## PERFORMANCE & CACHING STRATEGY

### Client-Side Caching

#### TanStack Query Configuration
```typescript
// Global query client settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,       // 1 minute
      cacheTime: 5 * 60 * 1000,    // 5 minutes  
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always'
    }
  }
})
```

#### Cache Keys Strategy
```typescript
// Hierarchical cache keys
['projects'] // All projects
['projects', projectId] // Single project
['projects', projectId, 'tasks'] // Project tasks
['projects', projectId, 'tasks', filters] // Filtered tasks

// Invalidation patterns
queryClient.invalidateQueries(['projects']) // Invalidate all
queryClient.invalidateQueries(['projects', projectId]) // Specific
```

#### Optimistic Updates
```typescript
// Immediate UI update
useMutation({
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['tasks'])
    const previous = queryClient.getQueryData(['tasks'])
    queryClient.setQueryData(['tasks'], old => [...old, newData])
    return { previous }
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['tasks'], context.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries(['tasks'])
  }
})
```

### API Response Caching

#### Cache Headers
```typescript
// Static content (1 year)
Cache-Control: public, max-age=31536000, immutable

// Dynamic content (no cache)
Cache-Control: no-store, must-revalidate

// API responses (short cache)
Cache-Control: private, max-age=60, stale-while-revalidate=300
```

#### Conditional Requests
```typescript
// ETag support
response.headers.set('ETag', generateETag(data))

// If-None-Match handling
if (request.headers.get('If-None-Match') === etag) {
  return new Response(null, { status: 304 })
}
```

### Database Optimization

#### Query Optimization
```typescript
// Use select to limit fields
await prisma.task.findMany({
  select: {
    id: true,
    title: true,
    status: true
  }
})

// Pagination
await prisma.task.findMany({
  take: 20,
  skip: page * 20,
  orderBy: { createdAt: 'desc' }
})

// Batch operations
await prisma.task.updateMany({
  where: { projectId },
  data: { status: 'COMPLETED' }
})
```

#### Connection Pooling
```env
# Development
DATABASE_URL="postgresql://...?connection_limit=5"

# Production
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=25"
```

#### Indexes
```sql
-- Frequently queried combinations
CREATE INDEX idx_tasks_project_status ON tasks(projectId, status);
CREATE INDEX idx_tasks_assigned ON tasks(assignedToId, status);
CREATE INDEX idx_contacts_project ON contacts(projectId, portalStatus);
CREATE INDEX idx_budget_project ON budget_items(projectId, category);
```

### Asset Optimization

#### Image Optimization
```typescript
// Next.js Image component
import Image from 'next/image'

<Image
  src="/hero.jpg"
  width={1200}
  height={600}
  quality={85}
  placeholder="blur"
  loading="lazy"
/>
```

#### Code Splitting
```typescript
// Dynamic imports
const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  { 
    loading: () => <Skeleton />,
    ssr: false 
  }
)

// Route-based splitting (automatic in Next.js)
```

#### Bundle Optimization
```javascript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    // Tree shaking
    config.optimization.usedExports = true
    
    // Minimize
    config.optimization.minimize = true
    
    return config
  }
}
```

### Performance Monitoring

#### Core Web Vitals
```typescript
// Measure and report
export function reportWebVitals(metric) {
  const { id, name, label, value } = metric
  
  // Send to analytics
  gtag('event', name, {
    event_category: 'Web Vitals',
    event_label: id,
    value: Math.round(name === 'CLS' ? value * 1000 : value),
    non_interaction: true
  })
}
```

#### Performance Budget
```json
{
  "javascript": "< 500KB",
  "css": "< 100KB",
  "images": "< 1MB per page",
  "fonts": "< 200KB",
  "time-to-interactive": "< 3.8s",
  "first-contentful-paint": "< 1.8s"
}
```

### Server-Side Optimization

#### API Route Caching
```typescript
// In-memory cache for expensive operations
const cache = new Map()

export async function GET(request) {
  const key = request.url
  
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key)
    if (Date.now() - timestamp < 60000) { // 1 minute
      return successResponse(data)
    }
  }
  
  const data = await expensiveOperation()
  cache.set(key, { data, timestamp: Date.now() })
  
  return successResponse(data)
}
```

#### Background Jobs
```typescript
// Defer non-critical operations
async function handleRequest(data) {
  // Immediate response
  await saveToDatabase(data)
  
  // Background processing
  setImmediate(() => {
    sendNotifications(data)
    updateAnalytics(data)
    generateReports(data)
  })
  
  return { success: true }
}
```

---

## APPENDICES

### A. Error Codes Reference

| Code | Description | HTTP Status | Resolution |
|------|-------------|-------------|------------|
| AUTH_REQUIRED | No authentication provided | 401 | Sign in required |
| AUTH_INVALID | Invalid token | 401 | Sign in again |
| AUTH_EXPIRED | Token expired | 401 | Refresh token |
| PERMISSION_DENIED | Insufficient permissions | 403 | Contact admin |
| NOT_FOUND | Resource not found | 404 | Check ID/URL |
| VALIDATION_ERROR | Invalid input | 400 | Check request data |
| RATE_LIMIT | Too many requests | 429 | Wait and retry |
| SERVER_ERROR | Internal error | 500 | Contact support |
| DB_ERROR | Database error | 503 | Retry later |

### B. Webhook Security

```typescript
// Webhook validation
function validateWebhook(request: Request): boolean {
  const secret = request.headers.get('x-webhook-secret')
  return secret === process.env.WEBHOOK_SECRET
}

// Webhook payload structure
{
  "event": "task.created",
  "timestamp": "2025-09-12T10:00:00Z",
  "data": { ... },
  "signature": "sha256=..."
}
```

### C. API Versioning Strategy

```
/api/v1/ - Current stable version
/api/v2/ - Next version (when needed)
/api/experimental/ - Beta features

Deprecation policy:
- 6 months notice before deprecation
- Sunset headers in responses
- Migration guide provided
```

### D. Security Checklist

- [ ] All environment variables set
- [ ] Firebase service account secured
- [ ] Database connection encrypted (SSL)
- [ ] HTTPS enforced in production
- [ ] CSP headers configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Audit logging active
- [ ] Backup strategy implemented
- [ ] Incident response plan documented

### E. Development Tools

```bash
# Prisma Studio - Visual database browser
npm run db:studio

# API Testing - Thunder Client / Postman
Import collection from: docs/api-collection.json

# Performance Testing - Lighthouse
npm run build && npm start
lighthouse http://localhost:3000

# Security Scanning
npm audit
npm audit fix

# Bundle Analysis
npm run build
npx @next/bundle-analyzer
```

---

## VERSION HISTORY

- **v3.0** (2025-09-12) - Complete technical specification with all missing details
- **v2.0** (Previous) - Added Users module and refined architecture
- **v1.5** (Previous) - Stage 1.2 implementation begun
- **v1.0** (Previous) - Initial system design and Projects module
- **v0.5** (Previous) - Proof of concept and technology selection

---

## CONTACT & SUPPORT

**Project**: Miami Duplex Construction Management System  
**Repository**: [GitHub URL]  
**Documentation**: This document serves as the single source of truth  
**Last Updated**: September 12, 2025  

---

*This document represents the complete technical specification of the Miami Duplex Construction Management System. It is maintained as the authoritative reference for all development, deployment, and operational activities.*