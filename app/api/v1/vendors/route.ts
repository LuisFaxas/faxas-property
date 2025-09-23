// app/api/v1/vendors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Validation schemas
const createVendorSchema = z.object({
  name: z.string().min(1).max(255),
  contactName: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  website: z.string().url().optional(),
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
  preferredVendor: z.boolean().optional()
});

const updateVendorSchema = createVendorSchema.partial();

// GET /api/v1/vendors
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF', 'VIEWER']);

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const search = searchParams.get('search');
    const tradeCategory = searchParams.get('tradeCategory');
    const prequalified = searchParams.get('prequalified');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.VendorWhereInput = {
      AND: [
        projectId ? { projectId } : {},
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { contactName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        } : {},
        tradeCategory ? {
          tradeCategories: {
            has: tradeCategory
          }
        } : {},
        prequalified !== null ? {
          prequalified: prequalified === 'true'
        } : {}
      ]
    };

    // Get vendors with pagination
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          _count: {
            select: {
              bids: true,
              awards: true,
              commitments: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: [
          { preferredVendor: 'desc' },
          { prequalified: 'desc' },
          { name: 'asc' }
        ]
      }),
      prisma.vendor.count({ where })
    ]);

    return successResponse({
      vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return errorResponse(error);
  }
}

// POST /api/v1/vendors
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const body = await request.json();

    // Validate input
    const validatedData = createVendorSchema.parse(body);

    // Get projectId from body or header
    const projectId = body.projectId || request.headers.get('x-project-id');
    if (!projectId) {
      return errorResponse('Project ID is required', 400);
    }

    // Check for duplicate vendor
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        projectId,
        OR: [
          { email: validatedData.email },
          { taxId: validatedData.taxId || undefined }
        ]
      }
    });

    if (existingVendor) {
      return errorResponse('A vendor with this email or tax ID already exists', 409);
    }

    // Create vendor
    const vendor = await prisma.vendor.create({
      data: {
        ...validatedData,
        projectId,
        createdById: authUser.uid,
        updatedById: authUser.uid
      }
    });

    return successResponse(vendor, 'Vendor created successfully', 201);
  } catch (error) {
    console.error('Error creating vendor:', error);
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid vendor data', 400, { errors: error.errors });
    }
    return errorResponse(error);
  }
}