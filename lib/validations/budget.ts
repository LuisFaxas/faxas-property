import { z } from 'zod';

// Match Prisma BudgetStatus enum
export const BudgetStatus = z.enum(['BUDGETED', 'COMMITTED', 'PAID']);

export const createBudgetItemSchema = z.object({
  discipline: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  item: z.string().min(1).max(200),
  unit: z.string().optional(),
  qty: z.number().min(0).default(1),
  estUnitCost: z.number().min(0).default(0),
  estTotal: z.number().min(0).default(0),
  committedTotal: z.number().min(0).default(0),
  paidToDate: z.number().min(0).default(0),
  vendorContactId: z.string().optional(),
  status: BudgetStatus.default('BUDGETED'),
  projectId: z.string()
});

export const updateBudgetItemSchema = createBudgetItemSchema.partial().extend({
  id: z.string()
});

export const budgetQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  discipline: z.string().optional(),
  category: z.string().optional(),
  status: BudgetStatus.optional(),
  projectId: z.string().optional(),
  overBudgetOnly: z.string().optional().transform(val => val === 'true')
});

export type CreateBudgetItemInput = z.infer<typeof createBudgetItemSchema>;
export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemSchema>;
export type BudgetQuery = z.infer<typeof budgetQuerySchema>;

// Commitment creation schema (for bid award)
export const createCommitmentFromBidSchema = z.object({
  bidId: z.string().cuid(),
  budgetItemId: z.string().cuid().optional(),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

export type CreateCommitmentFromBidInput = z.infer<typeof createCommitmentFromBidSchema>;