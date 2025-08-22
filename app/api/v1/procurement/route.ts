import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse, paginationMetadata } from '@/lib/api/response';
import { createPurchaseOrderSchema, purchaseOrderQuerySchema } from '@/lib/validations/procurement';
import { Prisma } from '@prisma/client';

// GET /api/v1/procurement - List purchase orders with filters
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = purchaseOrderQuerySchema.parse(searchParams);
    
    const where: Prisma.PurchaseOrderWhereInput = {
      ...(query.projectId && { projectId: query.projectId }),
      ...(query.vendorId && { vendorId: query.vendorId }),
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { poNumber: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } }
        ]
      }),
      ...(query.minAmount && { totalAmount: { gte: query.minAmount } }),
      ...(query.maxAmount && { totalAmount: { lte: query.maxAmount } }),
      ...((query.startDate || query.endDate) && {
        createdAt: {
          ...(query.startDate && { gte: new Date(query.startDate) }),
          ...(query.endDate && { lte: new Date(query.endDate) })
        }
      })
    };
    
    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          },
          budgetItem: {
            select: {
              id: true,
              item: true,
              category: true
            }
          },
          items: true,
          _count: {
            select: {
              invoices: true,
              payments: true
            }
          }
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.purchaseOrder.count({ where })
    ]);
    
    // Add calculated fields
    const ordersWithDetails = purchaseOrders.map(po => ({
      ...po,
      paidAmount: po.paidAmount ? Number(po.paidAmount) : 0,
      balanceDue: Number(po.totalAmount) - (po.paidAmount ? Number(po.paidAmount) : 0),
      isOverdue: po.status === 'ISSUED' && po.deliveryDate && new Date(po.deliveryDate) < new Date()
    }));
    
    return successResponse(
      ordersWithDetails,
      undefined,
      paginationMetadata(query.page, query.limit, total)
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/v1/procurement - Create new purchase order
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const body = await request.json();
    const data = createPurchaseOrderSchema.parse(body);
    
    // Generate PO number if not provided
    const poNumber = data.poNumber || await generatePONumber();
    
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId: data.vendorId,
        projectId: data.projectId,
        budgetItemId: data.budgetItemId,
        description: data.description,
        subtotal: data.subtotal,
        tax: data.tax,
        shipping: data.shipping,
        totalAmount: data.totalAmount,
        paymentTerms: data.paymentTerms,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        deliveryAddress: data.deliveryAddress,
        notes: data.notes,
        status: data.status,
        approvedBy: data.status === 'APPROVED' ? authUser.uid : null,
        approvedAt: data.status === 'APPROVED' ? new Date() : null,
        items: {
          create: data.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            budgetItemId: item.budgetItemId,
            notes: item.notes
          }))
        }
      },
      include: {
        vendor: true,
        project: true,
        items: true
      }
    });
    
    // Update budget commitment if linked to budget item
    if (data.budgetItemId) {
      await prisma.budgetItem.update({
        where: { id: data.budgetItemId },
        data: {
          committedTotal: {
            increment: data.totalAmount
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
        entity: 'PURCHASE_ORDER',
        entityId: purchaseOrder.id,
        meta: {
          poNumber: purchaseOrder.poNumber,
          vendor: purchaseOrder.vendor.name,
          amount: purchaseOrder.totalAmount
        }
      }
    });
    
    return successResponse(purchaseOrder, 'Purchase order created successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

// Helper function to generate PO number
async function generatePONumber(): Promise<string> {
  const year = new Date().getFullYear();
  const lastPO = await prisma.purchaseOrder.findFirst({
    where: {
      poNumber: {
        startsWith: `PO-${year}-`
      }
    },
    orderBy: {
      poNumber: 'desc'
    }
  });
  
  let nextNumber = 1;
  if (lastPO) {
    const parts = lastPO.poNumber.split('-');
    nextNumber = parseInt(parts[2]) + 1;
  }
  
  return `PO-${year}-${String(nextNumber).padStart(4, '0')}`;
}