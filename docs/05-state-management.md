# State Management Documentation

[← Back to Main](../SOURCE_OF_TRUTH.md)

## Overview

The application uses a hybrid state management approach:
- **Server State**: TanStack Query (React Query)
- **Global State**: React Context API
- **Local State**: React hooks
- **Form State**: React Hook Form

## TanStack Query Configuration

### Query Client Setup
**File**: `app/providers.tsx`

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 10 * 60 * 1000,        // 10 minutes (formerly cacheTime)
      retry: 3,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always'
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error)
      }
    }
  }
})
```

## Query Keys Registry

### Naming Convention
```typescript
// Pattern: [resource, filters/id]
['projects']                    // All projects
['project', projectId]          // Single project
['tasks', { projectId }]        // Filtered tasks
['task', taskId]               // Single task
```

### Complete Registry

| Key | Purpose | Used In |
|-----|---------|---------|
| `['projects']` | User's projects | `hooks/use-api.ts:8` |
| `['project', id]` | Single project | Project details |
| `['tasks', query]` | Task list | `hooks/use-api.ts:17` |
| `['task', id]` | Single task | `hooks/use-api.ts:25` |
| `['contacts', { projectId }]` | Project contacts | `hooks/use-api.ts:160` |
| `['contact', id]` | Single contact | Contact details |
| `['budget', { projectId }]` | Budget items | `hooks/use-api.ts:275` |
| `['budget-summary', { projectId }]` | Budget summary | Budget dashboard |
| `['procurement', query]` | Procurement items | `hooks/use-api.ts:320` |
| `['procurement-summary']` | Procurement stats | Dashboard |
| `['schedule', { projectId }]` | Schedule events | `hooks/use-api.ts:380` |
| `['schedule-today']` | Today's events | Dashboard |
| `['rfps', { projectId }]` | Project RFPs | Bidding page |
| `['rfp', rfpId]` | Single RFP | RFP details |
| `['bids', { rfpId }]` | RFP bids | Bid comparison |
| `['bid', bidId]` | Single bid | Bid details |
| `['user-preferences']` | User settings | Settings page |
| `['users']` | All users | User management |
| `['weather', { lat, lng }]` | Weather data | Dashboard |

## Mutation → Invalidation Matrix

### Task Mutations

| Mutation | Hook | Invalidates | File |
|----------|------|-------------|------|
| Create Task | `useCreateTask()` | `['tasks']`, `['tasks', { projectId }]` | `hooks/use-api.ts:31` |
| Update Task | `useUpdateTask()` | `['tasks']`, `['task', id]` | `hooks/use-api.ts:60` |
| Update Status | `useUpdateTaskStatus()` | `['tasks']`, `['task']` | `hooks/use-api.ts:89` |
| Delete Task | `useDeleteTask()` | `['tasks']` | `hooks/use-api.ts:110` |
| Bulk Delete | `useBulkDeleteTasks()` | `['tasks']` | `hooks/use-api.ts:125` |

### Contact Mutations

| Mutation | Hook | Invalidates | File |
|----------|------|-------------|------|
| Create Contact | `useCreateContact()` | `['contacts']` | `hooks/use-api.ts:165` |
| Update Contact | `useUpdateContact()` | `['contacts']`, `['contact', id]` | `hooks/use-api.ts:180` |
| Delete Contact | `useDeleteContact()` | `['contacts']` | `hooks/use-api.ts:195` |
| Send Invite | `useSendInvite()` | `['contact', id]` | `hooks/use-api.ts:210` |

### Budget Mutations

| Mutation | Hook | Invalidates | File |
|----------|------|-------------|------|
| Create Budget | `useCreateBudget()` | `['budget']`, `['budget-summary']` | `hooks/use-api.ts:280` |
| Update Budget | `useUpdateBudget()` | `['budget']`, `['budget-summary']` | `hooks/use-api.ts:295` |
| Delete Budget | `useDeleteBudget()` | `['budget']`, `['budget-summary']` | `hooks/use-api.ts:310` |

## Context Providers

### AuthContext
**File**: `app/contexts/AuthContext.tsx`
**State Structure**:

```typescript
{
  user: User | null,
  loading: boolean,
  error: string | null,
  userRole: Role | null,
  userModules: Module[] | null
}
```

**Key Methods**:
- `signInWithEmail(email, password)`
- `signInWithGoogle()`
- `logout()`
- `resetPassword(email)`

### PreferencesContext
**File**: `app/contexts/PreferencesContext.tsx`
**State Structure**:

```typescript
{
  preferences: {
    mobileNavItems: string[],
    theme: 'dark' | 'light' | 'auto',
    density: 'compact' | 'comfortable' | 'spacious',
    showCompleted: boolean,
    defaultView: 'card' | 'list' | 'table',
    // ... 50+ preference fields
  },
  loading: boolean
}
```

### ProjectContext
**File**: `app/contexts/ProjectContext.tsx`
**State Structure**:

```typescript
{
  currentProject: Project | null,
  projects: Project[],
  loading: boolean
}
```

## Custom Hooks

### Data Fetching Hooks

```typescript
// Fetch with automatic projectId injection
const { data: tasks, isLoading } = useTasks({
  projectId: currentProject?.id,
  status: 'IN_PROGRESS'
})

// Single resource fetch
const { data: task } = useTask(taskId)

// With pagination
const { data, hasNextPage, fetchNextPage } = useInfiniteTasks({
  projectId,
  limit: 20
})
```

### Mutation Hooks

```typescript
// Create with optimistic update
const createTask = useCreateTask({
  onMutate: async (newTask) => {
    // Cancel queries
    await queryClient.cancelQueries(['tasks'])

    // Snapshot previous value
    const previous = queryClient.getQueryData(['tasks'])

    // Optimistically update
    queryClient.setQueryData(['tasks'], old => [...old, newTask])

    return { previous }
  },
  onError: (err, newTask, context) => {
    // Rollback
    queryClient.setQueryData(['tasks'], context.previous)
  },
  onSettled: () => {
    // Refetch
    queryClient.invalidateQueries(['tasks'])
  }
})
```

## Optimistic Updates

### Pattern
```typescript
const mutation = useMutation({
  mutationFn: updateTask,
  onMutate: async (updated) => {
    // 1. Cancel in-flight queries
    await queryClient.cancelQueries(['tasks', updated.id])

    // 2. Snapshot current state
    const previous = queryClient.getQueryData(['tasks', updated.id])

    // 3. Optimistically update
    queryClient.setQueryData(['tasks', updated.id], updated)

    // 4. Return rollback context
    return { previous }
  },
  onError: (err, updated, context) => {
    // Rollback on error
    queryClient.setQueryData(['tasks', updated.id], context.previous)
  },
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries(['tasks'])
  }
})
```

## Form State Management

### React Hook Form Integration
**File**: Various form components

```typescript
const form = useForm<TaskFormData>({
  resolver: zodResolver(taskSchema),
  defaultValues: {
    title: '',
    status: 'TODO',
    priority: 'MEDIUM'
  },
  mode: 'onChange' // Validation mode
})

// Field registration
<Controller
  name="assignedToId"
  control={form.control}
  render={({ field }) => (
    <Select {...field}>
      {/* Options */}
    </Select>
  )}
/>
```

## State Persistence

### Query Cache Persistence
```typescript
// Persist to localStorage (optional)
const persistor = persistQueryClient({
  queryClient,
  persister: createSyncStoragePersister({
    storage: window.localStorage,
  }),
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
})
```

### User Preferences
- **Storage**: Database via API
- **Cache**: React Query with 30-min stale time
- **Sync**: Automatic on change

## Performance Optimizations

### Query Deduplication
Multiple components requesting same data share single query:
```typescript
// Both components share same query
const ComponentA = () => {
  const { data } = useTasks({ projectId }) // First request
}

const ComponentB = () => {
  const { data } = useTasks({ projectId }) // Uses cached
}
```

### Selective Invalidation
```typescript
// Only invalidate specific project tasks
queryClient.invalidateQueries({
  queryKey: ['tasks', { projectId: 'specific-id' }]
})
```

### Background Refetching
```typescript
// Refetch stale data in background
const { data, isStale, isRefetching } = useQuery({
  queryKey: ['tasks'],
  staleTime: 5 * 60 * 1000,
  refetchInterval: 10 * 60 * 1000 // Background refetch
})
```

---

[Next: Operations →](06-operations.md) | [Back to Main →](../SOURCE_OF_TRUTH.md)