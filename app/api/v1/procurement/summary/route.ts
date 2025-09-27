import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';

// GET /api/v1/procurement/summary - Get procurement summary statistics
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const projectId = request.nextUrl.searchParams.get('projectId');
    
    const where = projectId ? { projectId } : {};
    
    // Get procurement statistics
    const [total, byStatus, recentItems] = await Promise.all([
      // Total count
      prisma.procurement.count({ where }),
      
      // Count by status
      prisma.procurement.groupBy({
        by: ['orderStatus'],
        where,
        _count: true
      }),
      
      // Recent items
      prisma.procurement.findMany({
        where,
        take: 5,
        orderBy: { requiredBy: 'desc' },
        include: {
          project: {
            select: {
              name: true
            }
          }
        }
      })
    ]);
    
    // Calculate overdue items
    const overdueItems = await prisma.procurement.count({
      where: {
        ...where,
        orderStatus: {
          in: ['QUOTED', 'ORDERED']
        },
        requiredBy: {
          lt: new Date()
        }
      }
    });
    
    // Format status breakdown
    const statusBreakdown = {
      quoted: 0,
      ordered: 0,
      delivered: 0,
      installed: 0
    };
    
    byStatus.forEach(item => {
      const status = item.orderStatus.toLowerCase();
      if (status in statusBreakdown) {
        statusBreakdown[status as keyof typeof statusBreakdown] = item._count;
      }
    });
    
    return successResponse({
      total,
      statusBreakdown,
      overdueItems,
      recentItems: recentItems.map(item => ({
        ...item,
        quantity: item.quantity ? Number(item.quantity) : 0
      }))
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// Force Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';