import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse, ApiError } from '@/lib/api/response';
import { updatePurchaseOrderSchema } from '@/lib/validations/procurement';

// GET /api/v1/procurement/[id] - Get single purchase order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        project: true,
        budgetItem: true,
        items: true,
        invoices: {
          include: {
            payments: true
          }
        },
        payments: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!purchaseOrder) {
      throw new ApiError(404, 'Purchase order not found');
    }
    
    // Calculate payment status
    const totalPaid = purchaseOrder.payments.reduce(
      (sum, payment) => sum + Number(payment.amount), 
      0
    );
    
    const orderWithDetails = {
      ...purchaseOrder,
      totalPaid,
      balanceDue: Number(purchaseOrder.totalAmount) - totalPaid,
      paymentStatus: totalPaid === 0 
        ? 'UNPAID' 
        : totalPaid >= Number(purchaseOrder.totalAmount) 
          ? 'PAID' 
          : 'PARTIAL'
    };
    
    return successResponse(orderWithDetails);
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT /api/v1/procurement/[id] - Update purchase order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { id } = await params;
    const body = await request.json();
    const data = updatePurchaseOrderSchema.parse({ ...body, id });
    
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true }
    });
    
    if (!existingPO) {
      throw new ApiError(404, 'Purchase order not found');
    }
    
    // Check if status is changing to APPROVED
    const isApproving = existingPO.status !== 'APPROVED' && data.status === 'APPROVED';
    
    // Start transaction for complex update
    const purchaseOrder = await prisma.$transaction(async (tx) => {
      // Delete existing items if new items provided
      if (data.items) {
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: id }
        });
      }
      
      // Update purchase order
      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: {
          ...(data.poNumber && { poNumber: data.poNumber }),
          ...(data.vendorId && { vendorId: data.vendorId }),
          ...(data.projectId && { projectId: data.projectId }),
          ...(data.budgetItemId !== undefined && { budgetItemId: data.budgetItemId }),
          ...(data.description && { description: data.description }),
          ...(data.subtotal !== undefined && { subtotal: data.subtotal }),
          ...(data.tax !== undefined && { tax: data.tax }),
          ...(data.shipping !== undefined && { shipping: data.shipping }),
          ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
          ...(data.paymentTerms && { paymentTerms: data.paymentTerms }),
          ...(data.deliveryDate !== undefined && { 
            deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null 
          }),
          ...(data.deliveryAddress !== undefined && { deliveryAddress: data.deliveryAddress }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.status && { status: data.status }),
          ...(isApproving && {
            approvedBy: authUser.uid,
            approvedAt: new Date()
          }),
          ...(data.items && {
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
          })
        },
        include: {
          vendor: true,
          project: true,
          items: true
        }
      });
      
      // Update budget commitment if amount changed
      if (data.budgetItemId && data.totalAmount !== undefined) {
        const difference = data.totalAmount - Number(existingPO.totalAmount);
        if (difference !== 0) {
          await tx.budgetItem.update({
            where: { id: data.budgetItemId },
            data: {
              committedTotal: {
                increment: difference
              }
            }
          });
        }
      }
      
      return updated;
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'UPDATE',
        entity: 'PURCHASE_ORDER',
        entityId: purchaseOrder.id,
        meta: {
          changes: {
            from: existingPO,
            to: purchaseOrder
          }
        }
      }
    });
    
    return successResponse(purchaseOrder, 'Purchase order updated successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/v1/procurement/[id] - Delete purchase order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(['ADMIN']);
    const { id } = await params;
    
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        invoices: true,
        payments: true
      }
    });
    
    if (!purchaseOrder) {
      throw new ApiError(404, 'Purchase order not found');
    }
    
    // Check if PO has invoices or payments
    if (purchaseOrder.invoices.length > 0 || purchaseOrder.payments.length > 0) {
      throw new ApiError(400, 'Cannot delete purchase order with invoices or payments');
    }
    
    // Transaction to delete PO and update budget
    await prisma.$transaction(async (tx) => {
      // Update budget commitment if linked
      if (purchaseOrder.budgetItemId) {
        await tx.budgetItem.update({
          where: { id: purchaseOrder.budgetItemId },
          data: {
            committedTotal: {
              decrement: Number(purchaseOrder.totalAmount)
            }
          }
        });
      }
      
      // Delete PO items first
      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: id }
      });
      
      // Delete the PO
      await tx.purchaseOrder.delete({
        where: { id }
      });
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'DELETE',
        entity: 'PURCHASE_ORDER',
        entityId: id,
        meta: {
          deletedPO: purchaseOrder
        }
      }
    });
    
    return successResponse(null, 'Purchase order deleted successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

// PATCH /api/v1/procurement/[id]/approve - Approve purchase order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(['ADMIN']);
    const { id } = await params;
    const body = await request.json();
    const action = body.action; // 'approve', 'reject', 'cancel'
    
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id }
    });
    
    if (!purchaseOrder) {
      throw new ApiError(404, 'Purchase order not found');
    }
    
    let newStatus: string;
    let updateData: any = {};
    
    switch (action) {
      case 'approve':
        if (purchaseOrder.status !== 'PENDING') {
          throw new ApiError(400, 'Only pending orders can be approved');
        }
        newStatus = 'APPROVED';
        updateData = {
          status: 'APPROVED',
          approvedBy: authUser.uid,
          approvedAt: new Date()
        };
        break;
        
      case 'reject':
        if (purchaseOrder.status !== 'PENDING') {
          throw new ApiError(400, 'Only pending orders can be rejected');
        }
        newStatus = 'REJECTED';
        updateData = {
          status: 'REJECTED',
          approvedBy: authUser.uid,
          approvedAt: new Date()
        };
        break;
        
      case 'cancel':
        if (['CLOSED', 'CANCELLED'].includes(purchaseOrder.status)) {
          throw new ApiError(400, 'Order is already closed or cancelled');
        }
        newStatus = 'CANCELLED';
        updateData = { status: 'CANCELLED' };
        break;
        
      default:
        throw new ApiError(400, 'Invalid action');
    }
    
    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        vendor: true,
        project: true
      }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: action.toUpperCase(),
        entity: 'PURCHASE_ORDER',
        entityId: id,
        meta: {
          poNumber: updated.poNumber,
          previousStatus: purchaseOrder.status,
          newStatus
        }
      }
    });
    
    return successResponse(updated, `Purchase order ${action}d successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}