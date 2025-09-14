/**
 * Initialize user endpoint
 * This endpoint creates a user record in the database for the authenticated Firebase user
 * POST /api/auth/initialize
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/firebaseAdmin';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/response';
import { Role } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return errorResponse({ message: 'Missing authorization token' }, 401);
    }
    
    const token = authorization.split('Bearer ')[1];
    
    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: decodedToken.uid }
    });
    
    if (existingUser) {
      return successResponse({
        user: existingUser,
        message: 'User already initialized'
      });
    }
    
    // Create new user
    const user = await prisma.user.create({
      data: {
        id: decodedToken.uid,
        email: decodedToken.email || '',
        role: 'ADMIN' as Role // Default to ADMIN for first user
      }
    });
    
    // Get or create the default project
    const project = await prisma.project.findFirst({
      where: { id: 'miami-duplex' }
    });
    
    if (project) {
      // Add user as project member
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: user.id,
          role: user.role
        }
      });
      
      // Grant access to all modules
      const modules = [
        'TASKS', 'SCHEDULE', 'BUDGET', 'PROCUREMENT', 
        'CONTACTS', 'PROJECTS', 'BIDDING', 'PROPOSALS',
        'RFIS', 'SUBMITTALS', 'CHANGE_ORDERS', 'SAFETY',
        'WEATHER', 'PHOTOS', 'PLANS', 'UPLOADS', 'INVOICES'
      ];
      
      for (const moduleName of modules) {
        await prisma.userModuleAccess.create({
          data: {
            userId: user.id,
            projectId: project.id,
            module: moduleName as any,
            canView: true,
            canEdit: true,
            canUpload: true,
            canRequest: true
          }
        });
      }
    }
    
    return successResponse({
      user,
      message: 'User initialized successfully'
    });
    
  } catch (error: any) {
    console.error('Initialize user error:', error);
    return errorResponse(error);
  }
}

// Export runtime for Firebase Admin
export const runtime = 'nodejs';