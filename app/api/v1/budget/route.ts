import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, paginationMetadata } from '@/lib/api/response';
import { createBudgetItemSchema, budgetQuerySchema } from '@/lib/validations/budget';
import { Prisma, Module } from '@prisma/client';
import { withAuth, type SecurityContext } from '@/lib/api/auth-wrapper';

// Helper to redact cost fields for contractors
function redactCostsForContractor<T extends any>(item: T, role: string): T {
  if (role !== 'CONTRACTOR') return item;
  
  // Redact sensitive cost information for contractors
  const redacted = { ...item };
  delete redacted.estUnitCost;
  delete redacted.estTotal;
  delete redacted.committedTotal;
  delete redacted.paidToDate;
  delete redacted.variance;
  delete redacted.varianceAmount;
  delete redacted.variancePercent;
  return redacted;
}

// GET /api/v1/budget - List budget items with filters
export const GET = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    const { auth, projectId } = security;
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = budgetQuerySchema.parse(searchParams);
    
    const where: Prisma.BudgetItemWhereInput = {
      projectId: projectId!,  // Use projectId from security context
      ...(query.discipline && { discipline: query.discipline }),
      ...(query.category && { category: query.category }),
      ...(query.status && { status: query.status })
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
          { discipline: 'asc' },
          { category: 'asc' },
          { item: 'asc' }
        ]
      }),
      prisma.budgetItem.count({ where })
    ]);
    
    // Calculate variance for each item (only for non-contractors)
    const itemsWithVariance = items.map(item => ({
      ...item,
      variance: Number(item.variance),
      varianceAmount: Number(item.paidToDate) - Number(item.estTotal),
      variancePercent: Number(item.estTotal) > 0 
        ? ((Number(item.paidToDate) - Number(item.estTotal)) / Number(item.estTotal)) * 100
        : 0
    }));
    
    // Redact cost information for contractors
    const finalItems = auth.role === 'CONTRACTOR' 
      ? itemsWithVariance.map(item => redactCostsForContractor(item, auth.role))
      : itemsWithVariance;
    
    return successResponse(
      finalItems,
      undefined,
      paginationMetadata(query.page, query.limit, total)
    );
  },
  {
    module: Module.BUDGET,
    action: 'view',
    requireProject: true
  }
);

// POST /api/v1/budget - Create new budget item
export const POST = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    const { auth, projectId } = security;
    const body = await request.json();
    const data = createBudgetItemSchema.parse(body);
    
    // Calculate variance if needed
    const variance = data.estTotal > 0 
      ? (data.paidToDate - data.estTotal) / data.estTotal
      : 0;
    
    const budgetItem = await prisma.budgetItem.create({
      data: {
        discipline: data.discipline,
        category: data.category,
        item: data.item,
        unit: data.unit,
        qty: data.qty,
        estUnitCost: data.estUnitCost,
        estTotal: data.estTotal,
        committedTotal: data.committedTotal,
        paidToDate: data.paidToDate,
        vendorContactId: data.vendorContactId,
        status: data.status,
        variance: variance,
        projectId: projectId!  // Use projectId from security context
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
        userId: auth.uid,
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
  },
  {
    module: Module.BUDGET,
    action: 'edit',
    requireProject: true,
    roles: ['ADMIN', 'STAFF']
  }
);

// Export runtime for Firebase Admin
export const runtime = 'nodejs';