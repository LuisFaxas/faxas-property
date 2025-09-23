# API Documentation - Faxas Property Construction Management

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Standard Response Format](#standard-response-format)
4. [Core API Routes](#core-api-routes)
5. [Authentication Endpoints](#authentication-endpoints)
6. [Webhook Endpoints](#webhook-endpoints)
7. [Utility Endpoints](#utility-endpoints)
8. [Legacy/Non-v1 Endpoints](#legacynon-v1-endpoints)
9. [Error Codes](#error-codes)
10. [Request/Response Examples](#requestresponse-examples)

## Overview

The Faxas Property Construction Management API is built on Next.js 15 App Router with TypeScript. All primary endpoints are versioned under `/api/v1/` and follow RESTful conventions. The API uses Firebase Authentication with custom claims for role-based access control.

### Base URL
- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

### Authentication
All API endpoints (except public ones) require Firebase authentication tokens via the `Authorization: Bearer <token>` header.

## Authentication

### Authentication Middleware Flow

The API uses a sophisticated authentication system implemented in `lib/api/auth-check.ts`:

1. **Token Extraction**: Bearer token extracted from `Authorization` header
2. **Firebase Validation**: Token validated against Firebase Admin SDK
3. **Database Lookup**: User record retrieved from PostgreSQL
4. **Auto-Initialization**: New users automatically created if Firebase user exists
5. **Role Assignment**: Custom claims from Firebase determine user roles
6. **Session Management**: Optional session tracking via `x-session-id` header

### Authentication Functions

- `requireAuth()`: Validates token and returns authenticated user
- `requireRole(['ADMIN', 'STAFF'])`: Enforces specific roles
- `optionalAuth()`: Returns user if authenticated, null otherwise
- `assertProjectMember()`: Verifies user is project member
- `requireModuleAccess()`: Checks module-specific permissions

### Roles
- `ADMIN`: Full system access
- `STAFF`: Most operations except system administration
- `CONTRACTOR`: Limited access based on module permissions
- `VIEWER`: Read-only access

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message",
  "metadata": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "OPTIONAL_ERROR_CODE",
  "correlationId": "uuid-for-tracking"
}
```

## Core API Routes

### Projects (`/api/v1/projects`)

**File**: `app/api/v1/projects/route.ts`

#### GET /api/v1/projects
List all projects user has access to.

- **Authentication**: `requireAuth()`
- **Validation**: Query parameters via URL search params
- **Query Parameters**:
  - `includeArchived`: boolean - Include archived projects
  - `favoritesOnly`: boolean - Only favorite projects

```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.example.com/api/v1/projects?includeArchived=false"
```

#### POST /api/v1/projects
Create a new project.

- **Authentication**: `requireRole(['ADMIN', 'STAFF'])`
- **Validation**: `createProjectSchema` (inline validation)
- **Body**:
```json
{
  "name": "Miami Duplex Remodel",
  "description": "Complete renovation project",
  "projectType": "RENOVATION",
  "status": "PLANNING",
  "startDate": "2024-01-01T00:00:00Z",
  "targetEndDate": "2024-12-31T00:00:00Z",
  "address": "123 Main St, Miami, FL",
  "totalBudget": 500000,
  "clientName": "John Doe",
  "clientEmail": "john@example.com",
  "timezone": "America/New_York"
}
```

#### Additional Project Endpoints:
- `PUT /api/v1/projects/[id]` - Update project (file: `app/api/v1/projects/[id]/route.ts`)
- `DELETE /api/v1/projects/[id]` - Delete project
- `POST /api/v1/projects/[id]/archive` - Archive project
- `POST /api/v1/projects/[id]/favorite` - Toggle favorite status

### Tasks (`/api/v1/tasks`)

**File**: `app/api/v1/tasks/route.ts`

#### GET /api/v1/tasks
List tasks with advanced filtering.

- **Authentication**: `withAuth` + Module access `TASKS:view`
- **Validation**: `taskQuerySchema` from `lib/validations/task.ts`
- **Required Header**: `x-project-id`

**Query Parameters**:
```typescript
{
  page?: number,           // Default: 1
  limit?: number,          // Default: 20
  status?: TaskStatus,     // TODO, IN_PROGRESS, etc.
  priority?: TaskPriority, // LOW, MEDIUM, HIGH, etc.
  assignedToId?: string,
  search?: string,
  dueDateFrom?: string,    // ISO datetime
  dueDateTo?: string,
  isOnCriticalPath?: boolean,
  isMilestone?: boolean,
  trade?: string,
  location?: string,
  tags?: string,           // Comma-separated
  sortBy?: string,         // dueDate, priority, status, etc.
  sortOrder?: 'asc' | 'desc'
}
```

#### POST /api/v1/tasks
Create a new task.

- **Authentication**: `withAuth` + Module access `TASKS:edit` + Roles `['ADMIN', 'STAFF']`
- **Validation**: `createTaskSchema` from `lib/validations/task.ts`
- **Body**:
```json
{
  "title": "Install kitchen cabinets",
  "description": "Install all upper and lower cabinets",
  "status": "TODO",
  "priority": "HIGH",
  "dueDate": "2024-02-15T09:00:00Z",
  "assignedToId": "user-id",
  "projectId": "project-id",
  "trade": "Carpentry",
  "location": "Kitchen",
  "estimatedHours": 8,
  "isOnCriticalPath": true,
  "requiresInspection": true
}
```

#### PATCH /api/v1/tasks (Bulk Update)
Update multiple tasks.

- **Authentication**: Same as POST
- **Validation**: `bulkUpdateTasksSchema`

#### Additional Task Endpoints:
- `GET /api/v1/tasks/[id]` - Get single task
- `PUT /api/v1/tasks/[id]` - Update task  
- `DELETE /api/v1/tasks/[id]` - Delete task
- `PATCH /api/v1/tasks/[id]/status` - Update task status
- `DELETE /api/v1/tasks/bulk-delete` - Bulk delete tasks

### Contacts (`/api/v1/contacts`)

**File**: `app/api/v1/contacts/route.ts`

#### GET /api/v1/contacts
List contacts with filtering.

- **Authentication**: `withAuth` + Module access `CONTACTS:view`
- **Validation**: `contactQuerySchema` from `lib/validations/contact.ts`
- **Required Header**: `x-project-id`

**Query Parameters**:
```typescript
{
  page?: number,
  limit?: number,
  category?: ContactCategory,  // SUBCONTRACTOR, SUPPLIER, etc.
  type?: ContactType,         // INDIVIDUAL, COMPANY
  status?: ContactStatus,     // ACTIVE, INACTIVE, etc.
  search?: string
}
```

#### POST /api/v1/contacts
Create a new contact.

- **Authentication**: `withAuth` + Module access `CONTACTS:edit` + Roles `['ADMIN', 'STAFF']`
- **Validation**: `createContactSchema` from `lib/validations/contact.ts`

```json
{
  "name": "ABC Plumbing",
  "email": "contact@abcplumbing.com",
  "phone": "+1-305-555-0123",
  "company": "ABC Plumbing Inc",
  "category": "SUBCONTRACTOR",
  "type": "COMPANY",
  "status": "ACTIVE",
  "notes": "Licensed plumber, good rates"
}
```

#### Additional Contact Endpoints:
- `GET /api/v1/contacts/[id]` - Get single contact
- `PUT /api/v1/contacts/[id]` - Update contact
- `DELETE /api/v1/contacts/[id]` - Delete contact
- `POST /api/v1/contacts/[id]/invite` - Send portal invitation
- `POST /api/v1/contacts/accept-invite` - Accept invitation (public endpoint)

### Budget (`/api/v1/budget`)

**File**: `app/api/v1/budget/route.ts`

#### GET /api/v1/budget
List budget items with cost redaction for contractors.

- **Authentication**: `withAuth` + Module access `BUDGET:view`
- **Validation**: `budgetQuerySchema` from `lib/validations/budget.ts`
- **Cost Redaction**: Automatically applied for CONTRACTOR role

**Query Parameters**:
```typescript
{
  page?: number,
  limit?: number,
  discipline?: string,     // Electrical, Plumbing, etc.
  category?: string,       // Labor, Materials, etc.
  status?: BudgetStatus,   // BUDGETED, COMMITTED, PAID
  overBudgetOnly?: boolean
}
```

#### POST /api/v1/budget
Create budget item.

- **Authentication**: `withAuth` + Module access `BUDGET:edit` + Roles `['ADMIN', 'STAFF']`
- **Validation**: `createBudgetItemSchema` from `lib/validations/budget.ts`

```json
{
  "discipline": "Electrical",
  "category": "Labor",
  "item": "Main panel installation",
  "unit": "ea",
  "qty": 1,
  "estUnitCost": 2500.00,
  "estTotal": 2500.00,
  "committedTotal": 0,
  "paidToDate": 0,
  "vendorContactId": "contact-id",
  "status": "BUDGETED"
}
```

#### Additional Budget Endpoints:
- `GET /api/v1/budget/[id]` - Get budget item
- `PUT /api/v1/budget/[id]` - Update budget item
- `DELETE /api/v1/budget/[id]` - Delete budget item
- `GET /api/v1/budget/summary` - Budget summary with totals
- `GET /api/v1/budget/exceptions` - Over-budget items

### Procurement (`/api/v1/procurement`)

**File**: `app/api/v1/procurement/route.ts`

Similar structure to budget with additional endpoints for procurement management:

- `GET /api/v1/procurement` - List procurement items
- `POST /api/v1/procurement` - Create procurement item
- `GET /api/v1/procurement/analytics` - Procurement analytics
- `POST /api/v1/procurement/bulk` - Bulk operations
- `GET /api/v1/procurement/export` - Export data
- `POST /api/v1/procurement/[id]/approve` - Approve procurement

### Schedule (`/api/v1/schedule`)

**File**: `app/api/v1/schedule/route.ts`

- `GET /api/v1/schedule` - List schedule events
- `POST /api/v1/schedule` - Create schedule event
- `GET /api/v1/schedule/today` - Today's events
- `POST /api/v1/schedule/[id]/approve` - Approve schedule item

### RFPs (`/api/v1/rfps`)

**File**: `app/api/v1/rfps/[rfpId]/route.ts`

- `GET /api/v1/rfps/[rfpId]/tabulation` - RFP bid tabulation

### Bids (`/api/v1/bids`)

**File**: `app/api/v1/bids/route.ts`

- `GET /api/v1/bids` - List bids
- `POST /api/v1/bids` - Create bid
- `GET /api/v1/bids/[bidId]` - Get bid details
- `POST /api/v1/bids/[bidId]/submit` - Submit bid

### Awards (`/api/v1/awards`)

**File**: `app/api/v1/awards/route.ts`

- `GET /api/v1/awards` - List contract awards
- `POST /api/v1/awards` - Create award

### Users (`/api/v1/users`)

**File**: `app/api/v1/users/route.ts`

- `GET /api/v1/users` - List users
- `GET /api/v1/users/[id]` - Get user details
- `PUT /api/v1/users/[id]` - Update user
- `GET /api/v1/users/preferences` - User preferences
- `PUT /api/v1/users/preferences` - Update preferences
- `PUT /api/v1/users/preferences/navigation` - Navigation preferences
- `PUT /api/v1/users/[id]/permissions` - Update user permissions

### Vendors (`/api/v1/vendors`)

**File**: `app/api/v1/vendors/route.ts`

- `GET /api/v1/vendors` - List vendors
- `POST /api/v1/vendors` - Create vendor
- `GET /api/v1/vendors/[vendorId]` - Get vendor
- `GET /api/v1/vendors/[vendorId]/users` - Vendor users
- `POST /api/v1/vendors/[vendorId]/users` - Add vendor user

### Weather (`/api/v1/weather`)

**File**: `app/api/v1/weather/route.ts`

- `GET /api/v1/weather` - Get weather data for project location

## Authentication Endpoints

### Initialize User (`/api/v1/auth/initialize`)

**File**: `app/api/v1/auth/initialize/route.ts`

Creates user account after Firebase authentication.

- **Authentication**: `requireAuth()`
- **Method**: POST

```json
{
  "email": "user@example.com",
  "role": "CONTRACTOR"
}
```

## Webhook Endpoints

Webhooks require the `x-webhook-secret` header matching `process.env.WEBHOOK_SECRET`.

### Calendar Event Webhook (`/api/webhooks/calendar-event`)

**File**: `app/api/webhooks/calendar-event/route.ts`

Syncs Google Calendar events to schedule.

- **Authentication**: Webhook secret
- **Method**: POST

```json
{
  "googleEventId": "event-id",
  "start": "2024-01-15T09:00:00Z",
  "end": "2024-01-15T10:00:00Z",
  "title": "Site visit",
  "attendees": ["contractor@example.com"],
  "projectId": "project-id"
}
```

### Gmail Inbound Webhook (`/api/webhooks/gmail-inbound`)

**File**: `app/api/webhooks/gmail-inbound/route.ts`

Processes inbound Gmail messages for project communication.

## Utility Endpoints

### File Upload (`/api/signed-url`)

**File**: `app/api/signed-url/route.ts`

Generates signed URLs for Firebase Storage uploads.

- **Authentication**: `requireAuth()`
- **Method**: POST

```json
{
  "fileName": "document.pdf",
  "contentType": "application/pdf",
  "projectId": "project-id"
}
```

### Health Check (`/api/health`)

**File**: `app/api/health/route.ts`

System health status.

- **Authentication**: None
- **Method**: GET

## Legacy/Non-v1 Endpoints

### Admin Endpoints (`/api/admin`)

- `POST /api/admin/invite-contractor` - Invite contractor (file: `app/api/admin/invite-contractor/route.ts`)
- `POST /api/admin/set-claims` - Set Firebase custom claims (file: `app/api/admin/set-claims/route.ts`)

### Project-Specific RFPs (`/api/projects/[projectId]/rfps`)

**File**: `app/api/projects/[projectId]/rfps/route.ts`

Legacy project-scoped RFP endpoints:
- `GET /api/projects/[projectId]/rfps` - List RFPs
- `POST /api/projects/[projectId]/rfps` - Create RFP
- `GET /api/projects/[projectId]/rfps/[rfpId]` - Get RFP
- `POST /api/projects/[projectId]/rfps/[rfpId]/publish` - Publish RFP
- `GET /api/projects/[projectId]/rfps/[rfpId]/items` - RFP items
- `GET /api/projects/[projectId]/rfps/[rfpId]/attachments` - RFP attachments

## Error Codes

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict
- `429` - Rate Limited
- `500` - Internal Server Error

### Custom Error Codes
- `AUTH_REQUIRED` - Authentication required
- `INVALID_TOKEN` - Token is invalid or expired
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `PROJECT_ACCESS_DENIED` - Not a member of requested project
- `MODULE_ACCESS_DENIED` - No access to requested module
- `VALIDATION_ERROR` - Request validation failed
- `RATE_LIMITED` - Rate limit exceeded

## Request/Response Examples

### Create Task

**Request**:
```bash
curl -X POST "https://api.example.com/api/v1/tasks" \
  -H "Authorization: Bearer eyJ..." \
  -H "x-project-id: proj_123" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Install kitchen cabinets",
    "description": "Install all upper and lower kitchen cabinets per architectural drawings",
    "priority": "HIGH",
    "dueDate": "2024-02-15T09:00:00Z",
    "assignedToId": "user_456",
    "trade": "Carpentry",
    "location": "Kitchen",
    "estimatedHours": 8,
    "isOnCriticalPath": true,
    "requiresInspection": true,
    "tags": ["carpentry", "kitchen", "critical"]
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "task_789",
    "title": "Install kitchen cabinets",
    "description": "Install all upper and lower kitchen cabinets per architectural drawings",
    "status": "TODO",
    "priority": "HIGH",
    "dueDate": "2024-02-15T09:00:00.000Z",
    "assignedToId": "user_456",
    "projectId": "proj_123",
    "trade": "Carpentry",
    "location": "Kitchen",
    "estimatedHours": 8,
    "actualHours": null,
    "progressPercentage": 0,
    "isOnCriticalPath": true,
    "isMilestone": false,
    "requiresInspection": true,
    "inspectionStatus": null,
    "tags": ["carpentry", "kitchen", "critical"],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "assignedTo": {
      "id": "user_456",
      "email": "contractor@example.com",
      "role": "CONTRACTOR"
    }
  },
  "message": "Task created successfully"
}
```

### List Projects with Pagination

**Request**:
```bash
curl -H "Authorization: Bearer eyJ..." \
  "https://api.example.com/api/v1/projects?includeArchived=false&page=1&limit=10"
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "proj_123",
      "name": "Miami Duplex Remodel",
      "status": "ACTIVE",
      "projectType": "RENOVATION",
      "description": "Complete renovation of Miami duplex property",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "isArchived": false,
      "isFavorite": true,
      "_count": {
        "tasks": 45,
        "contacts": 12,
        "budgets": 23,
        "schedule": 8,
        "procurement": 15
      }
    }
  ],
  "metadata": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "hasMore": false
  }
}
```

### Authentication Error

**Request**:
```bash
curl -X GET "https://api.example.com/api/v1/tasks" \
  -H "Authorization: Bearer invalid_token"
```

**Response**:
```json
{
  "success": false,
  "error": "Token expired - please refresh your session",
  "correlationId": "req_abc123def456"
}
```

### Validation Error

**Request**:
```bash
curl -X POST "https://api.example.com/api/v1/tasks" \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"title": ""}'
```

**Response**:
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title must be at least 1 character"
    },
    {
      "field": "projectId", 
      "message": "Project ID is required"
    }
  ]
}
```

## Rate Limiting

Rate limiting is applied based on user roles:

- **ADMIN/STAFF**: 1000 requests/hour
- **CONTRACTOR**: 500 requests/hour  
- **VIEWER**: 100 requests/hour

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Requests allowed per window
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Window reset time

## Security Notes

1. **Token Validation**: All tokens validated against Firebase Admin SDK
2. **Project Isolation**: Repository pattern enforces project-level data isolation
3. **Role-Based Access**: Module permissions checked via Policy engine
4. **Cost Redaction**: Financial data automatically redacted for contractors
5. **Audit Logging**: All actions logged with user context
6. **Webhook Security**: Webhooks require shared secret verification
7. **File Upload Security**: Signed URLs prevent unauthorized uploads

## Testing

For testing, endpoints can accept the authorization header directly in the request object rather than relying on Next.js headers() function. This allows for proper unit testing of authentication flows.

Example test setup:
```typescript
const mockRequest = new NextRequest('http://localhost/api/v1/tasks', {
  headers: {
    'authorization': 'Bearer test_token',
    'x-project-id': 'test_project'
  }
});
```

This documentation reflects the current implementation as of the latest codebase analysis. For the most up-to-date validation schemas and endpoint details, refer to the source files referenced throughout this document.