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
        actualAmount: {
          gt: prisma.budgetItem.fields.budgetAmount
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
          { name: 'asc' }
        ]
      }),
      prisma.budgetItem.count({ where })
    ]);
    
    // Calculate variance for each item
    const itemsWithVariance = items.map(item => ({
      ...item,
      variance: item.actualAmount - item.budgetAmount,
      variancePercent: item.budgetAmount > 0 
        ? ((item.actualAmount - item.budgetAmount) / item.budgetAmount) * 100
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
        name: data.name,
        category: data.category,
        budgetAmount: data.budgetAmount,
        committedAmount: data.committedAmount,
        actualAmount: data.actualAmount,
        status: data.status,
        notes: data.notes,
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
        entityType: 'BUDGET_ITEM',
        entityId: budgetItem.id,
        metadata: {
          name: budgetItem.name,
          category: budgetItem.category,
          amount: budgetItem.budgetAmount
        }
      }
    });
    
    return successResponse(budgetItem, 'Budget item created successfully');
  } catch (error) {
    return errorResponse(error);
  }
}