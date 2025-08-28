import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/response';
import { z } from 'zod';
import { withAuth, type SecurityContext } from '@/lib/api/auth-wrapper';
import { getUserProjects } from '@/lib/api/auth-check';
import { Policy } from '@/lib/policy';

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

// GET /api/v1/projects - List all projects user has access to
export const GET = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth } = security;
    
    const url = new URL(request.url);
    const includeArchived = url.searchParams.get('includeArchived') === 'true';
    const favoritesOnly = url.searchParams.get('favoritesOnly') === 'true';
    
    // Use policy engine to get user's accessible projects
    const userProjectIds = await Policy.getUserProjects(auth.user.id);
    
    // Build where clause
    const where: any = {
      id: { in: userProjectIds }  // Only show projects user has access to
    };
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
    
    // Apply rate limiting based on role
    const rateLimitTier = await Policy.getRateLimitTier(auth.user.id);
    
    return successResponse(projects);
    } catch (error) {
      return errorResponse(error);
    }
  },
  {
    // No module or project requirement for listing projects
  }
);

// POST /api/v1/projects - Create new project
export const POST = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth } = security;
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
    
    // Add creator as project member with ADMIN role
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: auth.uid,
        role: auth.role  // Preserve user's system role in project
      }
    });
    
    // Log policy decision for audit
    await Policy.logPolicyDecision(
      auth.user.id,
      project.id,
      null,  // No module for project creation
      'write',
      true,
      'Project created successfully'
    );
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: auth.uid,
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
      return errorResponse(error);
    }
  },
  {
    roles: ['ADMIN', 'STAFF']  // Only admins and staff can create projects
  }
);

// Export runtime for Firebase Admin
export const runtime = 'nodejs';