// app/api/v1/vendors/[vendorId]/users/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { z } from 'zod';

const updateUserSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'ESTIMATOR', 'PROJECT_MANAGER', 'VIEWER']).optional(),
  permissions: z.object({
    canSubmitBids: z.boolean().optional(),
    canViewBids: z.boolean().optional(),
    canEditProfile: z.boolean().optional(),
    canViewFinancials: z.boolean().optional()
  }).optional(),
  isActive: z.boolean().optional()
});

interface RouteParams {
  params: Promise<{
    vendorId: string;
    userId: string;
  }>;
}

// PUT /api/v1/vendors/[vendorId]/users/[userId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { vendorId, userId } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = updateUserSchema.parse(body);

    // Check if vendor user association exists
    const vendorUser = await prisma.vendorUser.findUnique({
      where: {
        vendorId_userId: {
          vendorId,
          userId
        }
      }
    });

    if (!vendorUser) {
      return errorResponse('Vendor user association not found', 404);
    }

    // Prevent removing the last owner
    if (vendorUser.role === 'OWNER' && validatedData.role !== 'OWNER') {
      const ownerCount = await prisma.vendorUser.count({
        where: {
          vendorId,
          role: 'OWNER',
          isActive: true
        }
      });

      if (ownerCount <= 1) {
        return errorResponse('Cannot remove the last owner from vendor', 400);
      }
    }

    // Update vendor user
    const updatedVendorUser = await prisma.vendorUser.update({
      where: {
        vendorId_userId: {
          vendorId,
          userId
        }
      },
      data: validatedData,
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

    return successResponse(updatedVendorUser, 'Vendor user updated successfully');
  } catch (error) {
    console.error('Error updating vendor user:', error);
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid update data', 400, { errors: error.errors });
    }
    return errorResponse(error);
  }
}

// DELETE /api/v1/vendors/[vendorId]/users/[userId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { vendorId, userId } = params;

    // Check if vendor user association exists
    const vendorUser = await prisma.vendorUser.findUnique({
      where: {
        vendorId_userId: {
          vendorId,
          userId
        }
      }
    });

    if (!vendorUser) {
      return errorResponse('Vendor user association not found', 404);
    }

    // Prevent removing the last owner
    if (vendorUser.role === 'OWNER') {
      const ownerCount = await prisma.vendorUser.count({
        where: {
          vendorId,
          role: 'OWNER',
          isActive: true
        }
      });

      if (ownerCount <= 1) {
        return errorResponse('Cannot remove the last owner from vendor', 400);
      }
    }

    // Delete vendor user association
    await prisma.vendorUser.delete({
      where: {
        vendorId_userId: {
          vendorId,
          userId
        }
      }
    });

    return successResponse(null, 'User removed from vendor successfully');
  } catch (error) {
    console.error('Error removing vendor user:', error);
    return errorResponse(error);
  }
}