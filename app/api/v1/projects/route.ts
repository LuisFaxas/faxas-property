import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';

// GET /api/v1/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    
    // Check if any projects exist
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // If no projects exist, create a default one
    if (projects.length === 0) {
      const defaultProject = await prisma.project.create({
        data: {
          name: 'Miami Duplex Remodel',
          status: 'ACTIVE'
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
    
    const project = await prisma.project.create({
      data: {
        name: body.name,
        status: body.status || 'ACTIVE'
      }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'CREATE',
        entity: 'PROJECT',
        entityId: project.id,
        meta: {
          name: project.name
        }
      }
    });
    
    return successResponse(project, 'Project created successfully');
  } catch (error) {
    return errorResponse(error);
  }
}