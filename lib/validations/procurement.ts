import { z } from 'zod';

// Enums
export const ProcurementStatus = z.enum([
  'DRAFT',
  'QUOTED', 
  'APPROVED',
  'ORDERED',
  'SHIPPED',
  'DELIVERED',
  'INSTALLED',
  'CANCELLED'
]);

export const ProcurementPriority = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
  'CRITICAL'
]);

export const ProcurementCategory = z.enum([
  'MATERIALS',
  'EQUIPMENT',
  'TOOLS',
  'SAFETY',
  'CONSUMABLES',
  'SERVICES',
  'RENTAL',
  'OTHER'
]);

// Query schemas
export const procurementQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  projectId: z.string().optional(),
  supplierId: z.string().optional(),
  orderStatus: ProcurementStatus.optional(),
  priority: ProcurementPriority.optional(),
  discipline: z.string().optional(),
  phase: z.string().optional(),
  category: ProcurementCategory.optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  hasAttachments: z.coerce.boolean().optional(),
  needsApproval: z.coerce.boolean().optional(),
  isOverdue: z.coerce.boolean().optional(),
  sortBy: z.enum(['requiredBy', 'totalCost', 'priority', 'createdAt', 'materialItem']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// Create procurement schema
export const createProcurementSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  materialItem: z.string().min(1, 'Material item is required'),
  description: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().optional(),
  unitPrice: z.number().min(0).optional(),
  totalCost: z.number().min(0).optional(),
  discipline: z.string().min(1, 'Discipline is required'),
  phase: z.string().min(1, 'Phase is required'),
  category: ProcurementCategory.optional(),
  requiredBy: z.string().or(z.date()),
  leadTimeDays: z.number().int().min(0),
  supplierId: z.string().optional(),
  orderStatus: ProcurementStatus.default('DRAFT'),
  priority: ProcurementPriority.default('MEDIUM'),
  eta: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
  budgetItemId: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional()
});

// Update procurement schema
export const updateProcurementSchema = createProcurementSchema.partial().omit({ 
  projectId: true 
});

// Approval action schema
export const approvalActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
  comments: z.string().optional()
});

// Status update schema
export const statusUpdateSchema = z.object({
  status: ProcurementStatus,
  trackingNumber: z.string().optional(),
  actualDelivery: z.string().or(z.date()).optional(),
  notes: z.string().optional()
});

// Bulk operation schema
export const bulkOperationSchema = z.object({
  ids: z.array(z.string()).min(1, 'Select at least one item'),
  operation: z.enum(['approve', 'reject', 'delete', 'updateStatus', 'assignSupplier', 'updatePriority']),
  data: z.object({
    status: ProcurementStatus.optional(),
    supplierId: z.string().optional(),
    priority: ProcurementPriority.optional(),
    reason: z.string().optional()
  }).optional()
});

// Analytics query schema
export const analyticsQuerySchema = z.object({
  projectId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.enum(['supplier', 'discipline', 'phase', 'category', 'status', 'month']).optional(),
  metrics: z.array(z.enum(['count', 'totalCost', 'avgCost', 'leadTime', 'onTimeDelivery'])).optional()
});

// Export schema
export const exportSchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf']),
  filters: procurementQuerySchema.optional(),
  columns: z.array(z.string()).optional()
});

// Supplier quote schema
export const supplierQuoteSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  unitPrice: z.number().positive('Price must be positive'),
  leadTimeDays: z.number().int().min(0),
  validUntil: z.string().or(z.date()),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional()
});

// PO generation schema
export const generatePOSchema = z.object({
  procurementIds: z.array(z.string()).min(1, 'Select at least one item'),
  supplierId: z.string().min(1, 'Supplier is required'),
  deliveryAddress: z.string().optional(),
  paymentTerms: z.string().optional(),
  specialInstructions: z.string().optional()
});

// Type exports
export type ProcurementFormValues = z.infer<typeof createProcurementSchema>;
export type ProcurementUpdateValues = z.infer<typeof updateProcurementSchema>;
export type ProcurementQuery = z.infer<typeof procurementQuerySchema>;
export type BulkOperation = z.infer<typeof bulkOperationSchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;