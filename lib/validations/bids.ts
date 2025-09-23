import { z } from 'zod';

// Update bid schema
export const updateBidSchema = z.object({
  totalAmount: z.number()
    .positive('Amount must be greater than 0')
    .max(999999999, 'Amount too large')
    .optional(),
  notes: z.string()
    .max(5000, 'Notes must be less than 5000 characters')
    .optional()
    .nullable(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'WITHDRAWN']).optional()
});

// Bid attachment schema
export const bidAttachmentSchema = z.object({
  fileName: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long'),
  storagePath: z.string()
    .min(1, 'Storage path is required'),
  contentType: z.string()
    .min(1, 'Content type is required'),
  size: z.number()
    .positive('Size must be positive')
    .max(50 * 1024 * 1024, 'File size must be less than 50MB')
});

// Award bid schema
export const awardBidSchema = z.object({
  budgetItemId: z.string().cuid().optional(), // Link to budget item
  commitmentNotes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// Type exports
export type UpdateBidInput = z.infer<typeof updateBidSchema>;
export type BidAttachmentInput = z.infer<typeof bidAttachmentSchema>;
export type AwardBidInput = z.infer<typeof awardBidSchema>;