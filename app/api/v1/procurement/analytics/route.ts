import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { analyticsQuerySchema } from '@/lib/validations/procurement';
import { Prisma } from '@prisma/client';

// GET /api/v1/procurement/analytics - Get procurement analytics
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = analyticsQuerySchema.parse(searchParams);
    
    // Build where clause
    const where: Prisma.ProcurementWhereInput = {
      ...(query.projectId && { projectId: query.projectId }),
      ...((query.startDate || query.endDate) && {
        createdAt: {
          ...(query.startDate && { gte: new Date(query.startDate) }),
          ...(query.endDate && { lte: new Date(query.endDate) })
        }
      })
    };
    
    // Default metrics if not specified
    const metrics = query.metrics || ['count', 'totalCost'];
    
    // Get base statistics
    const [
      totalItems,
      procurements,
      statusCounts,
      categoryCounts,
      priorityCounts
    ] = await Promise.all([
      prisma.procurement.count({ where }),
      prisma.procurement.findMany({
        where,
        select: {
          totalCost: true,
          leadTimeDays: true,
          orderStatus: true,
          priority: true,
          category: true,
          discipline: true,
          phase: true,
          requiredBy: true,
          actualDelivery: true,
          createdAt: true,
          supplierId: true
        }
      }),
      prisma.procurement.groupBy({
        by: ['orderStatus'],
        where,
        _count: true
      }),
      prisma.procurement.groupBy({
        by: ['category'],
        where: { ...where, category: { not: null } },
        _count: true
      }),
      prisma.procurement.groupBy({
        by: ['priority'],
        where: { ...where, priority: { not: null } },
        _count: true
      })
    ]);
    
    // Calculate metrics
    const totalCost = procurements.reduce((sum, p) => 
      sum + (p.totalCost ? Number(p.totalCost) : 0), 0
    );
    
    const avgCost = totalItems > 0 ? totalCost / totalItems : 0;
    
    const avgLeadTime = procurements.reduce((sum, p) => 
      sum + (p.leadTimeDays || 0), 0
    ) / (totalItems || 1);
    
    // Calculate on-time delivery rate
    const deliveredItems = procurements.filter(p => 
      p.orderStatus === 'DELIVERED' || p.orderStatus === 'INSTALLED'
    );
    const onTimeDeliveries = deliveredItems.filter(p => {
      if (!p.actualDelivery) return false;
      return new Date(p.actualDelivery) <= new Date(p.requiredBy);
    });
    const onTimeDeliveryRate = deliveredItems.length > 0
      ? (onTimeDeliveries.length / deliveredItems.length) * 100
      : 0;
    
    // Group by analysis if requested
    let groupedData = null;
    if (query.groupBy) {
      switch (query.groupBy) {
        case 'supplier':
          const supplierGroups = await prisma.procurement.groupBy({
            by: ['supplierId'],
            where: { ...where, supplierId: { not: null } },
            _count: true,
            _sum: { totalCost: true },
            _avg: { leadTimeDays: true }
          });
          
          // Get supplier details
          const supplierIds = supplierGroups.map(g => g.supplierId).filter(Boolean) as string[];
          const suppliers = await prisma.contact.findMany({
            where: { id: { in: supplierIds } },
            select: { id: true, name: true, company: true }
          });
          
          groupedData = supplierGroups.map(group => ({
            supplier: suppliers.find(s => s.id === group.supplierId),
            count: group._count,
            totalCost: group._sum.totalCost ? Number(group._sum.totalCost) : 0,
            avgLeadTime: group._avg.leadTimeDays || 0
          }));
          break;
          
        case 'discipline':
          const disciplineGroups = await prisma.procurement.groupBy({
            by: ['discipline'],
            where,
            _count: true,
            _sum: { totalCost: true }
          });
          groupedData = disciplineGroups.map(group => ({
            discipline: group.discipline,
            count: group._count,
            totalCost: group._sum.totalCost ? Number(group._sum.totalCost) : 0
          }));
          break;
          
        case 'phase':
          const phaseGroups = await prisma.procurement.groupBy({
            by: ['phase'],
            where,
            _count: true,
            _sum: { totalCost: true }
          });
          groupedData = phaseGroups.map(group => ({
            phase: group.phase,
            count: group._count,
            totalCost: group._sum.totalCost ? Number(group._sum.totalCost) : 0
          }));
          break;
          
        case 'category':
          groupedData = categoryCounts.map(group => ({
            category: group.category,
            count: group._count
          }));
          break;
          
        case 'status':
          groupedData = statusCounts.map(group => ({
            status: group.orderStatus,
            count: group._count
          }));
          break;
          
        case 'month':
          // Group by month for trend analysis
          const monthlyData: Record<string, any> = {};
          procurements.forEach(p => {
            const month = new Date(p.createdAt).toISOString().slice(0, 7);
            if (!monthlyData[month]) {
              monthlyData[month] = { month, count: 0, totalCost: 0 };
            }
            monthlyData[month].count++;
            monthlyData[month].totalCost += p.totalCost ? Number(p.totalCost) : 0;
          });
          groupedData = Object.values(monthlyData).sort((a, b) => 
            a.month.localeCompare(b.month)
          );
          break;
      }
    }
    
    // Build response
    const analytics = {
      summary: {
        totalItems,
        totalCost,
        avgCost,
        avgLeadTime,
        onTimeDeliveryRate
      },
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item.orderStatus] = item._count;
        return acc;
      }, {} as Record<string, number>),
      categoryBreakdown: categoryCounts.reduce((acc, item) => {
        if (item.category) acc[item.category] = item._count;
        return acc;
      }, {} as Record<string, number>),
      priorityBreakdown: priorityCounts.reduce((acc, item) => {
        if (item.priority) acc[item.priority] = item._count;
        return acc;
      }, {} as Record<string, number>),
      ...(groupedData && { groupedData })
    };
    
    return successResponse(analytics);
  } catch (error) {
    return errorResponse(error);
  }
}

// Force Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';