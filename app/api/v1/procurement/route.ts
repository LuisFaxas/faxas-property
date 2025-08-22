import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse, paginationMetadata } from '@/lib/api/response';
import { procurementQuerySchema, createProcurementSchema } from '@/lib/validations/procurement';
import { Prisma } from '@prisma/client';

// Helper to generate PO number
async function generatePONumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Find the last PO number for this month
  const lastPO = await prisma.procurement.findFirst({
    where: {
      poNumber: {
        startsWith: `PO-${year}${month}`
      }
    },
    orderBy: {
      poNumber: 'desc'
    }
  });
  
  let sequence = 1;
  if (lastPO?.poNumber) {
    const lastSequence = parseInt(lastPO.poNumber.split('-')[2] || '0');
    sequence = lastSequence + 1;
  }
  
  return `PO-${year}${month}-${String(sequence).padStart(4, '0')}`;
}

// Helper to calculate total cost
function calculateTotalCost(quantity: number, unitPrice?: number): number {
  if (!unitPrice) return 0;
  return quantity * unitPrice;
}

// GET /api/v1/procurement - List procurement items with advanced filtering
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = procurementQuerySchema.parse(searchParams);
    
    // Build where clause with advanced filters
    const where: Prisma.ProcurementWhereInput = {
      ...(query.projectId && { projectId: query.projectId }),
      ...(query.supplierId && { supplierId: query.supplierId }),
      ...(query.orderStatus && { orderStatus: query.orderStatus }),
      ...(query.priority && { priority: query.priority }),
      ...(query.discipline && { discipline: query.discipline }),
      ...(query.phase && { phase: query.phase }),
      ...(query.category && { category: query.category }),
      ...(query.search && {
        OR: [
          { materialItem: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { notes: { contains: query.search, mode: 'insensitive' } },
          { poNumber: { contains: query.search, mode: 'insensitive' } },
          { trackingNumber: { contains: query.search, mode: 'insensitive' } }
        ]
      }),
      ...((query.startDate || query.endDate) && {
        requiredBy: {
          ...(query.startDate && { gte: new Date(query.startDate) }),
          ...(query.endDate && { lte: new Date(query.endDate) })
        }
      }),
      ...((query.minAmount || query.maxAmount) && {
        totalCost: {
          ...(query.minAmount && { gte: query.minAmount }),
          ...(query.maxAmount && { lte: query.maxAmount })
        }
      }),
      ...(query.hasAttachments && { 
        attachments: { isEmpty: false } 
      }),
      ...(query.needsApproval && {
        orderStatus: 'QUOTED',
        approvedAt: null
      }),
      ...(query.isOverdue && {
        orderStatus: { in: ['QUOTED', 'ORDERED', 'SHIPPED'] },
        requiredBy: { lt: new Date() }
      })
    };
    
    // Determine sort order
    const orderBy: Prisma.ProcurementOrderByWithRelationInput = (() => {
      const order = query.sortOrder || 'desc';
      switch (query.sortBy) {
        case 'totalCost':
          return { totalCost: order };
        case 'priority':
          return { priority: order };
        case 'createdAt':
          return { createdAt: order };
        case 'materialItem':
          return { materialItem: order };
        case 'requiredBy':
        default:
          return { requiredBy: order };
      }
    })();
    
    // Execute queries in parallel
    const [procurements, total] = await Promise.all([
      prisma.procurement.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          },
          supplier: {
            select: {
              id: true,
              name: true,
              company: true,
              emails: true,
              phones: true
            }
          },
          budgetItem: {
            select: {
              id: true,
              item: true,
              discipline: true,
              estTotal: true,
              committedTotal: true
            }
          }
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy
      }),
      prisma.procurement.count({ where })
    ]);
    
    // Add calculated fields and format response
    const procurementsWithDetails = procurements.map(item => ({
      ...item,
      quantity: item.quantity ? Number(item.quantity) : 0,
      unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
      totalCost: item.totalCost ? Number(item.totalCost) : 0,
      isOverdue: ['QUOTED', 'ORDERED', 'SHIPPED'].includes(item.orderStatus) && 
                 new Date(item.requiredBy) < new Date(),
      daysUntilRequired: Math.ceil((new Date(item.requiredBy).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      needsApproval: item.orderStatus === 'QUOTED' && !item.approvedAt,
      canEdit: ['DRAFT', 'QUOTED'].includes(item.orderStatus),
      canDelete: item.orderStatus === 'DRAFT',
      canApprove: item.orderStatus === 'QUOTED' && !item.approvedAt,
      canOrder: item.orderStatus === 'APPROVED',
      canCancel: ['DRAFT', 'QUOTED', 'APPROVED', 'ORDERED'].includes(item.orderStatus)
    }));
    
    return successResponse(
      procurementsWithDetails,
      undefined,
      paginationMetadata(query.page, query.limit, total)
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/v1/procurement - Create new procurement item with auto PO generation
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const body = await request.json();
    const data = createProcurementSchema.parse(body);
    
    // Calculate total cost if unit price is provided
    const totalCost = data.unitPrice ? calculateTotalCost(data.quantity, data.unitPrice) : data.totalCost || 0;
    
    // Generate PO number if status is beyond DRAFT
    let poNumber = null;
    if (data.orderStatus && !['DRAFT', 'QUOTED'].includes(data.orderStatus)) {
      poNumber = await generatePONumber();
    }
    
    // Create procurement item
    const procurement = await prisma.procurement.create({
      data: {
        projectId: data.projectId,
        poNumber,
        materialItem: data.materialItem,
        description: data.description,
        quantity: data.quantity,
        unit: data.unit,
        unitPrice: data.unitPrice,
        totalCost,
        discipline: data.discipline,
        phase: data.phase,
        category: data.category,
        requiredBy: new Date(data.requiredBy),
        leadTimeDays: data.leadTimeDays,
        supplierId: data.supplierId,
        orderStatus: data.orderStatus || 'DRAFT',
        priority: data.priority || 'MEDIUM',
        eta: data.eta ? new Date(data.eta) : null,
        notes: data.notes,
        budgetItemId: data.budgetItemId,
        attachments: data.attachments || [],
        tags: data.tags || [],
        requestedBy: authUser.uid,
        requestedAt: new Date(),
        createdBy: authUser.uid,
        updatedBy: authUser.uid
      },
      include: {
        project: true,
        supplier: true,
        budgetItem: true
      }
    });
    
    // Update budget commitment if linked to budget item and status is ORDERED
    if (data.budgetItemId && ['ORDERED', 'APPROVED'].includes(procurement.orderStatus)) {
      await prisma.budgetItem.update({
        where: { id: data.budgetItemId },
        data: {
          committedTotal: {
            increment: totalCost
          },
          status: 'COMMITTED'
        }
      });
    }
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'CREATE',
        entity: 'PROCUREMENT',
        entityId: procurement.id,
        meta: {
          materialItem: data.materialItem,
          quantity: data.quantity,
          totalCost,
          orderStatus: data.orderStatus,
          priority: data.priority
        }
      }
    });
    
    return successResponse(procurement, 'Procurement item created successfully');
  } catch (error) {
    return errorResponse(error);
  }
}