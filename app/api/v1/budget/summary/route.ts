import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';

// GET /api/v1/budget/summary - Get budget summary statistics
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    
    const where = projectId ? { projectId } : {};
    
    const budgetItems = await prisma.budgetItem.findMany({
      where
    });
    
    // Calculate totals
    const totalBudget = budgetItems.reduce((sum, item) => sum + Number(item.estTotal), 0);
    const totalCommitted = budgetItems.reduce((sum, item) => sum + Number(item.committedTotal), 0);
    const totalPaid = budgetItems.reduce((sum, item) => sum + Number(item.paidToDate), 0);
    const totalVariance = totalPaid - totalBudget;
    const variancePercent = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;
    
    // Count items by status
    const statusCounts = {
      budgeted: budgetItems.filter(item => item.status === 'BUDGETED').length,
      committed: budgetItems.filter(item => item.status === 'COMMITTED').length,
      paid: budgetItems.filter(item => item.status === 'PAID').length
    };
    
    // Find over-budget items
    const overBudgetItems = budgetItems.filter(item => 
      Number(item.paidToDate) > Number(item.estTotal)
    );
    
    // Group by discipline for breakdown
    const disciplineBreakdown = budgetItems.reduce((acc, item) => {
      const discipline = item.discipline;
      if (!acc[discipline]) {
        acc[discipline] = {
          budget: 0,
          committed: 0,
          paid: 0,
          items: 0
        };
      }
      acc[discipline].budget += Number(item.estTotal);
      acc[discipline].committed += Number(item.committedTotal);
      acc[discipline].paid += Number(item.paidToDate);
      acc[discipline].items += 1;
      return acc;
    }, {} as Record<string, any>);
    
    const summary = {
      totalBudget,
      totalCommitted,
      totalPaid,
      totalActual: totalPaid, // For compatibility
      totalVariance,
      variancePercent,
      remainingBudget: totalBudget - totalPaid,
      commitmentRate: totalBudget > 0 ? (totalCommitted / totalBudget) * 100 : 0,
      spendRate: totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0,
      itemCount: budgetItems.length,
      overBudgetCount: overBudgetItems.length,
      statusCounts,
      disciplineBreakdown,
      categories: Object.entries(disciplineBreakdown).map(([key, value]: [string, any]) => ({
        category: key,
        budgetAmount: value.budget,
        committedAmount: value.committed,
        actualAmount: value.paid,
        variance: value.paid - value.budget,
        items: value.items
      })),
      topOverBudgetItems: overBudgetItems
        .sort((a, b) => {
          const aVariance = Number(a.paidToDate) - Number(a.estTotal);
          const bVariance = Number(b.paidToDate) - Number(b.estTotal);
          return bVariance - aVariance;
        })
        .slice(0, 5)
        .map(item => ({
          id: item.id,
          item: item.item,
          discipline: item.discipline,
          category: item.category,
          budget: Number(item.estTotal),
          paid: Number(item.paidToDate),
          variance: Number(item.paidToDate) - Number(item.estTotal),
          variancePercent: Number(item.estTotal) > 0 
            ? ((Number(item.paidToDate) - Number(item.estTotal)) / Number(item.estTotal)) * 100
            : 0
        }))
    };
    
    return successResponse(summary);
  } catch (error) {
    return errorResponse(error);
  }
}