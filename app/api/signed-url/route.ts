import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { generateSignedUrl } from '@/lib/storage';
import { checkModuleAccess } from '@/lib/access';
import { z } from 'zod';
import { Module } from '@prisma/client';

const signedUrlSchema = z.object({
  storagePath: z.string(),
  expiresIn: z.number().min(1).max(1440).default(60) // 1 min to 24 hours
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { storagePath, expiresIn } = signedUrlSchema.parse(body);

    // Parse storage path to determine access requirements
    // Expected format: projects/{projectId}/{type}/{file}
    const pathParts = storagePath.split('/');
    
    if (pathParts.length < 3 || pathParts[0] !== 'projects') {
      return NextResponse.json(
        { error: 'Invalid storage path format' },
        { status: 400 }
      );
    }

    const projectId = pathParts[1];
    const resourceType = pathParts[2];

    // Check module access based on resource type
    let hasAccess = false;
    
    switch (resourceType) {
      case 'plans':
        hasAccess = await checkModuleAccess(user.uid, projectId, Module.PLANS, 'view');
        break;
      case 'invoices':
        hasAccess = await checkModuleAccess(user.uid, projectId, Module.INVOICES, 'view');
        break;
      case 'uploads':
      case 'contractors':
        hasAccess = await checkModuleAccess(user.uid, projectId, Module.UPLOADS, 'view');
        break;
      case 'documents':
        hasAccess = await checkModuleAccess(user.uid, projectId, Module.DOCS_READ, 'view');
        break;
      default:
        // Admin and staff have access to everything
        hasAccess = user.role === 'ADMIN' || user.role === 'STAFF';
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to access this resource' },
        { status: 403 }
      );
    }

    // Generate signed URL
    const url = await generateSignedUrl(storagePath, expiresIn);

    return NextResponse.json({
      url,
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 60 * 1000).toISOString()
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}