import { z } from 'zod';

// Define enums locally since Prisma enums might not be available at build time
export const ContactCategory = z.enum(['SUBCONTRACTOR', 'SUPPLIER', 'CONSULTANT', 'INSPECTOR', 'CLIENT', 'OTHER']);
export const ContactStatus = z.enum(['ACTIVE', 'INACTIVE', 'POTENTIAL', 'BLACKLISTED', 'FOLLOW_UP']);
export const ContactType = z.enum(['INDIVIDUAL', 'COMPANY']);

export const createContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  category: ContactCategory,
  type: ContactType,
  status: ContactStatus.default('ACTIVE'),
  notes: z.string().optional(),
  projectId: z.string()
});

export const updateContactSchema = createContactSchema.partial().extend({
  id: z.string()
});

export const contactQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  category: ContactCategory.optional(),
  type: ContactType.optional(),
  status: ContactStatus.optional(),
  projectId: z.string().optional(),
  search: z.string().optional()
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactQuery = z.infer<typeof contactQuerySchema>;