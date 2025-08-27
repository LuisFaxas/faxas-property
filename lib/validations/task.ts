import { z } from 'zod';

// Define enums locally since Prisma enums might not be available at build time
export const TaskStatus = z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'COMPLETED', 'CANCELLED']);
export const TaskPriority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']);
export const DependencyType = z.enum(['FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH']);

export const createTaskSchema = z.object({
  // Basic fields
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: TaskStatus.default('TODO'),
  priority: TaskPriority.default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  
  // Assignment and project
  assignedToId: z.string().optional(),
  assignedContactId: z.string().optional(),
  projectId: z.string(),
  relatedContactIds: z.array(z.string()).optional(),
  
  // Progress tracking
  progressPercentage: z.number().min(0).max(100).default(0),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
  
  // Construction-specific
  isOnCriticalPath: z.boolean().default(false),
  isMilestone: z.boolean().default(false),
  location: z.string().optional(),
  trade: z.string().optional(),
  weatherDependent: z.boolean().default(false),
  requiresInspection: z.boolean().default(false),
  inspectionStatus: z.string().optional(),
  
  // Location data
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  locationName: z.string().optional(),
  
  // Metadata
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional(),
  
  // Mobile fields
  offlineCreated: z.boolean().default(false),
  localId: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  voiceNoteUrl: z.string().url().optional(),
  quickTemplate: z.string().optional(),
  mobileMetadata: z.record(z.unknown()).optional(),
  
  // Hierarchy
  parentTaskId: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string(),
  completedAt: z.string().datetime().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: TaskStatus,
  completedAt: z.string().datetime().optional(),
});

export const taskQuerySchema = z.object({
  // Pagination
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  
  // Filters
  status: TaskStatus.optional(),
  priority: TaskPriority.optional(),
  assignedToId: z.string().optional(),
  projectId: z.string().optional(),
  search: z.string().optional(),
  
  // Advanced filters
  isOnCriticalPath: z.string().optional().transform(val => val === 'true'),
  isMilestone: z.string().optional().transform(val => val === 'true'),
  weatherDependent: z.string().optional().transform(val => val === 'true'),
  requiresInspection: z.string().optional().transform(val => val === 'true'),
  trade: z.string().optional(),
  location: z.string().optional(),
  tags: z.string().optional().transform(val => val ? val.split(',') : undefined),
  
  // Date filters
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  startDateFrom: z.string().datetime().optional(),
  startDateTo: z.string().datetime().optional(),
  
  // Hierarchy filters
  parentTaskId: z.string().optional(),
  includeSubtasks: z.string().optional().transform(val => val === 'true'),
  
  // View mode
  view: z.enum(['list', 'kanban', 'calendar', 'timeline', 'table']).optional(),
  
  // Sorting
  sortBy: z.enum(['dueDate', 'priority', 'status', 'createdAt', 'title', 'progressPercentage']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Subtask schemas
export const createSubtaskSchema = z.object({
  parentTaskId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  assignedToId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  priority: TaskPriority.default('MEDIUM'),
});

// Dependency schemas
export const createDependencySchema = z.object({
  dependentTaskId: z.string(),
  predecessorTaskId: z.string(),
  type: DependencyType.default('FINISH_TO_START'),
  lagDays: z.number().int().default(0),
});

// Comment schemas
export const createCommentSchema = z.object({
  taskId: z.string(),
  content: z.string().min(1),
  mentions: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
});

// Attachment schemas
export const createAttachmentSchema = z.object({
  taskId: z.string(),
  fileName: z.string(),
  fileUrl: z.string().url(),
  fileSize: z.number().int().positive(),
  mimeType: z.string(),
});

// Checklist schemas
export const createChecklistItemSchema = z.object({
  taskId: z.string(),
  title: z.string().min(1).max(200),
  order: z.number().int().min(0),
});

export const updateChecklistItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200).optional(),
  isCompleted: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

// Bulk operation schemas
export const bulkUpdateTasksSchema = z.object({
  taskIds: z.array(z.string()).min(1),
  updates: z.object({
    status: TaskStatus.optional(),
    priority: TaskPriority.optional(),
    assignedToId: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    tags: z.array(z.string()).optional(),
    trade: z.string().optional(),
    location: z.string().optional(),
  }),
});

export const bulkDeleteTasksSchema = z.object({
  taskIds: z.array(z.string()).min(1, 'At least one task ID is required'),
});

// Export types
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type CreateDependencyInput = z.infer<typeof createDependencySchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
export type BulkUpdateTasksInput = z.infer<typeof bulkUpdateTasksSchema>;
export type BulkDeleteTasksInput = z.infer<typeof bulkDeleteTasksSchema>;