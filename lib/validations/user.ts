import { z } from 'zod';
import { Role, Module } from '@prisma/client';

// User creation schema
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'STAFF', 'CONTRACTOR', 'VIEWER'] as const),
  projectId: z.string().min(1, 'Project ID is required'),
  sendInvite: z.boolean().default(true),
  permissions: z.array(z.object({
    module: z.enum([
      'TASKS', 'SCHEDULE', 'BUDGET', 'PROCUREMENT', 'CONTACTS', 
      'PROJECTS', 'PROPOSALS', 'RFIS', 'SUBMITTALS', 'CHANGE_ORDERS',
      'SAFETY', 'WEATHER', 'PHOTOS', 'PLANS', 'UPLOADS'
    ] as const),
    canView: z.boolean().default(false),
    canEdit: z.boolean().default(false)
  })).optional()
});

// User update schema
export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['ADMIN', 'STAFF', 'CONTRACTOR', 'VIEWER'] as const).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'] as const).optional()
});

// User query schema for filtering/pagination
export const getUsersQuerySchema = z.object({
  projectId: z.string().optional(),
  role: z.enum(['ADMIN', 'STAFF', 'CONTRACTOR', 'VIEWER'] as const).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'] as const).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['createdAt', 'email', 'role', 'lastActive'] as const).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc'] as const).default('desc')
});

// Module permissions update schema
export const updatePermissionsSchema = z.object({
  permissions: z.array(z.object({
    module: z.enum([
      'TASKS', 'SCHEDULE', 'BUDGET', 'PROCUREMENT', 'CONTACTS', 
      'PROJECTS', 'PROPOSALS', 'RFIS', 'SUBMITTALS', 'CHANGE_ORDERS',
      'SAFETY', 'WEATHER', 'PHOTOS', 'PLANS', 'UPLOADS'
    ] as const),
    canView: z.boolean(),
    canEdit: z.boolean()
  }))
});

// User invitation schema
export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['CONTRACTOR', 'VIEWER'] as const),
  projectId: z.string().min(1, 'Project ID is required'),
  contactId: z.string().optional(),
  message: z.string().optional()
});

// Password reset schema
export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

// User activity query schema
export const getUserActivitySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  activityType: z.enum(['LOGIN', 'PAGE_VIEW', 'ACTION', 'API_CALL'] as const).optional()
});

// TypeScript types derived from schemas
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type GetUserActivityQuery = z.infer<typeof getUserActivitySchema>;