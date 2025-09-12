# MASTER CONTEXT DOCUMENT
## Miami Duplex Construction Management System
### Version 2.0 - Comprehensive Architecture & Implementation Guide

---

## EXECUTIVE SUMMARY

This document serves as the single source of truth for the Miami Duplex Construction Management System. It consolidates all technical decisions, architectural patterns, and implementation guidelines from the entire project history.

**Project Status**: Active Development - Stage 1.2 (Users Module) Complete
**Tech Stack**: Next.js 15, TypeScript, Prisma, PostgreSQL, Firebase Auth
**Architecture**: Modular monolith with clear domain boundaries
**Target**: Production-ready construction management platform

---

## SYSTEM ARCHITECTURE

### Core Technology Stack

```typescript
// Framework & Runtime
- Next.js: 15.0.3 (App Router)
- React: 19.0.0-rc
- TypeScript: 5.x (strict mode)
- Node.js: 20.x LTS

// Database & ORM
- PostgreSQL: 15.x (Supabase hosted)
- Prisma: 5.22.0 (ORM with type safety)
- Database URL: Configured via DATABASE_URL env

// Authentication & Authorization
- Firebase Auth: 11.0.2 (Admin SDK: 13.0.1)
- Custom claims for role-based access
- JWT tokens with project-scoped permissions

// State Management & Data Fetching
- TanStack Query: 5.59.20 (server state)
- React Hook Form: 7.53.2 (form state)
- Zustand: (when needed for client state)

// UI & Styling
- Tailwind CSS: 3.4.1
- Radix UI: Headless components
- Lucide React: Icons
- Framer Motion: Animations

// Development & Quality
- ESLint: Next.js config
- Prettier: Code formatting
- Husky: Git hooks
- Jest: Testing framework
```

### Directory Structure

```
control-center/
├── app/                      # Next.js 15 App Router
│   ├── (auth)/              # Auth group (login, register)
│   ├── admin/               # Admin dashboard routes
│   ├── api/                 # API routes
│   │   └── v1/             # Versioned API endpoints
│   ├── contractor/         # Contractor portal routes
│   └── contexts/           # React contexts (Auth, Project)
├── components/              # React components
│   ├── ui/                # Base UI components (shadcn)
│   ├── forms/             # Form components
│   └── [feature]/         # Feature-specific components
├── lib/                    # Core utilities
│   ├── api/               # API utilities
│   ├── auth/              # Auth helpers
│   ├── db/                # Database client
│   └── utils/             # General utilities
├── prisma/                # Database schema
│   ├── schema.prisma      # Main schema file
│   └── seed.ts           # Seed data
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── public/               # Static assets
```

### Database Schema Overview

```prisma
// Core Models (30+ tables)
model Project {
  id          String   @id @default(cuid())
  name        String
  address     String
  status      ProjectStatus
  // ... relationships to all other models
}

model User {
  id          String   @id @default(cuid())
  firebaseUid String   @unique
  email       String   @unique
  role        Role     @default(VIEWER)
  // ... profile and relationships
}

model Task {
  id              String   @id @default(cuid())
  title           String
  status          TaskStatus
  priority        Priority
  // Dual assignment system
  assignedToId    String?  // User assignment
  assignedContactId String? // Contact assignment
}

model Contact {
  id           String   @id @default(cuid())
  name         String
  email        String?
  phone        String?
  company      String?
  role         String?
  // Portal access system
  portalAccess Boolean  @default(false)
  userId       String?  // Links to User if portal enabled
}

// Additional models: Budget, Schedule, Documents, etc.
```

---

## AUTHENTICATION & AUTHORIZATION

### Firebase Integration

```typescript
// Client-side initialization (lib/firebaseClient.ts)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... other config
};

// Server-side Admin SDK (lib/firebaseAdmin.ts)
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!, 'base64').toString()
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
```

### Role-Based Access Control

```typescript
enum Role {
  ADMIN = 'ADMIN',       // Full system access
  STAFF = 'STAFF',       // Project management access
  CONTRACTOR = 'CONTRACTOR', // Limited project access
  VIEWER = 'VIEWER'      // Read-only access
}

// Custom claims structure
interface CustomClaims {
  role: Role;
  projectIds?: string[];  // Assigned projects
  permissions?: string[]; // Granular permissions
}
```

### Auth Context Pattern

```typescript
// app/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  userRole: Role | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: UpdateProfileData) => Promise<void>;
}
```

---

## API ARCHITECTURE

### RESTful Endpoints

All API routes follow consistent patterns:

```typescript
// Standard response format
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

// Error handling
export function errorResponse(error: any): NextResponse {
  console.error('API Error:', error);
  return NextResponse.json({
    success: false,
    error: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR'
  }, { 
    status: error.status || 500 
  });
}

// Success response
export function successResponse<T>(
  data: T, 
  message?: string, 
  status = 200
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message
  }, { status });
}
```

### API Route Structure

```
/api/v1/
├── auth/
│   ├── verify          # Token verification
│   └── refresh         # Token refresh
├── users/
│   ├── [GET]          # List users
│   ├── [POST]         # Create user
│   └── [id]/
│       ├── [GET]      # Get user
│       ├── [PATCH]    # Update user
│       └── [DELETE]   # Delete user
├── projects/
├── tasks/
├── contacts/
├── budget/
├── schedule/
└── documents/
```

### Middleware & Guards

```typescript
// API Authentication Middleware
export async function requireAuth(
  request: Request
): Promise<DecodedIdToken> {
  const token = request.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) {
    throw new ApiError('No token provided', 401);
  }
  
  try {
    return await adminAuth.verifyIdToken(token);
  } catch (error) {
    throw new ApiError('Invalid token', 401);
  }
}

// Role-based middleware
export async function requireRole(
  request: Request,
  allowedRoles: Role[]
): Promise<DecodedIdToken> {
  const decodedToken = await requireAuth(request);
  const userRole = decodedToken.role as Role;
  
  if (!allowedRoles.includes(userRole)) {
    throw new ApiError('Insufficient permissions', 403);
  }
  
  return decodedToken;
}
```

---

## STATE MANAGEMENT

### TanStack Query Setup

```typescript
// app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // 1 minute
      cacheTime: 5 * 60 * 1000,     // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Custom Hooks Pattern

```typescript
// hooks/use-api.ts
export function useProjects(enabled = true) {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.get('/projects'),
    enabled,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateProjectData) => 
      apiClient.post('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
    },
  });
}
```

---

## UI/UX PATTERNS

### Component Architecture

```typescript
// Base component pattern
interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

// Compound component pattern
const Card = ({ children, className }: ComponentProps) => (
  <div className={cn("rounded-lg border", className)}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;
```

### Form Handling

```typescript
// React Hook Form + Zod validation
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.enum(['ADMIN', 'STAFF', 'CONTRACTOR', 'VIEWER']),
});

type FormData = z.infer<typeof formSchema>;

function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: 'VIEWER',
    },
  });
  
  const onSubmit = async (data: FormData) => {
    // Handle submission
  };
}
```

### Loading States

```typescript
// Skeleton loading pattern
function TaskSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

// Suspense boundary pattern
<Suspense fallback={<TaskSkeleton />}>
  <TaskList />
</Suspense>
```

---

## MODULE SPECIFICATIONS

### 1. Projects Module
- **Status**: Complete
- **Features**: CRUD, status tracking, team assignment
- **Key Components**: ProjectList, ProjectForm, ProjectDetail
- **API**: `/api/v1/projects/*`

### 2. Users Module
- **Status**: Complete (Stage 1.2)
- **Features**: 
  - User management CRUD
  - Role assignment
  - Profile management
  - Contact portal invitations
- **Key Components**: UsersList, UserForm, UserDetail, InviteDialog
- **API**: `/api/v1/users/*`

### 3. Tasks Module
- **Status**: In Development (Stage 1.3)
- **Features**: 
  - Task CRUD operations
  - Dual assignment (Users & Contacts)
  - Priority & status management
  - Subtasks and dependencies
- **Components**: TaskBoard, TaskList, TaskForm
- **API**: `/api/v1/tasks/*`

### 4. Contacts Module
- **Status**: Planned
- **Features**: Contact management, portal access, communication log

### 5. Budget Module
- **Status**: Planned
- **Features**: Budget tracking, expense management, financial reports

### 6. Schedule Module
- **Status**: Planned
- **Features**: Calendar, milestones, Gantt charts

### 7. Documents Module
- **Status**: Planned
- **Features**: File management, versioning, approvals

---

## SECURITY CONSIDERATIONS

### Data Protection
```typescript
// Input sanitization
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// SQL injection prevention (handled by Prisma)
// XSS prevention (handled by React)
// CSRF protection (handled by Next.js)
```

### Environment Variables
```env
# Required environment variables
DATABASE_URL=             # PostgreSQL connection string
NEXT_PUBLIC_FIREBASE_*=   # Firebase client config
FIREBASE_SERVICE_ACCOUNT_BASE64= # Admin SDK credentials
NEXTAUTH_SECRET=          # Session encryption
WEBHOOK_SECRET=           # Webhook validation
```

### Rate Limiting
```typescript
// API rate limiting configuration
const rateLimiter = new Map();

export function rateLimit(identifier: string, limit = 10, window = 60000) {
  const now = Date.now();
  const requests = rateLimiter.get(identifier) || [];
  const recentRequests = requests.filter((time: number) => now - time < window);
  
  if (recentRequests.length >= limit) {
    throw new ApiError('Rate limit exceeded', 429);
  }
  
  recentRequests.push(now);
  rateLimiter.set(identifier, recentRequests);
}
```

---

## DEPLOYMENT & INFRASTRUCTURE

### Build Configuration
```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

### Docker Setup
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS dev
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

FROM base AS production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
CMD ["npm", "start"]
```

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
name: CI/CD
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

---

## DEVELOPMENT WORKFLOW

### Git Strategy
```bash
# Branch naming
feature/module-name-description
bugfix/issue-number-description
hotfix/critical-issue-description

# Commit message format
type(scope): description

# Types: feat, fix, docs, style, refactor, test, chore
# Example: feat(users): add bulk invite functionality
```

### Code Quality Standards
1. **TypeScript**: Strict mode, no any types
2. **Components**: Functional, typed props, proper memo usage
3. **API Routes**: Consistent error handling, validation
4. **Database**: Transactions for multi-table operations
5. **Testing**: Unit tests for utilities, integration for API

### Development Process
1. Create feature branch from develop
2. Implement with tests
3. Run linting and type checking
4. Create pull request with description
5. Code review by team
6. Merge to develop
7. Deploy to staging
8. Test in staging
9. Merge to main
10. Deploy to production

---

## PERFORMANCE OPTIMIZATION

### Frontend Optimization
```typescript
// Dynamic imports for code splitting
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
});

// Image optimization
import Image from 'next/image';
<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority={false}
  loading="lazy"
/>

// Memo optimization
const MemoizedComponent = memo(Component, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id;
});
```

### Backend Optimization
```typescript
// Database query optimization
const tasks = await prisma.task.findMany({
  where: { projectId },
  include: {
    assignedTo: {
      select: { id: true, name: true, email: true }
    }
  },
  take: 20,
  orderBy: { createdAt: 'desc' }
});

// Caching strategy
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const data = await fetchData();
await redis.set(cacheKey, JSON.stringify(data), 'EX', 3600);
return data;
```

---

## TROUBLESHOOTING

### Common Issues

1. **Database Connection**
```bash
# Check connection
npx prisma db pull

# Reset database
npx prisma migrate reset
```

2. **Firebase Auth Issues**
```typescript
// Verify service account
console.log(admin.apps.length); // Should be > 0

// Check custom claims
const token = await admin.auth().verifyIdToken(idToken);
console.log(token.customClaims);
```

3. **Build Failures**
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

---

## APPENDICES

### A. API Endpoint Reference
[Complete list of all API endpoints with request/response examples]

### B. Database Schema Diagram
[Visual representation of all database relationships]

### C. Component Library
[Documentation of all reusable components]

### D. Error Codes
[Comprehensive list of application error codes and meanings]

### E. Environment Setup
[Step-by-step guide for setting up development environment]

---

## VERSION HISTORY

- **v2.0** (Current) - Complete Users module, refined architecture
- **v1.5** - Stage 1.2 implementation begun
- **v1.0** - Initial system design and Projects module
- **v0.5** - Proof of concept and technology selection

---

## CONTACT & SUPPORT

**Project Lead**: Miami Duplex Development Team
**Repository**: [GitHub Repository URL]
**Documentation**: [Documentation URL]
**Support**: [Support Email]

---

*This document is maintained as the single source of truth for the Miami Duplex Construction Management System. It should be updated with every significant architectural decision or implementation change.*