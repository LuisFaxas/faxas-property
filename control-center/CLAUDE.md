# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a construction management system for the Miami Duplex Remodel project built with Next.js 15 App Router, TypeScript, Prisma ORM, Firebase Auth, and PostgreSQL. The system features dual dashboards for Admin/Staff and Contractors with role-based access control.

## Critical Commands

### Development
```bash
npm run dev                  # Start dev server (port 3000)
npm run build               # Production build
npm run lint                # Run ESLint checks
```

### Database Operations
```bash
npx prisma generate         # Generate Prisma client after schema changes
npx prisma db push          # Push schema changes without migrations (development)
npx prisma migrate dev      # Create and apply migrations (development)
npx prisma migrate deploy   # Apply migrations (production)
npx prisma studio           # Open Prisma Studio GUI at port 5555
npm run db:seed            # Seed database with initial data
```

### Testing & Debugging
```bash
npm run db:studio          # Visual database browser
npx prisma db pull         # Test database connection
```

### Admin Operations
```bash
npm run create-admin       # Create admin user (requires ts-node)
```

## High-Level Architecture

### Route Structure
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
- API routes verify auth via `requireAuth()` helper in `lib/api/auth-check.ts`
- Role verification happens at both client and server levels

### Data Architecture
- **PostgreSQL Database** via Prisma ORM
- **Key Models**: User, Project, Task, Contact, Schedule, BudgetItem, ProcurementItem
- **Relationships**: 
  - Tasks can be assigned to Users OR Contacts (dual assignment system)
  - Contacts can have portal access (linked to User model)
  - Projects contain all other entities (tasks, schedules, budgets, etc.)

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
- **Custom Hooks**: `hooks/use-api.ts` contains reusable API hooks
- **Optimistic Updates**: Enabled for better UX in forms

### Styling System
- Tailwind CSS with custom graphite theme colors
- Glass morphism design with backdrop filters
- Dark mode only (no light theme)
- Responsive breakpoints: mobile-first approach
- Custom CSS utilities in `app/globals.css`

## Key Files to Understand

1. **`prisma/schema.prisma`** - Complete database schema
2. **`app/contexts/AuthContext.tsx`** - Global auth state management  
3. **`lib/api/auth-check.ts`** - Server-side auth verification
4. **`lib/firebase.ts`** & **`lib/firebase-admin.ts`** - Firebase configuration
5. **`hooks/use-api.ts`** - Reusable API hooks for data fetching
6. **`app/admin/layout.tsx`** - Admin dashboard layout wrapper
7. **`.env.local`** - Environment variables (Firebase keys, DATABASE_URL)

## Mobile-First Considerations

When implementing features, prioritize mobile experience:
- Minimum 48px touch targets
- Bottom sheets for mobile modals
- Card views default on mobile, table views on desktop
- Responsive grid layouts (1 col mobile → 4 cols desktop)
- Touch-friendly form inputs with proper height

## Common Patterns

### API Route Pattern
```typescript
// Standard structure for API routes
export async function GET/POST/PUT/DELETE(request: NextRequest) {
  try {
    const authUser = await requireAuth(); // or requireRole(['ADMIN'])
    // Validate request
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
const { data, isLoading, error, refetch } = useContacts({ projectId });
```

### Form Handling
```typescript
// Use react-hook-form with Zod validation
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: {...}
});
```

## Important Notes

- Always run `npx prisma generate` after modifying `schema.prisma`
- The system expects `projectId` in most API calls - get from `useProjects()` hook
- Contact assignment system: Tasks can be assigned to `assignedToId` (User) OR `assignedContactId` (Contact)
- Portal invitation flow: Contacts → Send Invite → Accept at `/accept-invite` → Creates User account
- File uploads use Firebase Storage with signed URLs for security
- Webhook endpoints require `x-webhook-secret` header matching env variable