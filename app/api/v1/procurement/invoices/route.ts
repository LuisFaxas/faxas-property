import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse, paginationMetadata } from '@/lib/api/response';
import { createInvoiceSchema } from '@/lib/validations/procurement';

// GET /api/v1/procurement/invoices - List invoices
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const projectId = searchParams.get('projectId');
    const vendorId = searchParams.get('vendorId');
    const status = searchParams.get('status');
    
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;
    
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          },
          purchaseOrder: {
            select: {
              id: true,
              poNumber: true
            }
          },
          payments: true
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.invoice.count({ where })
    ]);
    
    // Calculate payment details
    const invoicesWithDetails = invoices.map(invoice => {
      const totalPaid = invoice.payments.reduce(
        (sum, payment) => sum + Number(payment.amount), 
        0
      );
      const balanceDue = Number(invoice.amount) - totalPaid;
      const isOverdue = invoice.status === 'PENDING' && new Date(invoice.dueDate) < new Date();
      
      return {
        ...invoice,
        totalPaid,
        balanceDue,
        isOverdue,
        daysOverdue: isOverdue 
          ? Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0
      };
    });
    
    return successResponse(
      invoicesWithDetails,
      undefined,
      paginationMetadata(page, limit, total)
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/v1/procurement/invoices - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const body = await request.json();
    const data = createInvoiceSchema.parse(body);
    
    // Check if PO exists
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: data.purchaseOrderId }
    });
    
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }
    
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        purchaseOrderId: data.purchaseOrderId,
        vendorId: data.vendorId,
        projectId: data.projectId,
        invoiceDate: new Date(data.invoiceDate),
        dueDate: new Date(data.dueDate),
        amount: data.amount,
        paidAmount: data.paidAmount || 0,
        status: data.status,
        notes: data.notes
      },
      include: {
        vendor: true,
        project: true,
        purchaseOrder: true
      }
    });
    
    // Update PO status if needed
    if (purchaseOrder.status === 'APPROVED') {
      await prisma.purchaseOrder.update({
        where: { id: data.purchaseOrderId },
        data: { status: 'ISSUED' }
      });
    }
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'CREATE',
        entity: 'INVOICE',
        entityId: invoice.id,
        meta: {
          invoiceNumber: invoice.invoiceNumber,
          vendor: invoice.vendor.name,
          amount: invoice.amount
        }
      }
    });
    
    return successResponse(invoice, 'Invoice created successfully');
  } catch (error) {
    return errorResponse(error);
  }
}