import { z } from 'zod';

// Enums
export const RfpStatus = z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']);
export const VendorStatus = z.enum(['ACTIVE', 'INVITED', 'BLOCKED']);
export const BidStatus = z.enum(['DRAFT', 'SUBMITTED', 'WITHDRAWN']);
export const AttachmentOwnerType = z.enum(['RFP', 'BID']);
export const UnitOfMeasure = z.enum([
  'EA',   // Each
  'LF',   // Linear Feet
  'SF',   // Square Feet
  'CY',   // Cubic Yard
  'CF',   // Cubic Feet
  'TON',  // Ton
  'LB',   // Pound
  'GAL',  // Gallon
  'HR',   // Hour
  'DAY',  // Day
  'LS',   // Lump Sum
  'LOT'   // Lot
]);

// Create RFP schema
export const createRfpSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z.string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
    .nullable(),
  dueAt: z.string()
    .refine((date) => {
      const dueDate = new Date(date);
      return dueDate > new Date();
    }, 'Due date must be in the future')
});

// Update RFP schema (only allowed in DRAFT status)
export const updateRfpSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
    .nullable(),
  dueAt: z.string()
    .refine((date) => {
      if (!date) return true;
      const dueDate = new Date(date);
      return dueDate > new Date();
    }, 'Due date must be in the future')
    .optional()
});

// RFP Item schema for bulk upsert
export const rfpItemSchema = z.object({
  id: z.string().optional(), // For updates
  specCode: z.string()
    .min(1, 'Spec code is required')
    .max(50, 'Spec code must be less than 50 characters'),
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description must be less than 500 characters'),
  qty: z.number()
    .positive('Quantity must be greater than 0')
    .max(999999, 'Quantity too large'),
  uom: UnitOfMeasure
});

// Bulk upsert schema
export const bulkUpsertItemsSchema = z.object({
  items: z.array(rfpItemSchema)
    .min(1, 'At least one item is required')
    .max(100, 'Maximum 100 items per request')
});

// Attachment upload schema
export const attachmentUploadSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .regex(/^[^<>:"/\\|?*]+$/, 'Invalid filename characters'),
  mime: z.string()
    .refine((mime) => {
      const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/png',
        'image/jpeg',
        'image/jpg'
      ];
      return allowedMimes.includes(mime);
    }, 'File type not allowed'),
  size: z.number()
    .positive()
    .max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  content: z.string() // Base64 encoded content
});

// RFP Query schema for listing
export const rfpQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: RfpStatus.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'dueAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  // Date range filters
  dueAfter: z.string().optional(),
  dueBefore: z.string().optional()
});

// Vendor schema
export const createVendorSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters')
    .trim(),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  phone: z.string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number')
    .optional()
    .nullable(),
  status: VendorStatus.default('ACTIVE')
});

// Publish RFP validation
export const publishRfpSchema = z.object({
  // Just validates that we're ready to publish
  // Actual validation happens in the repository
});

// MIME type validation helper with magic number check
export const ALLOWED_MIMES = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  'application/msword': [0xD0, 0xCF, 0x11, 0xE0], // DOC
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [0x50, 0x4B, 0x03, 0x04], // DOCX
  'application/vnd.ms-excel': [0xD0, 0xCF, 0x11, 0xE0], // XLS
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [0x50, 0x4B, 0x03, 0x04], // XLSX
  'image/png': [0x89, 0x50, 0x4E, 0x47], // PNG
  'image/jpeg': [0xFF, 0xD8, 0xFF], // JPEG
} as const;

// Helper to validate magic numbers
export function validateMagicNumber(buffer: Buffer, mimeType: string): boolean {
  const magicNumbers = ALLOWED_MIMES[mimeType as keyof typeof ALLOWED_MIMES];
  if (!magicNumbers) return false;
  
  for (let i = 0; i < magicNumbers.length; i++) {
    if (buffer[i] !== magicNumbers[i]) {
      return false;
    }
  }
  return true;
}

// Helper to sanitize filename
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  filename = filename.replace(/\.\./g, '');
  filename = filename.replace(/[\/\\]/g, '_');
  
  // Remove special characters
  filename = filename.replace(/[<>:"|?*]/g, '_');
  
  // Limit length
  if (filename.length > 100) {
    const ext = filename.split('.').pop() || '';
    const name = filename.substring(0, 95 - ext.length);
    filename = `${name}.${ext}`;
  }
  
  return filename;
}

// Type exports
export type CreateRfpInput = z.infer<typeof createRfpSchema>;
export type UpdateRfpInput = z.infer<typeof updateRfpSchema>;
export type RfpItemInput = z.infer<typeof rfpItemSchema>;
export type BulkUpsertItemsInput = z.infer<typeof bulkUpsertItemsSchema>;
export type AttachmentUploadInput = z.infer<typeof attachmentUploadSchema>;
export type RfpQueryInput = z.infer<typeof rfpQuerySchema>;
export type CreateVendorInput = z.infer<typeof createVendorSchema>;