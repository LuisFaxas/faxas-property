import { z } from 'zod';

export const PlanCategory = z.enum([
  'ARCHITECTURAL',
  'STRUCTURAL',
  'MEP',
  'ELECTRICAL',
  'PLUMBING',
  'LANDSCAPE',
  'CIVIL',
  'INTERIOR',
  'AS_BUILT',
  'SHOP_DRAWINGS',
  'DETAILS',
  'SPECIFICATIONS',
  'OTHER'
]);

export const planFileSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  category: PlanCategory,
  storagePath: z.string().min(1, 'Storage path is required'),
  version: z.string().min(1, 'Version is required'),
  dateIssued: z.string().or(z.date()),
  notes: z.string().optional(),
  sharedWithIds: z.array(z.string()).optional().default([])
});

export const planFileUpdateSchema = planFileSchema.partial().omit({ projectId: true });

export type PlanFileFormValues = z.infer<typeof planFileSchema>;
export type PlanFileUpdateFormValues = z.infer<typeof planFileUpdateSchema>;