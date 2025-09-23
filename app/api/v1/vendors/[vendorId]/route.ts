// app/api/v1/vendors/[vendorId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { z } from 'zod';

// Validation schema for updates
const updateVendorSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  contactName: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  website: z.string().url().optional().nullable(),
  notes: z.string().optional(),
  tradeCategories: z.array(z.string()).optional(),
  certifications: z.array(z.object({
    name: z.string(),
    number: z.string().optional(),
    expiryDate: z.string().datetime().optional(),
    issuingBody: z.string().optional()
  })).optional(),
  insurance: z.object({
    generalLiability: z.number().optional(),
    workersComp: z.number().optional(),
    professionalLiability: z.number().optional(),
    expiryDate: z.string().datetime().optional()
  }).optional(),
  w9OnFile: z.boolean().optional(),
  prequalified: z.boolean().optional(),
  preferredVendor: z.boolean().optional(),
  isActive: z.boolean().optional()
});

interface RouteParams {
  params: Promise<{
    vendorId: string;
  }>;
}

// GET /api/v1/vendors/[vendorId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF', 'VIEWER', 'CONTRACTOR']);
    const { vendorId } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        users: {
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
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            rfp: {
              select: {
                id: true,
                title: true,
                status: true
              }
            }
          }
        },
        awards: {
          orderBy: { awardDate: 'desc' },
          take: 5,
          include: {
            rfp: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        commitments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            contractNumber: true,
            type: true,
            status: true,
            currentAmount: true
          }
        },
        _count: {
          select: {
            bids: true,
            awards: true,
            commitments: true,
            users: true
          }
        }
      }
    });

    if (!vendor) {
      return errorResponse('Vendor not found', 404);
    }

    // For contractors, verify they have access to this vendor
    if (authUser.role === 'CONTRACTOR') {
      const hasAccess = await prisma.vendorUser.findFirst({
        where: {
          vendorId,
          userId: authUser.uid,
          isActive: true
        }
      });

      if (!hasAccess) {
        return errorResponse('Access denied', 403);
      }
    }

    return successResponse(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return errorResponse(error);
  }
}

// PUT /api/v1/vendors/[vendorId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { vendorId } = params;
    const body = await request.json();

    // Validate input
    const validatedData = updateVendorSchema.parse(body);

    // Check if vendor exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    });

    if (!existingVendor) {
      return errorResponse('Vendor not found', 404);
    }

    // Check for duplicate email/taxId if being updated
    if (validatedData.email || validatedData.taxId) {
      const duplicate = await prisma.vendor.findFirst({
        where: {
          projectId: existingVendor.projectId,
          id: { not: vendorId },
          OR: [
            validatedData.email ? { email: validatedData.email } : {},
            validatedData.taxId ? { taxId: validatedData.taxId } : {}
          ]
        }
      });

      if (duplicate) {
        return errorResponse('Another vendor with this email or tax ID already exists', 409);
      }
    }

    // Update vendor
    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        ...validatedData,
        updatedById: authUser.uid
      }
    });

    return successResponse(vendor, 'Vendor updated successfully');
  } catch (error) {
    console.error('Error updating vendor:', error);
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid vendor data', 400, { errors: error.errors });
    }
    return errorResponse(error);
  }
}

// DELETE /api/v1/vendors/[vendorId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireRole(['ADMIN']);
    const { vendorId } = params;

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        _count: {
          select: {
            bids: true,
            awards: true,
            commitments: true
          }
        }
      }
    });

    if (!vendor) {
      return errorResponse('Vendor not found', 404);
    }

    // Prevent deletion if vendor has relationships
    if (vendor._count.bids > 0 || vendor._count.awards > 0 || vendor._count.commitments > 0) {
      return errorResponse(
        'Cannot delete vendor with existing bids, awards, or commitments. Deactivate instead.',
        400
      );
    }

    // Soft delete by setting isActive to false
    await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        isActive: false,
        updatedById: authUser.uid
      }
    });

    return successResponse(null, 'Vendor deactivated successfully');
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return errorResponse(error);
  }
}