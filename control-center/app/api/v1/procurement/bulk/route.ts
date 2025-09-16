import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { bulkOperationSchema } from '@/lib/validations/procurement';

// POST /api/v1/procurement/bulk - Perform bulk operations
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const body = await request.json();
    const data = bulkOperationSchema.parse(body);
    
    let result;
    
    switch (data.operation) {
      case 'approve': {
        result = await prisma.procurement.updateMany({
          where: {
            id: { in: data.ids },
            orderStatus: 'QUOTED'
          },
          data: {
            orderStatus: 'APPROVED',
            approvedBy: authUser.uid,
            approvedAt: new Date(),
            updatedBy: authUser.uid,
            updatedAt: new Date()
          }
        });
        
        // Update budget commitments
        const procurements = await prisma.procurement.findMany({
          where: { id: { in: data.ids } },
          select: { budgetItemId: true, totalCost: true }
        });
        
        for (const proc of procurements) {
          if (proc.budgetItemId && proc.totalCost) {
            await prisma.budgetItem.update({
              where: { id: proc.budgetItemId },
              data: {
                committedTotal: {
                  increment: Number(proc.totalCost)
                },
                status: 'COMMITTED'
              }
            });
          }
        }
        break;
      }
      
      case 'reject': {
        result = await prisma.procurement.updateMany({
          where: {
            id: { in: data.ids },
            orderStatus: 'QUOTED'
          },
          data: {
            orderStatus: 'DRAFT',
            rejectedBy: authUser.uid,
            rejectedAt: new Date(),
            rejectionReason: data.data?.reason,
            updatedBy: authUser.uid,
            updatedAt: new Date()
          }
        });
        break;
      }
      
      case 'delete': {
        // Only delete DRAFT items
        result = await prisma.procurement.deleteMany({
          where: {
            id: { in: data.ids },
            orderStatus: 'DRAFT'
          }
        });
        break;
      }
      
      case 'updateStatus': {
        if (!data.data?.status) {
          return errorResponse('Status is required for updateStatus operation', 400);
        }
        
        result = await prisma.procurement.updateMany({
          where: { id: { in: data.ids } },
          data: {
            orderStatus: data.data.status,
            updatedBy: authUser.uid,
            updatedAt: new Date()
          }
        });
        break;
      }
      
      case 'assignSupplier': {
        if (!data.data?.supplierId) {
          return errorResponse('Supplier ID is required for assignSupplier operation', 400);
        }
        
        result = await prisma.procurement.updateMany({
          where: { id: { in: data.ids } },
          data: {
            supplierId: data.data.supplierId,
            updatedBy: authUser.uid,
            updatedAt: new Date()
          }
        });
        break;
      }
      
      case 'updatePriority': {
        if (!data.data?.priority) {
          return errorResponse('Priority is required for updatePriority operation', 400);
        }
        
        result = await prisma.procurement.updateMany({
          where: { id: { in: data.ids } },
          data: {
            priority: data.data.priority,
            updatedBy: authUser.uid,
            updatedAt: new Date()
          }
        });
        break;
      }
      
      default:
        return errorResponse(`Invalid operation: ${data.operation}`, 400);
    }
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'BULK_OPERATION',
        entity: 'PROCUREMENT',
        entityId: data.ids.join(','),
        meta: {
          operation: data.operation,
          count: result.count,
          data: data.data
        }
      }
    });
    
    return successResponse(
      { count: result.count },
      `Successfully performed ${data.operation} on ${result.count} items`
    );
  } catch (error) {
    return errorResponse(error);
  }
}