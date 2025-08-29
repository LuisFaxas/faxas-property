import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/response';
import { bulkUpsertItemsSchema } from '@/lib/validations/rfp';
import { Module } from '@prisma/client';
import { withAuth, type SecurityContext } from '@/lib/api/auth-wrapper';
import { Policy } from '@/lib/policy';
import { createSecurityContext, createRepositories } from '@/lib/data';
import { rateLimit } from '@/lib/api/rate-limit';

// POST /api/projects/:projectId/rfps/:rfpId/items - Bulk upsert RFP items
export const POST = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth } = security;
      const { projectId, rfpId } = ctx.params;
      
      // Apply stricter rate limiting for bulk operations (12/min)
      await rateLimit(auth.user.id, 12, 60000, request);
      
      // Use policy engine to verify write access
      await Policy.assertModuleAccess(auth.user.id, projectId, Module.BIDDING, 'write');
      
      // Create scoped context and repositories
      const scopedContext = await createSecurityContext(auth.user.id, projectId);
      const repos = createRepositories(scopedContext);
      
      // Parse and validate request body
      const body = await request.json();
      
      // Check body size (max 1MB for bulk operations)
      const bodySize = JSON.stringify(body).length;
      if (bodySize > 1024 * 1024) {
        return errorResponse({ message: 'Request body too large (max 1MB)' }, 413);
      }
      
      const data = bulkUpsertItemsSchema.parse(body);
      
      // Perform bulk upsert using repository (checks DRAFT status)
      const items = await repos.rfpItems.bulkUpsert(rfpId, data.items);
      
      // Get updated RFP with counts
      const rfp = await repos.rfps.findUnique({
        where: { id: rfpId },
        include: {
          _count: {
            select: {
              items: true
            }
          }
        }
      });
      
      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: auth.user.id,
          action: 'BULK_UPSERT',
          entity: 'RFP_ITEMS',
          entityId: rfpId,
          meta: {
            itemCount: data.items.length,
            created: data.items.filter(i => !i.id).length,
            updated: data.items.filter(i => i.id).length,
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
        `Bulk upserted ${items.length} items`
      );
      
      return successResponse(
        {
          items,
          rfp: {
            id: rfp?.id,
            itemCount: rfp?._count?.items || 0
          }
        },
        `Successfully processed ${items.length} items`
      );
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