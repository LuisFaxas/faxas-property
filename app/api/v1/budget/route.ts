import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, paginationMetadata } from '@/lib/api/response';
import { createBudgetItemSchema, budgetQuerySchema } from '@/lib/validations/budget';
import { Prisma, Module } from '@prisma/client';
import { withAuth, type SecurityContext } from '@/lib/api/auth-wrapper';
import { Policy } from '@/lib/policy';
import { createSecurityContext, createRepositories } from '@/lib/data';

// Note: Cost redaction is now handled by the BudgetRepository in lib/data/repositories.ts

// GET /api/v1/budget - List budget items with filters
export const GET = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth, projectId } = security;
      
      // Use policy engine to verify access
      await Policy.assertModuleAccess(auth.user.id, projectId!, Module.BUDGET, 'read');
      
      // Create scoped context and repositories
      const scopedContext = await createSecurityContext(auth.user.id, projectId!);
      const repos = createRepositories(scopedContext);
      
      const searchParams = Object.fromEntries(request.nextUrl.searchParams);
      const query = budgetQuerySchema.parse(searchParams);
    
    // Build where clause - projectId is automatically enforced by repository
    const where: any = {
      ...(query.discipline && { discipline: query.discipline }),
      ...(query.category && { category: query.category }),
      ...(query.status && { status: query.status })
    };
    
    // Use scoped repository for data access - automatically handles cost redaction
    const [items, total] = await Promise.all([
      repos.budget.findMany({
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
      repos.budget.count({ where })
    ]);
    
    // Apply rate limiting based on role
    const rateLimitTier = await Policy.getRateLimitTier(auth.user.id);
    
    // BudgetRepository already handles variance calculation and cost redaction
    return successResponse(
      items,
      undefined,
      paginationMetadata(query.page, query.limit, total)
    );
    } catch (error) {
      return errorResponse(error);
    }
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
    try {
      const { auth, projectId } = security;
      
      // Use policy engine to verify write access
      await Policy.assertModuleAccess(auth.user.id, projectId!, Module.BUDGET, 'write');
      
      // Create scoped context and repositories
      const scopedContext = await createSecurityContext(auth.user.id, projectId!);
      const repos = createRepositories(scopedContext);
      
      const body = await request.json();
      const data = createBudgetItemSchema.parse(body);
    
    // Calculate variance if needed
    const variance = data.estTotal > 0 
      ? (data.paidToDate - data.estTotal) / data.estTotal
      : 0;
    
    // Create budget item using scoped repository
    const budgetItem = await repos.budget.create({
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
        projectId: projectId!  // Enforced by repository
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
    
    // Log policy decision for audit
    await Policy.logPolicyDecision(
      auth.user.id,
      projectId!,
      Module.BUDGET,
      'write',
      true,
      'Budget item created successfully'
    );
    
    return successResponse(budgetItem, 'Budget item created successfully');
    } catch (error) {
      return errorResponse(error);
    }
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