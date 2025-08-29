import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/response';
import { attachmentUploadSchema, validateMagicNumber, sanitizeFilename } from '@/lib/validations/rfp';
import { Module } from '@prisma/client';
import { withAuth, type SecurityContext } from '@/lib/api/auth-wrapper';
import { Policy } from '@/lib/policy';
import { createSecurityContext, createRepositories } from '@/lib/data';
import { AttachmentRepository } from '@/lib/data/repositories';
import { rateLimit } from '@/lib/api/rate-limit';

// POST /api/projects/:projectId/rfps/:rfpId/attachments - Upload attachment
export const POST = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth } = security;
      const { projectId, rfpId } = ctx.params;
      
      // Apply strict rate limiting for uploads (6/min)
      await rateLimit(auth.user.id, 6, 60000, request);
      
      // Use policy engine to verify upload access
      await Policy.assertModuleAccess(auth.user.id, projectId, Module.BIDDING, 'write');
      
      // Create scoped context and repositories
      const scopedContext = await createSecurityContext(auth.user.id, projectId);
      const repos = createRepositories(scopedContext);
      
      // Parse and validate request body
      const body = await request.json();
      
      // Check body size (max 15MB including base64 overhead)
      const bodySize = JSON.stringify(body).length;
      if (bodySize > 15 * 1024 * 1024) {
        return errorResponse({ message: 'Request body too large (max 10MB file)' }, 413);
      }
      
      const data = attachmentUploadSchema.parse(body);
      
      // Decode base64 content
      const buffer = Buffer.from(data.content, 'base64');
      
      // Validate magic numbers to prevent MIME spoofing
      if (!validateMagicNumber(buffer, data.mime)) {
        return errorResponse({ 
          message: 'File content does not match declared MIME type' 
        }, 400);
      }
      
      // Sanitize filename
      const sanitizedFilename = sanitizeFilename(data.filename);
      
      // Calculate content hash for deduplication
      const contentHash = await AttachmentRepository.calculateHash(buffer);
      
      // Check if RFP exists and is accessible
      const rfp = await repos.rfps.findUnique({
        where: { id: rfpId }
      });
      
      if (!rfp) {
        return errorResponse({ message: 'RFP not found' }, 404);
      }
      
      // Generate storage path (in production, would upload to cloud storage)
      const timestamp = Date.now();
      const ext = sanitizedFilename.split('.').pop() || 'bin';
      // Generate random string for filename
      const randomStr = Math.random().toString(36).substring(2, 10);
      const storagePath = `rfps/${projectId}/${rfpId}/${timestamp}_${randomStr}.${ext}`;
      
      // In production, upload to cloud storage here
      // For now, we'll just store the path reference
      
      // Create attachment record
      const attachment = await repos.attachments.create({
        data: {
          ownerType: 'RFP',
          ownerId: rfpId,
          filename: sanitizedFilename,
          mime: data.mime,
          size: buffer.length,
          contentHash,
          urlOrPath: storagePath,
          createdBy: auth.user.id
        }
      });
      
      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: auth.user.id,
          action: 'UPLOAD',
          entity: 'ATTACHMENT',
          entityId: attachment.id,
          meta: {
            rfpId,
            filename: sanitizedFilename,
            size: buffer.length,
            mime: data.mime,
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
        'Attachment uploaded successfully'
      );
      
      // Return attachment info without the content
      return successResponse({
        id: attachment.id,
        filename: attachment.filename,
        mime: attachment.mime,
        size: attachment.size,
        createdAt: attachment.createdAt,
        createdBy: attachment.createdBy
      }, 'File uploaded successfully');
    } catch (error) {
      return errorResponse(error);
    }
  },
  {
    requireProject: false
  }
);

// GET /api/projects/:projectId/rfps/:rfpId/attachments - List attachments
export const GET = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth } = security;
      const { projectId, rfpId } = ctx.params;
      
      // Use policy engine to verify read access
      await Policy.assertModuleAccess(auth.user.id, projectId, Module.BIDDING, 'read');
      
      // Create scoped context and repositories
      const scopedContext = await createSecurityContext(auth.user.id, projectId);
      const repos = createRepositories(scopedContext);
      
      // Check if RFP exists
      const rfp = await repos.rfps.findUnique({
        where: { id: rfpId }
      });
      
      if (!rfp) {
        return errorResponse({ message: 'RFP not found' }, 404);
      }
      
      // Get attachments
      const attachments = await prisma.attachment.findMany({
        where: {
          ownerType: 'RFP',
          ownerId: rfpId
        },
        select: {
          id: true,
          filename: true,
          mime: true,
          size: true,
          createdAt: true,
          createdBy: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      // Calculate total size
      const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
      
      return successResponse({
        attachments,
        totalSize,
        remainingSize: 50 * 1024 * 1024 - totalSize // 50MB limit
      });
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