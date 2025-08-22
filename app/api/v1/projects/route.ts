import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { z } from 'zod';

// Validation schema for project creation
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  projectType: z.enum(['NEW_CONSTRUCTION', 'RENOVATION', 'ADDITION', 'COMMERCIAL', 'RESIDENTIAL', 'MIXED_USE']).optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  targetEndDate: z.string().optional(),
  address: z.string().optional(),
  siteDetails: z.string().optional(),
  totalBudget: z.number().optional(),
  contingency: z.number().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
  permitNumbers: z.array(z.string()).optional(),
  timezone: z.string().optional(),
  color: z.string().optional(),
});

// GET /api/v1/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    
    const url = new URL(request.url);
    const includeArchived = url.searchParams.get('includeArchived') === 'true';
    const favoritesOnly = url.searchParams.get('favoritesOnly') === 'true';
    
    // Build where clause
    const where: any = {};
    if (!includeArchived) {
      where.isArchived = false;
    }
    if (favoritesOnly) {
      where.isFavorite = true;
    }
    
    // Check if any projects exist
    const projects = await prisma.project.findMany({
      where,
      include: {
        _count: {
          select: {
            tasks: true,
            contacts: true,
            budgets: true,
            schedule: true,
            procurement: true,
          },
        },
      },
      orderBy: [
        { isFavorite: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    // If no projects exist, create a default one
    if (projects.length === 0 && !favoritesOnly) {
      const defaultProject = await prisma.project.create({
        data: {
          name: 'Miami Duplex Remodel',
          status: 'ACTIVE',
          projectType: 'RENOVATION',
          description: 'Complete renovation of Miami duplex property',
          color: '#3B82F6'
        }
      });
      
      return successResponse([defaultProject]);
    }
    
    return successResponse(projects);
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/v1/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const body = await request.json();
    
    // Validate request body
    const validated = createProjectSchema.parse(body);
    
    // Prepare data for creation
    const createData: any = {
      name: validated.name,
      status: validated.status || 'PLANNING',
      projectType: validated.projectType || 'RENOVATION',
      description: validated.description,
      address: validated.address,
      siteDetails: validated.siteDetails,
      totalBudget: validated.totalBudget,
      contingency: validated.contingency,
      clientName: validated.clientName,
      clientEmail: validated.clientEmail,
      clientPhone: validated.clientPhone,
      permitNumbers: validated.permitNumbers || [],
      timezone: validated.timezone || 'America/New_York',
      color: validated.color || '#3B82F6',
    };
    
    // Convert date strings to Date objects if provided
    if (validated.startDate) createData.startDate = new Date(validated.startDate);
    if (validated.targetEndDate) createData.targetEndDate = new Date(validated.targetEndDate);
    
    const project = await prisma.project.create({
      data: createData
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'CREATE',
        entity: 'PROJECT',
        entityId: project.id,
        meta: {
          name: project.name,
          type: project.projectType
        }
      }
    });
    
    return successResponse(project, 'Project created successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }
    return errorResponse(error);
  }
}