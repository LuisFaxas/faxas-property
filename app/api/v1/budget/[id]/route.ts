import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse, ApiError } from '@/lib/api/response';
import { updateBudgetItemSchema } from '@/lib/validations/budget';

// GET /api/v1/budget/[id] - Get single budget item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    
    const budgetItem = await prisma.budgetItem.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!budgetItem) {
      throw new ApiError(404, 'Budget item not found');
    }
    
    // Add calculated fields
    const itemWithVariance = {
      ...budgetItem,
      variance: Number(budgetItem.variance),
      varianceAmount: Number(budgetItem.paidToDate) - Number(budgetItem.estTotal),
      variancePercent: Number(budgetItem.estTotal) > 0 
        ? ((Number(budgetItem.paidToDate) - Number(budgetItem.estTotal)) / Number(budgetItem.estTotal)) * 100
        : 0
    };
    
    return successResponse(itemWithVariance);
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT /api/v1/budget/[id] - Update budget item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { id } = await params;
    const body = await request.json();
    const data = updateBudgetItemSchema.parse({ ...body, id });
    
    const existingItem = await prisma.budgetItem.findUnique({
      where: { id }
    });
    
    if (!existingItem) {
      throw new ApiError(404, 'Budget item not found');
    }
    
    // Calculate variance if needed
    const estTotal = data.estTotal ?? Number(existingItem.estTotal);
    const paidToDate = data.paidToDate ?? Number(existingItem.paidToDate);
    const variance = estTotal > 0 
      ? (paidToDate - estTotal) / estTotal
      : 0;
    
    const budgetItem = await prisma.budgetItem.update({
      where: { id },
      data: {
        ...(data.discipline && { discipline: data.discipline }),
        ...(data.category && { category: data.category }),
        ...(data.item && { item: data.item }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.qty !== undefined && { qty: data.qty }),
        ...(data.estUnitCost !== undefined && { estUnitCost: data.estUnitCost }),
        ...(data.estTotal !== undefined && { estTotal: data.estTotal }),
        ...(data.committedTotal !== undefined && { committedTotal: data.committedTotal }),
        ...(data.paidToDate !== undefined && { paidToDate: data.paidToDate }),
        ...(data.vendorContactId !== undefined && { vendorContactId: data.vendorContactId }),
        ...(data.status && { status: data.status }),
        variance: variance
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'UPDATE',
        entity: 'BUDGET_ITEM',
        entityId: budgetItem.id,
        meta: {
          changes: {
            from: existingItem,
            to: budgetItem
          }
        }
      }
    });
    
    return successResponse(budgetItem, 'Budget item updated successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/v1/budget/[id] - Delete budget item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(['ADMIN']);
    const { id } = await params;
    
    const budgetItem = await prisma.budgetItem.findUnique({
      where: { id }
    });
    
    if (!budgetItem) {
      throw new ApiError(404, 'Budget item not found');
    }
    
    await prisma.budgetItem.delete({
      where: { id }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'DELETE',
        entity: 'BUDGET_ITEM',
        entityId: id,
        meta: {
          deletedItem: budgetItem
        }
      }
    });
    
    return successResponse(null, 'Budget item deleted successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

// Force Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';