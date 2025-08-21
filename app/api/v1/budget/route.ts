import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse, paginationMetadata } from '@/lib/api/response';
import { createBudgetItemSchema, budgetQuerySchema } from '@/lib/validations/budget';
import { Prisma } from '@prisma/client';

// GET /api/v1/budget - List budget items with filters
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = budgetQuerySchema.parse(searchParams);
    
    const where: Prisma.BudgetItemWhereInput = {
      projectId: query.projectId,
      ...(query.category && { category: query.category }),
      ...(query.status && { status: query.status }),
      ...(query.overBudgetOnly && {
        paidToDate: {
          gt: prisma.budgetItem.fields.estTotal
        }
      })
    };
    
    const [items, total] = await Promise.all([
      prisma.budgetItem.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [
          { category: 'asc' },
          { item: 'asc' }
        ]
      }),
      prisma.budgetItem.count({ where })
    ]);
    
    // Calculate variance for each item
    const itemsWithVariance = items.map(item => ({
      ...item,
      budgetAmount: Number(item.estTotal),
      actualSpent: Number(item.paidToDate),
      variance: Number(item.paidToDate) - Number(item.estTotal),
      variancePercent: Number(item.estTotal) > 0 
        ? ((Number(item.paidToDate) - Number(item.estTotal)) / Number(item.estTotal)) * 100
        : 0
    }));
    
    return successResponse(
      itemsWithVariance,
      undefined,
      paginationMetadata(query.page, query.limit, total)
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/v1/budget - Create new budget item
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const body = await request.json();
    const data = createBudgetItemSchema.parse(body);
    
    const budgetItem = await prisma.budgetItem.create({
      data: {
        item: data.item || 'New Item',
        discipline: data.category || 'GENERAL',
        category: data.category || 'GENERAL',
        estTotal: data.budgetAmount || 0,
        committedTotal: data.committedAmount || 0,
        paidToDate: data.actualSpent || 0,
        status: data.status || 'NEW',
        projectId: data.projectId
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
        action: 'CREATE',
        entity: 'BUDGET_ITEM',
        entityId: budgetItem.id,
        meta: {
          item: budgetItem.item,
          category: budgetItem.category,
          amount: budgetItem.estTotal
        }
      }
    });
    
    return successResponse(budgetItem, 'Budget item created successfully');
  } catch (error) {
    return errorResponse(error);
  }
}