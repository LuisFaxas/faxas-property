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

    console.log('[Projects API] Fetching projects for user:', auth.user.id, 'with role:', auth.role);

    const url = new URL(request.url);
    const includeArchived = url.searchParams.get('includeArchived') === 'true';
    const favoritesOnly = url.searchParams.get('favoritesOnly') === 'true';
    
    // Use policy engine to get user's accessible projects
    const userProjectIds = await Policy.getUserProjects(auth.user.id);
    console.log('[Projects API] User accessible project IDs:', userProjectIds);
    
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

    console.log('[Projects API] Found', projects.length, 'projects for user');
    
    // If no projects exist for user, ensure Miami Duplex exists and link it
    if (projects.length === 0 && !favoritesOnly) {
      console.log('[Projects API] No projects found for user, checking Miami Duplex...');

      // First check if Miami Duplex exists at all
      let miamiDuplex = await prisma.project.findFirst({
        where: {
          name: 'Miami Duplex Remodel'
        }
      });

      // Create Miami Duplex if it doesn't exist
      if (!miamiDuplex) {
        console.log('[Projects API] Creating Miami Duplex project...');
        miamiDuplex = await prisma.project.create({
          data: {
            name: 'Miami Duplex Remodel',
            status: 'ACTIVE',
            projectType: 'RENOVATION',
            description: 'Complete renovation of Miami duplex property',
            color: '#3B82F6'
          }
        });
        console.log('[Projects API] Miami Duplex created with ID:', miamiDuplex.id);
      } else {
        console.log('[Projects API] Miami Duplex exists with ID:', miamiDuplex.id);
      }

      // For ADMIN/STAFF users, ensure they have membership
      if (auth.role === 'ADMIN' || auth.role === 'STAFF') {
        console.log('[Projects API] Admin/Staff user - ensuring project membership...');

        // Check if membership exists
        const existingMembership = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: miamiDuplex.id,
              userId: auth.user.id
            }
          }
        });

        if (!existingMembership) {
          console.log('[Projects API] Creating project membership for user...');
          await prisma.projectMember.create({
            data: {
              projectId: miamiDuplex.id,
              userId: auth.user.id,
              role: auth.role
            }
          });
          console.log('[Projects API] Project membership created');
        } else {
          console.log('[Projects API] Project membership already exists');
        }

        // Return the Miami Duplex project
        const projectWithCounts = await prisma.project.findUnique({
          where: { id: miamiDuplex.id },
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
          }
        });

        return successResponse([projectWithCounts]);
      }

      // For other roles, return empty array
      console.log('[Projects API] Non-admin user with no projects');
      return successResponse([]);
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
      'projects' as any,  // Module for project creation
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