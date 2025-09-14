import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/response';
import { Module } from '@prisma/client';
import { withAuth, type SecurityContext } from '@/lib/api/auth-wrapper';
import { Policy } from '@/lib/policy';
import { createSecurityContext, createRepositories } from '@/lib/data';

// POST /api/projects/:projectId/rfps/:rfpId/publish - Publish RFP (DRAFT -> PUBLISHED)
export const POST = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth } = security;
      const { projectId, rfpId } = ctx.params;
      
      // Use policy engine to verify write access
      await Policy.assertModuleAccess(auth.user.id, projectId, Module.BIDDING, 'write');
      
      // Only ADMIN/STAFF can publish RFPs
      const role = await Policy.getUserProjectRole(auth.user.id, projectId);
      if (!role || !['ADMIN', 'STAFF'].includes(role)) {
        return errorResponse({ message: 'Only ADMIN/STAFF can publish RFPs' }, 403);
      }
      
      // Create scoped context and repositories
      const scopedContext = await createSecurityContext(auth.user.id, projectId);
      const repos = createRepositories(scopedContext);
      
      // Publish RFP using repository (validates requirements)
      const rfp = await repos.rfps.publish(rfpId);
      
      // Get updated RFP with full details
      const publishedRfp = await repos.rfps.findUnique({
        where: { id: rfpId },
        include: {
          items: {
            select: {
              id: true,
              specCode: true,
              description: true,
              qty: true,
              uom: true
            }
          },
          attachments: {
            select: {
              id: true,
              filename: true,
              size: true
            }
          },
          _count: {
            select: {
              items: true,
              attachments: true
            }
          }
        }
      });
      
      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: auth.user.id,
          action: 'PUBLISH',
          entity: 'RFP',
          entityId: rfp.id,
          meta: {
            title: rfp.title,
            dueAt: rfp.dueAt,
            itemCount: (publishedRfp as any)?._count?.items || 0,
            attachmentCount: (publishedRfp as any)?._count?.attachments || 0,
            projectId
          }
        }
      });
      
      // Log policy decision
      await Policy.logPolicyDecision(
        auth.user.id,
        projectId,
        Module.BIDDING,
        'write',
        true,
        'RFP published successfully'
      );
      
      return successResponse(publishedRfp, 'RFP published successfully');
    } catch (error) {
      return errorResponse(error);
    }
  },
  {
    requireProject: false
  }
);

// Export runtime for Firebase Admin
export const runtime = 'nodejs';