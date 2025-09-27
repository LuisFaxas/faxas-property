import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { 
  updateProcurementSchema, 
  statusUpdateSchema,
  approvalActionSchema 
} from '@/lib/validations/procurement';

// Helper to generate PO number
async function generatePONumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
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

// GET /api/v1/procurement/[id] - Get single procurement item with full details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await context.params;
    
    const procurement = await prisma.procurement.findUnique({
      where: { id },
      include: {
        project: true,
        supplier: {
          select: {
            id: true,
            name: true,
            company: true,
            emails: true,
            phones: true,
            specialty: true,
            status: true
          }
        },
        budgetItem: {
          select: {
            id: true,
            item: true,
            discipline: true,
            category: true,
            estTotal: true,
            committedTotal: true,
            paidToDate: true,
            variance: true
          }
        }
      }
    });
    
    if (!procurement) {
      return errorResponse('Procurement item not found', 404);
    }
    
    // Add calculated fields
    const procurementWithDetails = {
      ...procurement,
      quantity: procurement.quantity ? Number(procurement.quantity) : 0,
      unitPrice: procurement.unitPrice ? Number(procurement.unitPrice) : 0,
      totalCost: procurement.totalCost ? Number(procurement.totalCost) : 0,
      isOverdue: ['QUOTED', 'ORDERED', 'SHIPPED'].includes(procurement.orderStatus) && 
                 new Date(procurement.requiredBy) < new Date(),
      daysUntilRequired: Math.ceil((new Date(procurement.requiredBy).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      needsApproval: procurement.orderStatus === 'QUOTED' && !procurement.approvedAt,
      canEdit: ['DRAFT', 'QUOTED'].includes(procurement.orderStatus),
      canDelete: procurement.orderStatus === 'DRAFT',
      canApprove: procurement.orderStatus === 'QUOTED' && !procurement.approvedAt,
      canOrder: procurement.orderStatus === 'APPROVED',
      canCancel: ['DRAFT', 'QUOTED', 'APPROVED', 'ORDERED'].includes(procurement.orderStatus)
    };
    
    return successResponse(procurementWithDetails);
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT /api/v1/procurement/[id] - Update procurement item
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { id } = await context.params;
    const body = await request.json();
    const data = updateProcurementSchema.parse(body);
    
    // Check if procurement exists and can be edited
    const existing = await prisma.procurement.findUnique({
      where: { id }
    });
    
    if (!existing) {
      return errorResponse('Procurement item not found', 404);
    }
    
    if (!['DRAFT', 'QUOTED'].includes(existing.orderStatus)) {
      return errorResponse('Cannot edit procurement item in current status', 400);
    }
    
    // Calculate total cost if quantity or unit price changed
    let totalCost = existing.totalCost ? Number(existing.totalCost) : 0;
    if (data.quantity !== undefined || data.unitPrice !== undefined) {
      const quantity = data.quantity ?? Number(existing.quantity);
      const unitPrice = data.unitPrice ?? (existing.unitPrice ? Number(existing.unitPrice) : 0);
      totalCost = quantity * unitPrice;
    }
    
    // Generate PO number if status is changing to APPROVED or beyond
    let poNumber = existing.poNumber;
    if (data.orderStatus && !existing.poNumber && 
        !['DRAFT', 'QUOTED'].includes(data.orderStatus)) {
      poNumber = await generatePONumber();
    }
    
    // Update procurement
    const procurement = await prisma.procurement.update({
      where: { id },
      data: {
        ...(data.materialItem && { materialItem: data.materialItem }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
        ...(totalCost && { totalCost }),
        ...(data.discipline && { discipline: data.discipline }),
        ...(data.phase && { phase: data.phase }),
        ...(data.category && { category: data.category }),
        ...(data.requiredBy && { requiredBy: new Date(data.requiredBy) }),
        ...(data.leadTimeDays !== undefined && { leadTimeDays: data.leadTimeDays }),
        ...(data.supplierId !== undefined && { supplierId: data.supplierId }),
        ...(data.orderStatus && { orderStatus: data.orderStatus }),
        ...(data.priority && { priority: data.priority }),
        ...(data.eta !== undefined && { eta: data.eta ? new Date(data.eta) : null }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.budgetItemId !== undefined && { budgetItemId: data.budgetItemId }),
        ...(data.attachments && { attachments: data.attachments }),
        ...(data.tags && { tags: data.tags }),
        ...(poNumber && { poNumber }),
        updatedBy: authUser.uid,
        updatedAt: new Date()
      },
      include: {
        project: true,
        supplier: true,
        budgetItem: true
      }
    });
    
    // Update budget commitment if status changed to ORDERED/APPROVED
    if (data.orderStatus && data.budgetItemId && 
        ['ORDERED', 'APPROVED'].includes(data.orderStatus) &&
        !['ORDERED', 'APPROVED'].includes(existing.orderStatus)) {
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
        action: 'UPDATE',
        entity: 'PROCUREMENT',
        entityId: id,
        meta: {
          changes: data,
          previousStatus: existing.orderStatus,
          newStatus: data.orderStatus
        }
      }
    });
    
    return successResponse(procurement, 'Procurement item updated successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/v1/procurement/[id] - Delete procurement item
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(['ADMIN']);
    const { id } = await context.params;
    
    // Check if procurement exists and can be deleted
    const existing = await prisma.procurement.findUnique({
      where: { id }
    });
    
    if (!existing) {
      return errorResponse('Procurement item not found', 404);
    }
    
    if (existing.orderStatus !== 'DRAFT') {
      return errorResponse('Can only delete draft procurement items', 400);
    }
    
    // Delete procurement
    await prisma.procurement.delete({
      where: { id }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'DELETE',
        entity: 'PROCUREMENT',
        entityId: id,
        meta: {
          materialItem: existing.materialItem,
          orderStatus: existing.orderStatus
        }
      }
    });
    
    return successResponse(null, 'Procurement item deleted successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

// PATCH /api/v1/procurement/[id] - Update procurement status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { id } = await context.params;
    const body = await request.json();
    const data = statusUpdateSchema.parse(body);
    
    const existing = await prisma.procurement.findUnique({
      where: { id },
      include: { budgetItem: true }
    });
    
    if (!existing) {
      return errorResponse('Procurement item not found', 404);
    }
    
    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'DRAFT': ['QUOTED', 'CANCELLED'],
      'QUOTED': ['APPROVED', 'REJECTED', 'CANCELLED'],
      'APPROVED': ['ORDERED', 'CANCELLED'],
      'ORDERED': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED', 'CANCELLED'],
      'DELIVERED': ['INSTALLED'],
      'INSTALLED': [],
      'CANCELLED': ['DRAFT'],
      'REJECTED': ['QUOTED', 'DRAFT']
    };
    
    const currentStatus = existing.orderStatus;
    const allowedStatuses = validTransitions[currentStatus] || [];
    
    if (!allowedStatuses.includes(data.status)) {
      return errorResponse(
        `Cannot transition from ${currentStatus} to ${data.status}`,
        400
      );
    }
    
    // Generate PO number if transitioning to ORDERED
    let poNumber = existing.poNumber;
    if (data.status === 'ORDERED' && !poNumber) {
      poNumber = await generatePONumber();
    }
    
    // Update procurement with new status
    const updateData: any = {
      orderStatus: data.status,
      updatedBy: authUser.uid,
      updatedAt: new Date()
    };
    
    // Add status-specific fields
    if (data.status === 'ORDERED') {
      updateData.poNumber = poNumber;
      if (!existing.eta) {
        updateData.eta = new Date(Date.now() + existing.leadTimeDays * 24 * 60 * 60 * 1000);
      }
    }
    
    if (data.status === 'DELIVERED' && data.actualDelivery) {
      updateData.actualDelivery = new Date(data.actualDelivery);
    }
    
    if (data.trackingNumber) {
      updateData.trackingNumber = data.trackingNumber;
    }
    
    if (data.notes) {
      updateData.notes = existing.notes 
        ? `${existing.notes}\n\n[${new Date().toISOString()}] ${data.notes}`
        : data.notes;
    }
    
    const procurement = await prisma.procurement.update({
      where: { id },
      data: updateData,
      include: {
        project: true,
        supplier: true,
        budgetItem: true
      }
    });
    
    // Update budget based on status change
    if (existing.budgetItemId) {
      const totalCost = existing.totalCost ? Number(existing.totalCost) : 0;
      
      // Moving to ORDERED/APPROVED - increase commitment
      if (['ORDERED', 'APPROVED'].includes(data.status) && 
          !['ORDERED', 'APPROVED'].includes(currentStatus)) {
        await prisma.budgetItem.update({
          where: { id: existing.budgetItemId },
          data: {
            committedTotal: { increment: totalCost },
            status: 'COMMITTED'
          }
        });
      }
      
      // Moving to DELIVERED/INSTALLED - increase paid amount
      if (['DELIVERED', 'INSTALLED'].includes(data.status) && 
          !['DELIVERED', 'INSTALLED'].includes(currentStatus)) {
        await prisma.budgetItem.update({
          where: { id: existing.budgetItemId },
          data: {
            paidToDate: { increment: totalCost },
            status: 'PAID'
          }
        });
      }
      
      // Cancelling - decrease commitment
      if (data.status === 'CANCELLED' && 
          ['ORDERED', 'APPROVED'].includes(currentStatus)) {
        await prisma.budgetItem.update({
          where: { id: existing.budgetItemId },
          data: {
            committedTotal: { decrement: totalCost }
          }
        });
      }
    }
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'STATUS_UPDATE',
        entity: 'PROCUREMENT',
        entityId: id,
        meta: {
          previousStatus: currentStatus,
          newStatus: data.status,
          trackingNumber: data.trackingNumber,
          actualDelivery: data.actualDelivery
        }
      }
    });
    
    return successResponse(procurement, `Status updated to ${data.status}`);
  } catch (error) {
    return errorResponse(error);
  }
}

// Force Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';