# FAXAS PROPERTY - Construction Management Control Center
## COMPREHENSIVE ARCHITECTURE DOCUMENTATION & MASTER PLAN
**Last Updated**: August 28, 2025
**Version**: 2.0

**Project**: Miami Duplex Remodel Management System  
**Repository**: https://github.com/LuisFaxas/faxas-property  
**Local Path**: `C:\1) FAXAS\CODING PROJECTS\CONSTRUCTION_MANAGEMENT\FAXAS_PROPERTY\control-center`  
**Development URL**: http://localhost:3000 or 3001 (currently 3009)

---

# 📐 SYSTEM ARCHITECTURE - CURRENT STATE

## 🏗️ TECHNOLOGY STACK

### **Frontend**
- **Framework**: Next.js 15.5.0 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: 
  - Tailwind CSS 3.4.17
  - shadcn/ui components
  - Glass morphism design system
  - Dark theme only
- **State Management**: 
  - TanStack Query v5 (server state)
  - React Context (auth, projects)
  - React Hook Form + Zod (forms)
- **UI Libraries**:
  - Lucide React (icons)
  - React Big Calendar (schedule)
  - Recharts (analytics)
  - Framer Motion (animations)
  - Embla Carousel (mobile)

### **Backend**
- **Runtime**: Node.js with Next.js API Routes
- **Database**: PostgreSQL (Supabase hosted)
- **ORM**: Prisma 6.14.0
- **Authentication**: 
  - Firebase Auth (client)
  - Firebase Admin SDK (server)
- **Validation**: Zod schemas
- **File Storage**: Firebase Storage (configured, partial implementation)

### **Infrastructure**
- **Development**: localhost:3000/3001/3009
- **Database GUI**: Prisma Studio (port 5555)
- **Environment**: .env.local configuration

---

## 🗄️ DATABASE ARCHITECTURE

### **Active Models (In Production)**
1. **User** - Authentication and roles
2. **Project** - Central entity for all data
3. **Contact** - Vendors, contractors, team members
4. **Task** - Work items with dual assignment
5. **ScheduleEvent** - Calendar events
6. **BudgetItem** - Financial line items
7. **Procurement** - Purchase orders
8. **UserModuleAccess** - Granular permissions
9. **AuditLog** - Activity tracking

### **Extended Task Models (Active)**
- TaskDependency - Task relationships
- TaskAttachment - File attachments
- TaskComment - Discussion threads
- TaskWatcher - Notification subscriptions
- TaskPhoto - Site photos
- TaskActivity - History log
- TaskChecklistItem - Subtasks

### **Unused Models (Schema exists, no implementation)**
- PlanFile - Document management
- Decision - Decision tracking
- Risk - Risk assessment
- Meeting - Meeting notes
- Invoice - Billing
- RFI, Submittal, ChangeOrder - Construction docs

### **Role System**
```typescript
enum Role {
  ADMIN      // Full system access
  STAFF      // Operational access
  CONTRACTOR // Limited project access
  VIEWER     // Read-only access
}
```

### **Module Permissions**
```typescript
enum Module {
  TASKS
  SCHEDULE
  PLANS
  UPLOADS
  INVOICES
  PROCUREMENT_READ
  DOCS_READ
}
```

---

## 🎯 FRONTEND ARCHITECTURE

### **Application Routes**

#### **Public Routes**
- `/` - Landing page
- `/login` - Authentication
- `/accept-invite` - Contractor invitation acceptance

#### **Admin Portal Routes** (`/admin/*`)
| Route | Status | API Integration | Description |
|-------|--------|-----------------|-------------|
| `/admin` | ✅ Production | Full | Dashboard with KPIs |
| `/admin/tasks` | ✅ Production | Full | Task management with mobile UI |
| `/admin/schedule` | ✅ Production | Full | Calendar with drag-drop |
| `/admin/budget` | ✅ Production | Full | Budget line items |
| `/admin/procurement` | ✅ Production | Full | Purchase orders with export |
| `/admin/contacts` | ✅ Production | Full | Contact & portal management |
| `/admin/settings` | ✅ Production | Full | Project configuration |
| `/admin/plans` | ⚠️ UI Only | None | Document management (no API) |
| `/admin/risks` | ⚠️ UI Only | None | Risk assessment (no API) |
| `/admin/users` | ⚠️ UI Only | Mock Data | User management (no API) |
| `/admin/decisions` | ⚠️ UI Only | None | Decision log (not in nav) |

#### **Contractor Portal Routes** (`/contractor/*`)
- `/contractor` - Single page dashboard (minimal implementation)

### **Component Architecture**

#### **UI Component Library** (`components/ui/`)
- **Base Components**: 40+ shadcn/ui components
- **Mobile Components** (`components/ui/mobile/`):
  - MobileDialog - Unified bottom sheet/modal
  - MobileCard - Touch-optimized cards
  - MobileList - Swipeable lists
  - DetailSheet - Mobile detail views

#### **Feature Components**
- `components/blocks/` - Layout components
  - PageShell - Page wrapper
  - Navigation - App navigation
- `components/contacts/` - Contact management
- `components/schedule/` - Calendar components
- `components/tasks/` - Task components

#### **Providers & Context**
- AuthContext - User authentication state
- ProjectContext - Active project state
- QueryClient - React Query provider

### **Responsive Design System**
- **Breakpoints**: Mobile-first approach
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- **Mobile Optimizations**:
  - Bottom sheets for dialogs
  - Touch targets min 48px
  - Swipe gestures
  - Responsive skeletons

---

## 🔌 BACKEND ARCHITECTURE

### **API Routes Structure** (`/api/v1/*`)

#### **Implemented Endpoints**

**Tasks** ✅
- GET/POST `/api/v1/tasks`
- PUT/DELETE `/api/v1/tasks/[id]`
- PATCH `/api/v1/tasks/[id]/status`
- DELETE `/api/v1/tasks/bulk-delete`

**Schedule** ✅
- GET/POST `/api/v1/schedule`
- PUT/DELETE `/api/v1/schedule/[id]`
- PUT `/api/v1/schedule/[id]/approve`
- GET `/api/v1/schedule/today`

**Budget** ✅
- GET/POST `/api/v1/budget`
- PUT/DELETE `/api/v1/budget/[id]`
- GET `/api/v1/budget/summary`
- GET `/api/v1/budget/exceptions`

**Procurement** ✅
- GET/POST `/api/v1/procurement`
- PUT/DELETE `/api/v1/procurement/[id]`
- PUT `/api/v1/procurement/[id]/approve`
- POST `/api/v1/procurement/bulk`
- GET `/api/v1/procurement/export`
- GET `/api/v1/procurement/analytics`

**Contacts** ✅
- GET/POST `/api/v1/contacts`
- PUT/DELETE `/api/v1/contacts/[id]`
- POST `/api/v1/contacts/[id]/invite`
- POST `/api/v1/contacts/accept-invite`

**Projects** ✅
- GET/POST `/api/v1/projects`
- PUT/DELETE `/api/v1/projects/[id]`
- PUT `/api/v1/projects/[id]/archive`
- PUT `/api/v1/projects/[id]/favorite`

#### **Missing APIs** (UI exists, no backend)
- `/api/v1/users` - User management
- `/api/v1/plans` - Document management
- `/api/v1/risks` - Risk assessment
- `/api/v1/decisions` - Decision tracking

### **Authentication & Authorization**
```typescript
// Server-side auth check
requireAuth() // Basic authentication
requireRole(['ADMIN', 'STAFF']) // Role-based access

// Client-side auth
useAuth() // Hook for user state
```

### **Response Format**
```typescript
// Success
{
  success: true,
  data: {...},
  message?: string,
  meta?: { pagination, total }
}

// Error
{
  success: false,
  error: string,
  code?: string
}
```

---

## 🔐 AUTHENTICATION FLOW

1. **Client Authentication**:
   - Firebase Auth (Google OAuth + Email/Password)
   - JWT tokens with 1-hour expiry
   - Auto-refresh every 50 minutes

2. **Server Verification**:
   - Firebase Admin SDK validates tokens
   - User lookup in PostgreSQL
   - Role verification

3. **Portal Invitation Flow**:
   - Admin creates Contact
   - Sends invitation email with token
   - Contact accepts at `/accept-invite`
   - Creates User account linked to Contact
   - Assigns CONTRACTOR role

---

# ✅ COMPLETED FEATURES

## **Production-Ready Systems**

### **1. Task Management System**
- Full CRUD operations
- Dual assignment (Users OR Contacts)
- Priority levels (LOW to CRITICAL)
- Status workflow (TODO → IN_PROGRESS → COMPLETED)
- Subtasks and checklists
- File attachments
- Comments and activity log
- Mobile-optimized UI with unified dialogs
- Responsive skeleton loading

### **2. Schedule Management**
- React Big Calendar integration
- Multiple views (month, week, day, agenda)
- Drag-and-drop event management
- Event types (CALL, MEETING, SITE_VISIT, WORK)
- Approval workflow
- Mobile-responsive calendar
- Event color coding by status

### **3. Budget Management**
- Line item CRUD
- Variance tracking
- Commitment tracking
- Discipline categorization
- KPI dashboard
- Real-time calculations

### **4. Procurement System**
- Full PO lifecycle
- Bulk operations
- Approval workflow
- Export (CSV, Excel, PDF)
- Analytics dashboard
- Supplier management

### **5. Contact & Portal System**
- Contact CRUD with categories
- Portal invitation system
- Token-based registration
- Task assignment to contacts
- Portal status tracking
- Mobile-optimized cards

### **6. Project Management**
- Multi-project support
- Archive/Favorite functionality
- Project-specific settings
- Color coding
- Global project context

### **7. Mobile UI/UX System**
- Unified MobileDialog component
- Bottom sheet pattern
- Touch-optimized interfaces
- Responsive skeletons
- Swipe gestures
- Mobile-first layouts

---

# 🚧 ONGOING DEVELOPMENT

## **Next Implementation Phases**

### **Phase 1: User Management & RBAC System**

#### **Database Enhancements**
```prisma
// Add to Contact model
tradeType        String?   // PLUMBER, ELECTRICIAN, etc
licenseNumber    String?
insuranceExpiry  DateTime?
rating           Float?
preferredVendor  Boolean

// New models needed
model BidRequest {
  id          String
  projectId   String
  tradeType   String
  scope       String
  deadline    DateTime
  status      String
}

model BidResponse {
  id           String
  bidRequestId String
  contactId    String
  amount       Decimal
  status       String
}
```

#### **API Implementation**
- Create `/api/v1/users` endpoints
- Implement role templates
- Build permission matrix
- Add team management

#### **UI Components**
- User management dashboard
- Permission matrix interface
- Role assignment workflow
- Team builder

### **Phase 2: Revolutionary Bid Management System**

#### **Core Features**
1. **Bid Request Creation**
   - Select trade type
   - Define scope
   - Attach documents
   - Set deadline

2. **Contractor Bid Submission**
   - View requests by trade
   - Submit detailed bids
   - Track bid status
   - Receive notifications

3. **Bid Comparison & Approval**
   - Side-by-side comparison
   - Automatic budget integration
   - Approval workflow
   - Historical tracking

#### **Implementation**
- Extend Budget page with bid section
- Create contractor "My Bids" view
- Notification system
- Email integration

### **Phase 3: Complete Missing APIs**

#### **Plans API**
- Firebase Storage integration
- Version control
- Document categorization
- Sharing permissions

#### **Risks API**
- Risk scoring algorithm
- Impact assessment
- Mitigation tracking
- Risk matrix visualization

#### **Users API**
- Replace mock data
- Firebase Admin integration
- Module permissions
- Activity tracking

### **Phase 4: Advanced Features**

#### **Contractor Portal Enhancement**
- Dedicated contractor dashboard
- Task calendar view
- Document access
- Invoice submission
- Progress reporting

#### **Workflow Automation**
- Automated approvals
- Email notifications
- Task dependencies
- Scheduled reports

#### **Analytics & Reporting**
- Project dashboards
- Performance metrics
- Cost analysis
- Timeline tracking

---

# 🎯 STRATEGIC ROADMAP

## **Immediate Priorities**

### **1. Activate Existing Infrastructure**
- Enable UserModuleAccess permissions
- Implement role-based UI filtering
- Create permission templates
- Add role selection to invitation flow

### **2. Build Bid Management MVP**
- Add trade types to Contacts
- Create bid request/response tables
- Build submission interface
- Implement comparison view

### **3. Complete Core APIs**
- Users API with real data
- Plans API with storage
- Risks API with scoring
- Decisions API or remove

## **Medium-Term Goals**

### **1. Enterprise Features**
- Multi-tenant architecture
- Subscription management
- Usage tracking
- API rate limiting

### **2. Integration Capabilities**
- Email integration
- Calendar sync
- Accounting software
- Document signing

### **3. Mobile Application**
- React Native app
- Offline support
- Push notifications
- Camera integration

## **Long-Term Vision**

### **1. AI/ML Features**
- Predictive scheduling
- Cost estimation
- Risk prediction
- Automated task assignment

### **2. Marketplace**
- Contractor discovery
- Material sourcing
- Equipment rental
- Insurance providers

### **3. Compliance & Standards**
- SOC 2 certification
- Industry standards
- Regulatory compliance
- Data privacy

---

# 📊 TECHNICAL DEBT & IMPROVEMENTS

## **Code Quality**
- Add unit tests
- Implement E2E testing
- Error boundary implementation
- Performance optimization

## **Infrastructure**
- Production deployment setup
- CI/CD pipeline
- Monitoring & logging
- Backup strategy

## **Security**
- Two-factor authentication
- API rate limiting
- Data encryption
- Security audit

## **Documentation**
- API documentation
- User guides
- Developer docs
- Video tutorials

---

# 🚀 DEPLOYMENT READINESS

## **Current State**
- **Admin Portal**: 85% complete, production-ready
- **Contractor Portal**: 5% complete, minimal MVP
- **Mobile Experience**: 100% responsive, optimized
- **API Coverage**: 60% of planned endpoints

## **Required for Production**
1. Complete Users API
2. Implement basic contractor portal
3. Set up production database
4. Configure production environment
5. Implement monitoring

## **Scaling Considerations**
- Database indexing optimized
- API pagination implemented
- Caching strategy needed
- CDN for static assets
- Load balancing setup

---

# 🛠️ CRITICAL COMMANDS

### Development
```bash
npm run dev                  # Start dev server (port 3000)
npm run build               # Production build
npm run lint                # Run ESLint
```

### Database
```bash
npx prisma generate         # After schema changes
npx prisma db push         # Push changes (dev)
npx prisma migrate dev     # Create migration
npx prisma studio          # Visual DB browser (port 5555)
```

### Testing Current Features
```bash
# Test endpoints
curl http://localhost:3000/api/v1/tasks
curl http://localhost:3000/api/v1/contacts
curl http://localhost:3000/api/v1/schedule
```

---

# 📝 NOTES

- Admin credentials: `admin@example.com / admin123`
- Development runs on port 3000 (sometimes 3001 or 3009)
- Firebase Storage configured but not fully integrated
- Portal invitation system works end-to-end
- Contact-Task dual assignment implemented
- UserModuleAccess table exists but not utilized

---

**This document represents the single source of truth for the FAXAS Property Control Center architecture and development roadmap.**

**END OF MASTER PLAN - Version 2.0 - August 28, 2025**