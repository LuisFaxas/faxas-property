import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';

// GET /api/v1/budget/exceptions - Get budget items that are over budget
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const projectId = request.nextUrl.searchParams.get('projectId');
    
    // First get all budget items, then filter in memory
    const allItems = await prisma.budgetItem.findMany({
      where: {
        ...(projectId && { projectId })
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
    
    // Filter for items that are over budget
    const exceptions = allItems
      .filter(item => {
        const budgetAmount = Number(item.estTotal);
        const actualAmount = Number(item.paidToDate);
        const committedAmount = Number(item.commitment) || 0;
        return actualAmount > budgetAmount || committedAmount > budgetAmount;
      })
      .sort((a, b) => Number(b.paidToDate) - Number(a.paidToDate));
    
    // Calculate variance details with correct field names
    const exceptionsWithDetails = exceptions.map(item => {
      const budgetAmount = Number(item.estTotal);
      const actualAmount = Number(item.paidToDate);
      const variance = actualAmount - budgetAmount;
      const variancePercent = budgetAmount > 0 
        ? (variance / budgetAmount) * 100
        : 0;
        
      return {
        ...item,
        budgetAmount,
        actualAmount,
        variance,
        variancePercent,
        severity: variancePercent > 20 ? 'HIGH' : variancePercent > 10 ? 'MEDIUM' : 'LOW'
      };
    });
    
    return successResponse(exceptionsWithDetails);
  } catch (error) {
    return errorResponse(error);
  }
}