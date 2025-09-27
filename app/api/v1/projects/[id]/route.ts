import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { z } from 'zod';

// Validation schema for project update
const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  projectType: z.enum(['NEW_CONSTRUCTION', 'RENOVATION', 'ADDITION', 'COMMERCIAL', 'RESIDENTIAL', 'MIXED_USE']).optional(),
  status: z.string().optional(),
  startDate: z.string().nullable().optional(),
  targetEndDate: z.string().nullable().optional(),
  actualEndDate: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  siteDetails: z.string().nullable().optional(),
  totalBudget: z.number().nullable().optional(),
  contingency: z.number().nullable().optional(),
  managerId: z.string().nullable().optional(),
  clientName: z.string().nullable().optional(),
  clientEmail: z.union([z.string().email(), z.literal(''), z.null()]).optional(),
  clientPhone: z.string().nullable().optional(),
  permitNumbers: z.array(z.string()).optional(),
  timezone: z.string().optional(),
  workingHours: z.any().optional(),
  settings: z.any().optional(),
  isArchived: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
});

// GET /api/v1/projects/[id] - Get single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tasks: true,
            contacts: true,
            budgets: true,
            schedule: true,
            procurement: true,
            plans: true,
            risks: true,
            decisions: true,
          },
        },
      },
    });
    
    if (!project) {
      return errorResponse('Project not found', 404);
    }
    
    return successResponse(project);
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT /api/v1/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validated = updateProjectSchema.parse(body);

    // Check if address is being updated
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { address: true }
    });

    // Convert date strings to Date objects if provided, handle empty strings
    const updateData: any = { ...validated };
    if (validated.startDate && validated.startDate !== '') {
      updateData.startDate = new Date(validated.startDate);
    } else if (validated.startDate === '') {
      updateData.startDate = null;
    }

    if (validated.targetEndDate && validated.targetEndDate !== '') {
      updateData.targetEndDate = new Date(validated.targetEndDate);
    } else if (validated.targetEndDate === '') {
      updateData.targetEndDate = null;
    }

    if (validated.actualEndDate && validated.actualEndDate !== '') {
      updateData.actualEndDate = new Date(validated.actualEndDate);
    } else if (validated.actualEndDate === '') {
      updateData.actualEndDate = null;
    }

    // If address changed, clear lat/lon to force re-geocoding
    if (validated.address !== undefined && validated.address !== existingProject?.address) {
      updateData.latitude = null;
      updateData.longitude = null;
    }

    // Handle empty strings as null for optional fields
    if (validated.clientEmail === '') updateData.clientEmail = null;

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'UPDATE',
        entity: 'PROJECT',
        entityId: project.id,
        meta: {
          changes: validated,
        },
      },
    });
    
    return successResponse(project, 'Project updated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse((error as any).errors[0].message, 400);
    }
    return errorResponse(error);
  }
}

// DELETE /api/v1/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { id } = await params;
    
    // Check if project has related data
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tasks: true,
            contacts: true,
            budgets: true,
            schedule: true,
            procurement: true,
            plans: true,
            risks: true,
            decisions: true,
            invoices: true,
            meetings: true,
          },
        },
      },
    });
    
    if (!project) {
      return errorResponse('Project not found', 404);
    }
    
    // Check if project has any related data
    const hasRelatedData = Object.values(project._count).some(count => count > 0);
    
    if (hasRelatedData) {
      return errorResponse(
        'Cannot delete project with existing data. Please archive it instead.',
        400
      );
    }
    
    // Delete the project
    await prisma.project.delete({
      where: { id },
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'DELETE',
        entity: 'PROJECT',
        entityId: id,
        meta: {
          projectName: project.name,
        },
      },
    });
    
    return successResponse(null, 'Project deleted successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

// Force Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';