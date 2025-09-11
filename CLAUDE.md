# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a construction management system for the Miami Duplex Remodel project built with Next.js 15 App Router, TypeScript, Prisma ORM, Firebase Auth, and PostgreSQL. The system features dual dashboards for Admin/Staff and Contractors with role-based access control.

The main application is located in the `control-center/` subdirectory, which is a git submodule. All development work should focus on the control-center application.

## Critical Commands

All commands should be run from the `control-center/` directory:

```bash
cd control-center
```

### Development
```bash
npm run dev                  # Start dev server (port 3000)
npm run build               # Production build
npm run lint                # Run ESLint checks
npm start                   # Start production server
```

### Database Operations
```bash
npx prisma generate         # Generate Prisma client after schema changes
npm run db:push            # Push schema changes without migrations (development)
npm run db:migrate         # Create and apply migrations (development)
npm run db:seed            # Seed database with initial data
npm run db:studio          # Open Prisma Studio GUI at port 5555
npm run db:backup          # Backup database to file
npm run db:restore         # Restore database from backup
```

### Testing
```bash
npm test                    # Run all tests
npm run test:security       # Run security tests with coverage
npm run test:security:watch # Watch security tests
npm run test:security:ci    # Run security tests in CI mode
```

### Admin Operations
```bash
npm run create-admin        # Create admin user (interactive script)
```

## High-Level Architecture

### Repository Structure
- **Root**: Contains MASTER_PLAN.md and project documentation
- **control-center/**: Main Next.js application (git submodule)
- All development work happens in `control-center/`

### Route Structure (in control-center/)
The application uses Next.js 15 App Router with three main route groups:

1. **Public Routes** (`/`, `/login`, `/accept-invite`)
   - No authentication required
   - Login and contractor invitation acceptance flows

2. **Admin Routes** (`/admin/*`)
   - Requires ADMIN or STAFF role
   - Full project management capabilities
   - Located in `app/admin/` directory

3. **Contractor Routes** (`/contractor/*`)
   - Requires CONTRACTOR role
   - Limited access based on module permissions
   - Located in `app/contractor/` directory

### Authentication Flow
- Firebase Auth handles user authentication (Google OAuth + Email/Password)
- Custom claims stored in Firebase determine user roles (ADMIN, STAFF, CONTRACTOR, VIEWER)
- `AuthContext` (`app/contexts/AuthContext.tsx`) manages auth state globally
- API routes verify auth via middleware and `lib/api/auth-check.ts`
- Role verification happens at both client and server levels

### Database Architecture
- **PostgreSQL Database** via Prisma ORM
- **Complex Schema**: 30+ models covering projects, tasks, contacts, budgets, procurement, RFPs, bidding
- **Key Relationships**: 
  - Tasks can be assigned to Users OR Contacts (dual assignment system)
  - Contacts can have portal access (linked to User model)
  - Projects contain all other entities (tasks, schedules, budgets, etc.)
  - New bidding system with RFPs, Vendors, Bids, and Awards

### API Structure (`/api/v1/*`)
All API routes follow RESTful patterns with consistent response formats:
- Success: `{ success: true, data: {...}, message?: string }`
- Error: `{ success: false, error: string, code?: string }`
- Auth verification via Firebase Admin SDK
- Request validation using Zod schemas in `lib/validations/`

### Component Organization
- `components/ui/` - shadcn/ui base components (Button, Dialog, etc.)
- `components/blocks/` - Page-level components (PageShell, navigation)
- `components/contacts/`, `components/schedule/`, etc. - Feature-specific components
- All components use TypeScript with proper prop interfaces

### State Management
- **Server State**: TanStack Query (React Query) for API calls
- **Client State**: React hooks and Context API
- **Custom Hooks**: `hooks/use-api.ts` contains reusable API hooks with caching
- **Optimistic Updates**: Enabled for better UX in forms

### Styling System
- Tailwind CSS with custom graphite theme colors (dark mode only)
- Glass morphism design with backdrop filters
- Custom CSS utilities in `app/globals.css`
- Responsive breakpoints: mobile-first approach with drawer/sheet patterns

## Key Files to Understand

1. **`prisma/schema.prisma`** - Complete database schema (30+ models)
2. **`app/contexts/AuthContext.tsx`** - Global auth state management  
3. **`lib/api/auth-check.ts`** - Server-side auth verification helpers
4. **`lib/firebaseClient.ts`** & **`lib/firebaseAdmin.ts`** - Firebase configuration
5. **`hooks/use-api.ts`** - Reusable API hooks for data fetching with caching
6. **`app/admin/layout.tsx`** - Admin dashboard layout wrapper
7. **`middleware.ts`** - Next.js middleware for auth routing
8. **`.env.local`** - Environment variables (Firebase keys, DATABASE_URL)
9. **`MASTER_PLAN.md`** - Project roadmap and implementation plan

## Mobile-First Considerations

When implementing features, prioritize mobile experience:
- Use drawer sheets instead of desktop modals on mobile
- Minimum 48px touch targets
- Bottom sheets for mobile modals using `vaul` library
- Card views default on mobile, table views on desktop
- Responsive grid layouts (1 col mobile → 4 cols desktop)
- Touch-friendly form inputs with proper height

## Common Patterns

### API Route Pattern
```typescript
export async function GET/POST/PUT/DELETE(request: NextRequest) {
  try {
    const authUser = await requireAuth(); // or requireRole(['ADMIN'])
    // Validate request with Zod
    // Perform operation
    return successResponse(data);
  } catch (error) {
    return errorResponse(error);
  }
}
```

### Component with Data Fetching
```typescript
// Use custom hooks from hooks/use-api.ts
const { data, isLoading, error, refetch } = useContacts({ 
  projectId,
  // Optional cache key for specific queries
  queryKey: ['contacts', projectId, filters]
});
```

### Form Handling
```typescript
// Use react-hook-form with Zod validation
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: {...}
});
```

### Mobile-Responsive Components
```typescript
// Use media queries and conditional rendering
const isMobile = useMediaQuery('(max-width: 768px)');

return isMobile ? (
  <DrawerSheet>...</DrawerSheet>
) : (
  <Dialog>...</Dialog>
);
```

## Important Development Notes

- Always run `npx prisma generate` after modifying `schema.prisma`
- Database migrations should be created with meaningful names
- The system expects `projectId` in most API calls - get from URL params or project context
- Contact assignment system: Tasks can be assigned to `assignedToId` (User) OR `assignedContactId` (Contact)
- Portal invitation flow: Contacts → Send Invite → Accept at `/accept-invite` → Creates User account
- File uploads use Firebase Storage with signed URLs for security
- Webhook endpoints require `x-webhook-secret` header matching env variable
- New bidding system allows RFP creation, vendor invitations, and bid management
- Security tests ensure proper auth validation on all API endpoints

## Testing Strategy

- **Unit Tests**: Jest with coverage reporting
- **Security Tests**: Dedicated suite testing auth validation on API routes
- **E2E Tests**: Planned with Playwright for critical user flows
- Run security tests before any auth-related changes: `npm run test:security`

## Environment Setup

Critical environment variables (see .env.example):
- Firebase client SDK keys (public)
- Firebase Admin SDK service account (base64 encoded)
- DATABASE_URL for PostgreSQL connection
- WEBHOOK_SECRET for n8n integrations
- JWT_AUDIENCE for token validation

## Docker & Deployment

- `Dockerfile` for Next.js application
- `docker-compose.yml` for local development with n8n
- `Caddyfile` for reverse proxy with automatic TLS
- Production deployment to VPS with automatic updates