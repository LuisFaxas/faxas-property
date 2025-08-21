import { z } from 'zod';

// Define enums locally since Prisma enums might not be available at build time
export const BudgetCategory = z.enum(['LABOR', 'MATERIALS', 'EQUIPMENT', 'SUBCONTRACTOR', 'PERMITS', 'OVERHEAD', 'CONTINGENCY', 'OTHER']);
export const BudgetStatus = z.enum(['PLANNED', 'COMMITTED', 'SPENT', 'OVERRUN']);

export const createBudgetItemSchema = z.object({
  name: z.string().min(1).max(200),
  category: BudgetCategory,
  budgetAmount: z.number().positive(),
  committedAmount: z.number().min(0).default(0),
  actualAmount: z.number().min(0).default(0),
  status: BudgetStatus.default('PLANNED'),
  notes: z.string().optional(),
  projectId: z.string()
});

export const updateBudgetItemSchema = createBudgetItemSchema.partial().extend({
  id: z.string()
});

export const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
  date: z.string().datetime().optional()
});

export const budgetQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  category: BudgetCategory.optional(),
  status: BudgetStatus.optional(),
  projectId: z.string().optional(),
  overBudgetOnly: z.string().optional().transform(val => val === 'true')
});

export type CreateBudgetItemInput = z.infer<typeof createBudgetItemSchema>;
export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type BudgetQuery = z.infer<typeof budgetQuerySchema>;