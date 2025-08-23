import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';

// POST /api/v1/projects/[id]/archive - Archive/unarchive project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(['ADMIN', 'STAFF']);
    const body = await request.json();
    const isArchived = body.isArchived !== undefined ? body.isArchived : true;
    const { id } = await params;
    
    const project = await prisma.project.update({
      where: { id },
      data: {
        isArchived,
        status: isArchived ? 'ARCHIVED' : 'ACTIVE',
      },
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: isArchived ? 'ARCHIVE' : 'UNARCHIVE',
        entity: 'PROJECT',
        entityId: project.id,
        meta: {
          projectName: project.name,
        },
      },
    });
    
    return successResponse(
      project,
      isArchived ? 'Project archived successfully' : 'Project restored successfully'
    );
  } catch (error) {
    return errorResponse(error);
  }
}