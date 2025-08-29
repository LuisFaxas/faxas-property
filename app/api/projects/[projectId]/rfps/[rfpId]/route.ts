import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/response';
import { updateRfpSchema } from '@/lib/validations/rfp';
import { Module } from '@prisma/client';
import { withAuth, type SecurityContext } from '@/lib/api/auth-wrapper';
import { Policy } from '@/lib/policy';
import { createSecurityContext, createRepositories } from '@/lib/data';

// GET /api/projects/:projectId/rfps/:rfpId - Get RFP details
export const GET = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth } = security;
      const { projectId, rfpId } = ctx.params;
      
      // Use policy engine to verify access
      await Policy.assertModuleAccess(auth.user.id, projectId, Module.BIDDING, 'read');
      
      // Create scoped context and repositories
      const scopedContext = await createSecurityContext(auth.user.id, projectId);
      const repos = createRepositories(scopedContext);
      
      // Get RFP with related data
      const rfp = await repos.rfps.findUnique({
        where: { id: rfpId },
        include: {
          items: {
            orderBy: { specCode: 'asc' }
          },
          attachments: {
            select: {
              id: true,
              filename: true,
              mime: true,
              size: true,
              createdAt: true,
              createdBy: true
            },
            orderBy: { createdAt: 'desc' }
          },
          invitations: {
            include: {
              vendor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  status: true
                }
              }
            }
          },
          bids: {
            select: {
              id: true,
              vendorId: true,
              status: true,
              submittedAt: true
            }
          },
          award: true
        }
      });
      
      if (!rfp) {
        return errorResponse({ message: 'RFP not found' }, 404);
      }
      
      // Apply rate limiting based on role
      const rateLimitTier = await Policy.getRateLimitTier(auth.user.id);
      
      return successResponse(rfp);
    } catch (error) {
      return errorResponse(error);
    }
  },
  {
    requireProject: false
  }
);

// PUT /api/projects/:projectId/rfps/:rfpId - Update RFP (DRAFT only)
export const PUT = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth } = security;
      const { projectId, rfpId } = ctx.params;
      
      // Use policy engine to verify write access
      await Policy.assertModuleAccess(auth.user.id, projectId, Module.BIDDING, 'write');
      
      // Create scoped context and repositories
      const scopedContext = await createSecurityContext(auth.user.id, projectId);
      const repos = createRepositories(scopedContext);
      
      // Parse and validate request body
      const body = await request.json();
      const data = updateRfpSchema.parse(body);
      
      // Update RFP using repository (checks DRAFT status)
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.dueAt !== undefined) updateData.dueAt = new Date(data.dueAt);
      
      const rfp = await repos.rfps.update({
        where: { id: rfpId },
        data: updateData,
        include: {
          items: true,
          attachments: {
            select: {
              id: true,
              filename: true,
              size: true
            }
          }
        }
      });
      
      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: auth.user.id,
          action: 'UPDATE',
          entity: 'RFP',
          entityId: rfp.id,
          meta: {
            updates: Object.keys(updateData),
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
        'RFP updated successfully'
      );
      
      return successResponse(rfp, 'RFP updated successfully');
    } catch (error) {
      return errorResponse(error);
    }
  },
  {
    requireProject: false
  }
);

// DELETE /api/projects/:projectId/rfps/:rfpId - Delete RFP (DRAFT only, no invitations/bids)
export const DELETE = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth } = security;
      const { projectId, rfpId } = ctx.params;
      
      // Use policy engine to verify write access
      await Policy.assertModuleAccess(auth.user.id, projectId, Module.BIDDING, 'write');
      
      // Only ADMIN/STAFF can delete RFPs
      const role = await Policy.getUserProjectRole(auth.user.id, projectId);
      if (!role || !['ADMIN', 'STAFF'].includes(role)) {
        return errorResponse({ message: 'Only ADMIN/STAFF can delete RFPs' }, 403);
      }
      
      // Create scoped context and repositories
      const scopedContext = await createSecurityContext(auth.user.id, projectId);
      const repos = createRepositories(scopedContext);
      
      // Delete RFP using repository (checks status and dependencies)
      const rfp = await repos.rfps.delete({
        where: { id: rfpId }
      });
      
      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: auth.user.id,
          action: 'DELETE',
          entity: 'RFP',
          entityId: rfp.id,
          meta: {
            title: rfp.title,
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
        'RFP deleted successfully'
      );
      
      return successResponse({ id: rfp.id }, 'RFP deleted successfully');
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