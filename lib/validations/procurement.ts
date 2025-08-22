import { z } from 'zod';

// Enums
export const POStatus = z.enum([
  'DRAFT',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'ISSUED',
  'RECEIVED',
  'CLOSED',
  'CANCELLED'
]);

export const PaymentTerms = z.enum([
  'NET_30',
  'NET_60',
  'NET_90',
  'DUE_ON_RECEIPT',
  'PREPAID',
  'MILESTONE',
  'CUSTOM'
]);

export const DeliveryStatus = z.enum([
  'PENDING',
  'SHIPPED',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED'
]);

// PO Item Schema
export const purchaseOrderItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1).max(500),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  budgetItemId: z.string().optional(),
  notes: z.string().max(1000).optional()
});

// Create Purchase Order Schema
export const createPurchaseOrderSchema = z.object({
  poNumber: z.string().min(1).max(50),
  vendorId: z.string().min(1),
  projectId: z.string().min(1),
  budgetItemId: z.string().optional(),
  description: z.string().min(1).max(500),
  items: z.array(purchaseOrderItemSchema).min(1),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  shipping: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  paymentTerms: PaymentTerms.default('NET_30'),
  deliveryDate: z.string().datetime().optional(),
  deliveryAddress: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  status: POStatus.default('DRAFT'),
  approvedBy: z.string().optional(),
  approvedAt: z.string().datetime().optional()
});

// Update Purchase Order Schema
export const updatePurchaseOrderSchema = createPurchaseOrderSchema.partial().extend({
  id: z.string()
});

// Query Schema
export const purchaseOrderQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  projectId: z.string().optional(),
  vendorId: z.string().optional(),
  status: POStatus.optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().optional()
});

// Invoice Schema
export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1).max(50),
  purchaseOrderId: z.string().min(1),
  vendorId: z.string().min(1),
  projectId: z.string().min(1),
  invoiceDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  amount: z.number().min(0),
  paidAmount: z.number().min(0).default(0),
  status: z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED']).default('PENDING'),
  notes: z.string().max(2000).optional()
});

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  id: z.string()
});

// Vendor Schema (for procurement context)
export const vendorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(200),
  contactName: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  taxId: z.string().max(50).optional(),
  paymentTerms: PaymentTerms.default('NET_30'),
  rating: z.number().min(0).max(5).optional(),
  notes: z.string().max(2000).optional(),
  isActive: z.boolean().default(true)
});

// Payment Schema
export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  purchaseOrderId: z.string().min(1),
  amount: z.number().min(0),
  paymentDate: z.string().datetime(),
  paymentMethod: z.enum(['CHECK', 'ACH', 'WIRE', 'CREDIT_CARD', 'CASH', 'OTHER']),
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().max(1000).optional()
});

// Delivery Schema
export const deliveryUpdateSchema = z.object({
  purchaseOrderId: z.string().min(1),
  status: DeliveryStatus,
  trackingNumber: z.string().max(100).optional(),
  carrier: z.string().max(100).optional(),
  receivedDate: z.string().datetime().optional(),
  receivedBy: z.string().max(100).optional(),
  notes: z.string().max(1000).optional()
});