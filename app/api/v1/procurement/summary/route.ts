import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';

// GET /api/v1/procurement/summary - Get procurement summary statistics
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    
    const where = projectId ? { projectId } : {};
    
    const [purchaseOrders, invoices, payments] = await Promise.all([
      prisma.purchaseOrder.findMany({ where }),
      prisma.invoice.findMany({ 
        where: projectId ? { purchaseOrder: { projectId } } : {} 
      }),
      prisma.payment.findMany({ 
        where: projectId ? { purchaseOrder: { projectId } } : {} 
      })
    ]);
    
    // Calculate PO statistics
    const totalPOs = purchaseOrders.length;
    const totalPOAmount = purchaseOrders.reduce((sum, po) => sum + Number(po.totalAmount), 0);
    
    const posByStatus = purchaseOrders.reduce((acc, po) => {
      acc[po.status] = (acc[po.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate invoice statistics
    const totalInvoices = invoices.length;
    const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalPaidAmount = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
    const outstandingAmount = totalInvoiceAmount - totalPaidAmount;
    
    const overdueInvoices = invoices.filter(inv => 
      inv.status === 'PENDING' && new Date(inv.dueDate) < new Date()
    );
    
    // Calculate payment statistics
    const totalPayments = payments.length;
    const totalPaymentAmount = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
    
    // Group by vendor
    const vendorBreakdown = await prisma.purchaseOrder.groupBy({
      by: ['vendorId'],
      where,
      _sum: {
        totalAmount: true
      },
      _count: true
    });
    
    // Get vendor details
    const vendorIds = vendorBreakdown.map(v => v.vendorId);
    const vendors = await prisma.vendor.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, name: true }
    });
    
    const vendorMap = new Map(vendors.map(v => [v.id, v.name]));
    const topVendors = vendorBreakdown
      .map(v => ({
        vendorId: v.vendorId,
        vendorName: vendorMap.get(v.vendorId) || 'Unknown',
        orderCount: v._count,
        totalAmount: Number(v._sum.totalAmount || 0)
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
    
    // Monthly spending trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlySpending = await prisma.purchaseOrder.groupBy({
      by: ['createdAt'],
      where: {
        ...where,
        createdAt: { gte: sixMonthsAgo }
      },
      _sum: {
        totalAmount: true
      }
    });
    
    // Group by month
    const spendingByMonth = monthlySpending.reduce((acc, po) => {
      const month = new Date(po.createdAt).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + Number(po._sum.totalAmount || 0);
      return acc;
    }, {} as Record<string, number>);
    
    // Recent activity
    const recentPOs = await prisma.purchaseOrder.findMany({
      where,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: {
          select: { name: true }
        }
      }
    });
    
    const summary = {
      overview: {
        totalPOs,
        totalPOAmount,
        averagePOAmount: totalPOs > 0 ? totalPOAmount / totalPOs : 0,
        pendingApproval: posByStatus['PENDING'] || 0,
        approved: posByStatus['APPROVED'] || 0,
        issued: posByStatus['ISSUED'] || 0
      },
      invoices: {
        total: totalInvoices,
        totalAmount: totalInvoiceAmount,
        paidAmount: totalPaidAmount,
        outstandingAmount,
        overdueCount: overdueInvoices.length,
        overdueAmount: overdueInvoices.reduce((sum, inv) => 
          sum + (Number(inv.amount) - Number(inv.paidAmount || 0)), 0
        )
      },
      payments: {
        total: totalPayments,
        totalAmount: totalPaymentAmount,
        averagePayment: totalPayments > 0 ? totalPaymentAmount / totalPayments : 0
      },
      statusBreakdown: Object.entries(posByStatus).map(([status, count]) => ({
        status,
        count,
        percentage: totalPOs > 0 ? (count / totalPOs) * 100 : 0
      })),
      topVendors,
      monthlySpending: Object.entries(spendingByMonth).map(([month, amount]) => ({
        month,
        amount
      })).sort((a, b) => a.month.localeCompare(b.month)),
      recentActivity: recentPOs.map(po => ({
        id: po.id,
        poNumber: po.poNumber,
        vendorName: po.vendor.name,
        amount: Number(po.totalAmount),
        status: po.status,
        createdAt: po.createdAt
      }))
    };
    
    return successResponse(summary);
  } catch (error) {
    return errorResponse(error);
  }
}