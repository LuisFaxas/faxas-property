import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';

// GET /api/v1/budget/exceptions - Get budget items that are over budget
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const projectId = request.nextUrl.searchParams.get('projectId');
    
    const exceptions = await prisma.budgetItem.findMany({
      where: {
        ...(projectId && { projectId }),
        OR: [
          {
            actualAmount: {
              gt: prisma.budgetItem.fields.budgetAmount
            }
          },
          {
            committedAmount: {
              gt: prisma.budgetItem.fields.budgetAmount
            }
          }
        ]
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        actualAmount: 'desc'
      }
    });
    
    // Calculate variance details
    const exceptionsWithDetails = exceptions.map(item => {
      const variance = item.actualAmount - item.budgetAmount;
      const variancePercent = item.budgetAmount > 0 
        ? (variance / item.budgetAmount) * 100
        : 0;
        
      return {
        ...item,
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