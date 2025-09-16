import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';

// POST /api/v1/projects/[id]/favorite - Toggle favorite status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth();
    const body = await request.json();
    const isFavorite = body.isFavorite !== undefined ? body.isFavorite : true;
    const { id } = await params;
    
    const project = await prisma.project.update({
      where: { id },
      data: { isFavorite },
    });
    
    return successResponse(
      project,
      isFavorite ? 'Added to favorites' : 'Removed from favorites'
    );
  } catch (error) {
    return errorResponse(error);
  }
}