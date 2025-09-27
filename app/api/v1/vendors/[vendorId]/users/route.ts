// app/api/v1/vendors/[vendorId]/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { z } from 'zod';
import { createNotificationService } from '@/lib/services/notification.service';

const addUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['OWNER', 'ADMIN', 'ESTIMATOR', 'PROJECT_MANAGER', 'VIEWER']),
  permissions: z.object({
    canSubmitBids: z.boolean().optional(),
    canViewBids: z.boolean().optional(),
    canEditProfile: z.boolean().optional(),
    canViewFinancials: z.boolean().optional()
  }).optional()
});

interface RouteParams {
  params: Promise<{
    vendorId: string;
  }>;
}

// GET /api/v1/vendors/[vendorId]/users
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { vendorId } = await params;

    const vendorUsers = await prisma.vendorUser.findMany({
      where: { vendorId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            photoURL: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return successResponse(vendorUsers);
  } catch (error) {
    console.error('Error fetching vendor users:', error);
    return errorResponse(error);
  }
}

// POST /api/v1/vendors/[vendorId]/users
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { vendorId } = params;
    const body = await request.json();

    // Validate input
    const validatedData = addUserSchema.parse(body);

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    });

    if (!vendor) {
      return errorResponse('Vendor not found', 404);
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    // If user doesn't exist, create a placeholder user
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: validatedData.email,
          role: 'CONTRACTOR',
          displayName: validatedData.email.split('@')[0],
          isActive: false // Will be activated when they accept invitation
        }
      });
    }

    // Check if user is already associated with this vendor
    const existingAssociation = await prisma.vendorUser.findUnique({
      where: {
        vendorId_userId: {
          vendorId,
          userId: user.id
        }
      }
    });

    if (existingAssociation) {
      return errorResponse('User is already associated with this vendor', 409);
    }

    // Create vendor user association
    const vendorUser = await prisma.vendorUser.create({
      data: {
        vendorId,
        userId: user.id,
        role: validatedData.role,
        permissions: validatedData.permissions || {
          canSubmitBids: validatedData.role !== 'VIEWER',
          canViewBids: true,
          canEditProfile: validatedData.role === 'OWNER' || validatedData.role === 'ADMIN',
          canViewFinancials: validatedData.role !== 'VIEWER'
        },
        invitedById: authUser.uid,
        isActive: user.isActive // Active if user already exists and is active
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true
          }
        }
      }
    });

    // Send invitation email if user is not active
    if (!user.isActive) {
      const notificationService = createNotificationService();
      await notificationService.sendVendorInvitation(
        validatedData.email,
        vendor.name,
        validatedData.role,
        `${process.env.NEXT_PUBLIC_APP_URL}/accept-vendor-invite?token=${vendorUser.id}`
      );
    }

    return successResponse(
      vendorUser,
      user.isActive
        ? 'User added to vendor successfully'
        : 'User added and invitation sent',
      201
    );
  } catch (error) {
    console.error('Error adding vendor user:', error);
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid user data', 400, { errors: error.errors });
    }
    return errorResponse(error);
  }
}

// Force Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';