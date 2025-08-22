import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { approvalActionSchema } from '@/lib/validations/procurement';

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

// POST /api/v1/procurement/[id]/approve - Approve or reject procurement
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { id } = await context.params;
    const body = await request.json();
    const data = approvalActionSchema.parse(body);
    
    // Get procurement item
    const procurement = await prisma.procurement.findUnique({
      where: { id },
      include: { budgetItem: true }
    });
    
    if (!procurement) {
      return errorResponse('Procurement item not found', 404);
    }
    
    if (procurement.orderStatus !== 'QUOTED') {
      return errorResponse('Can only approve/reject items in QUOTED status', 400);
    }
    
    let updateData: any;
    
    if (data.action === 'approve') {
      // Generate PO number if not exists
      const poNumber = procurement.poNumber || await generatePONumber();
      
      updateData = {
        orderStatus: 'APPROVED',
        poNumber,
        approvedBy: authUser.uid,
        approvedAt: new Date(),
        updatedBy: authUser.uid,
        updatedAt: new Date()
      };
      
      // Update budget commitment if linked
      if (procurement.budgetItemId && procurement.totalCost) {
        await prisma.budgetItem.update({
          where: { id: procurement.budgetItemId },
          data: {
            committedTotal: {
              increment: Number(procurement.totalCost)
            },
            status: 'COMMITTED'
          }
        });
      }
    } else {
      updateData = {
        orderStatus: 'DRAFT',
        rejectedBy: authUser.uid,
        rejectedAt: new Date(),
        rejectionReason: data.reason || data.comments,
        updatedBy: authUser.uid,
        updatedAt: new Date()
      };
    }
    
    // Update procurement
    const updatedProcurement = await prisma.procurement.update({
      where: { id },
      data: updateData,
      include: {
        project: true,
        supplier: true,
        budgetItem: true
      }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: data.action === 'approve' ? 'APPROVE' : 'REJECT',
        entity: 'PROCUREMENT',
        entityId: id,
        meta: {
          materialItem: procurement.materialItem,
          reason: data.reason,
          comments: data.comments
        }
      }
    });
    
    return successResponse(
      updatedProcurement,
      `Procurement ${data.action === 'approve' ? 'approved' : 'rejected'} successfully`
    );
  } catch (error) {
    return errorResponse(error);
  }
}