import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, paginationMetadata } from '@/lib/api/response';
import { createRfpSchema, rfpQuerySchema } from '@/lib/validations/rfp';
import { Module } from '@prisma/client';
import { withAuth, type SecurityContext } from '@/lib/api/auth-wrapper';
import { Policy } from '@/lib/policy';
import { createSecurityContext, createRepositories } from '@/lib/data';

// GET /api/projects/:projectId/rfps - List RFPs
export const GET = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth } = security;
      const projectId = ctx.params.projectId;
      
      // Use policy engine to verify access
      await Policy.assertModuleAccess(auth.user.id, projectId, Module.BIDDING, 'read');
      
      // Create scoped context and repositories
      const scopedContext = await createSecurityContext(auth.user.id, projectId);
      const repos = createRepositories(scopedContext);
      
      // Parse query parameters
      const searchParams = Object.fromEntries(request.nextUrl.searchParams);
      const query = rfpQuerySchema.parse(searchParams);
      
      // Build where clause - projectId is automatically enforced by repository
      const where: any = {
        ...(query.status && { status: query.status }),
        ...(query.search && {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } }
          ]
        })
      };
      
      // Add date range filters
      if (query.dueAfter || query.dueBefore) {
        where.dueAt = {};
        if (query.dueAfter) {
          where.dueAt.gte = new Date(query.dueAfter);
        }
        if (query.dueBefore) {
          where.dueAt.lte = new Date(query.dueBefore);
        }
      }
      
      // Determine sort order
      const orderBy: any = {};
      orderBy[query.sortBy] = query.sortOrder;
      
      // Use scoped repository for data access
      const [rfps, total] = await Promise.all([
        repos.rfps.findMany({
          where,
          include: {
            items: {
              select: {
                id: true
              }
            },
            bids: {
              select: {
                id: true,
                status: true
              }
            },
            attachments: {
              select: {
                id: true
              }
            }
          },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          orderBy
        }),
        repos.rfps.count({ where })
      ]);
      
      // Format response with counts
      const rfpsWithCounts = rfps.map(rfp => ({
        ...rfp,
        itemCount: (rfp as any).items?.length || 0,
        bidCount: (rfp as any).bids?.length || 0,
        attachmentCount: (rfp as any).attachments?.length || 0,
        submittedBidCount: (rfp as any).bids?.filter((b: any) => b.status === 'SUBMITTED').length || 0
      }));
      
      // Apply rate limiting based on role
      const rateLimitTier = await Policy.getRateLimitTier(auth.user.id);
      
      return successResponse(
        rfpsWithCounts,
        undefined,
        paginationMetadata(query.page, query.limit, total)
      );
    } catch (error) {
      return errorResponse(error);
    }
  },
  {
    requireProject: false // Project ID comes from URL
  }
);

// POST /api/projects/:projectId/rfps - Create new RFP
export const POST = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth } = security;
      const projectId = ctx.params.projectId;
      
      // Use policy engine to verify write access
      await Policy.assertModuleAccess(auth.user.id, projectId, Module.BIDDING, 'write');
      
      // Create scoped context and repositories
      const scopedContext = await createSecurityContext(auth.user.id, projectId);
      const repos = createRepositories(scopedContext);
      
      // Parse and validate request body
      const body = await request.json();
      const data = createRfpSchema.parse(body);
      
      // Create RFP using scoped repository (automatically sets DRAFT status)
      const rfp = await repos.rfps.create({
        data: {
          projectId,
          title: data.title,
          description: data.description,
          dueAt: new Date(data.dueAt),
          status: 'DRAFT',
          createdBy: auth.user.id
        },
        include: {
          items: true,
          attachments: true
        }
      });
      
      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: auth.user.id,
          action: 'CREATE',
          entity: 'RFP',
          entityId: rfp.id,
          meta: {
            title: rfp.title,
            dueAt: rfp.dueAt,
            projectId
          }
        }
      });
      
      // Log policy decision for audit
      await Policy.logPolicyDecision(
        auth.user.id,
        projectId,
        Module.BIDDING,
        'write',
        true,
        'RFP created successfully'
      );
      
      return successResponse(rfp, 'RFP created successfully');
    } catch (error) {
      return errorResponse(error);
    }
  },
  {
    requireProject: false // Project ID comes from URL
  }
);

// Export runtime for Firebase Admin
export const runtime = 'nodejs';