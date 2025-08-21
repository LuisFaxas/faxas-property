import { z } from 'zod';

// Define enums locally since Prisma enums might not be available at build time
export const TaskStatus = z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE']);
export const TaskPriority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  priority: TaskPriority.default('MEDIUM'),
  status: TaskStatus.default('TODO'),
  assignedToId: z.string().optional(),
  projectId: z.string(),
  relatedContactIds: z.array(z.string()).optional()
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string()
});

export const updateTaskStatusSchema = z.object({
  status: TaskStatus
});

export const taskQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  status: TaskStatus.optional(),
  priority: TaskPriority.optional(),
  assignedToId: z.string().optional(),
  projectId: z.string().optional(),
  search: z.string().optional()
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;