import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';

// GET /api/v1/budget/summary - Get budget summary for dashboard
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const projectId = request.nextUrl.searchParams.get('projectId');
    
    if (!projectId) {
      // Get the default project (Miami Duplex)
      const project = await prisma.project.findFirst();
      if (!project) {
        return successResponse({
          totalBudget: 0,
          totalCommitted: 0,
          totalActual: 0,
          totalVariance: 0,
          overBudgetCount: 0,
          categories: []
        });
      }
    }
    
    const budgetItems = await prisma.budgetItem.findMany({
      where: projectId ? { projectId } : undefined
    });
    
    const summary = {
      totalBudget: budgetItems.reduce((sum, item) => sum + item.budgetAmount, 0),
      totalCommitted: budgetItems.reduce((sum, item) => sum + item.committedAmount, 0),
      totalActual: budgetItems.reduce((sum, item) => sum + item.actualAmount, 0),
      totalVariance: 0,
      overBudgetCount: 0,
      categories: [] as any[]
    };
    
    summary.totalVariance = summary.totalActual - summary.totalBudget;
    summary.overBudgetCount = budgetItems.filter(item => item.actualAmount > item.budgetAmount).length;
    
    // Group by category
    const categoryMap = new Map();
    budgetItems.forEach(item => {
      const category = item.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          budgetAmount: 0,
          committedAmount: 0,
          actualAmount: 0,
          variance: 0,
          items: 0
        });
      }
      const cat = categoryMap.get(category);
      cat.budgetAmount += item.budgetAmount;
      cat.committedAmount += item.committedAmount;
      cat.actualAmount += item.actualAmount;
      cat.variance = cat.actualAmount - cat.budgetAmount;
      cat.items += 1;
    });
    
    summary.categories = Array.from(categoryMap.values());
    
    return successResponse(summary);
  } catch (error) {
    return errorResponse(error);
  }
}