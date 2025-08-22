import { z } from 'zod';

// Define enums locally since Prisma enums might not be available at build time
export const ScheduleType = z.enum(['MEETING', 'SITE_VISIT', 'INSPECTION', 'DELIVERY', 'WORK', 'OTHER']);
export const ScheduleStatus = z.enum(['REQUESTED', 'PLANNED', 'DONE', 'CANCELED', 'RESCHEDULE_NEEDED']);

export const createScheduleEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: ScheduleType,
  status: ScheduleStatus.default('PLANNED'),
  location: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  projectId: z.string(),
  requestedById: z.string().optional()
});

export const updateScheduleEventSchema = createScheduleEventSchema.partial().extend({
  id: z.string()
});

export const approveScheduleEventSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional()
});

export const scheduleQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  type: ScheduleType.optional(),
  status: ScheduleStatus.optional(),
  projectId: z.string().optional(),
  date: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  requestedById: z.string().optional()
});

export type CreateScheduleEventInput = z.infer<typeof createScheduleEventSchema>;
export type UpdateScheduleEventInput = z.infer<typeof updateScheduleEventSchema>;
export type ApproveScheduleEventInput = z.infer<typeof approveScheduleEventSchema>;
export type ScheduleQuery = z.infer<typeof scheduleQuerySchema>;