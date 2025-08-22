import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { createPaymentSchema } from '@/lib/validations/procurement';

// POST /api/v1/procurement/payments - Record a payment
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const body = await request.json();
    const data = createPaymentSchema.parse(body);
    
    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get invoice details
      const invoice = await tx.invoice.findUnique({
        where: { id: data.invoiceId }
      });
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      // Create payment
      const payment = await tx.payment.create({
        data: {
          invoiceId: data.invoiceId,
          purchaseOrderId: data.purchaseOrderId,
          amount: data.amount,
          paymentDate: new Date(data.paymentDate),
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber,
          notes: data.notes,
          processedBy: authUser.uid
        }
      });
      
      // Update invoice paid amount
      const newPaidAmount = Number(invoice.paidAmount || 0) + data.amount;
      const newStatus = newPaidAmount >= Number(invoice.amount) 
        ? 'PAID' 
        : 'PARTIAL';
      
      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus
        }
      });
      
      // Update PO paid amount
      const purchaseOrder = await tx.purchaseOrder.findUnique({
        where: { id: data.purchaseOrderId }
      });
      
      if (purchaseOrder) {
        const newPOPaidAmount = Number(purchaseOrder.paidAmount || 0) + data.amount;
        await tx.purchaseOrder.update({
          where: { id: data.purchaseOrderId },
          data: {
            paidAmount: newPOPaidAmount
          }
        });
        
        // Update budget item if linked
        if (purchaseOrder.budgetItemId) {
          const budgetItem = await tx.budgetItem.findUnique({
            where: { id: purchaseOrder.budgetItemId }
          });
          
          if (budgetItem) {
            await tx.budgetItem.update({
              where: { id: purchaseOrder.budgetItemId },
              data: {
                paidToDate: Number(budgetItem.paidToDate) + data.amount,
                status: 'PAID'
              }
            });
          }
        }
      }
      
      return payment;
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'CREATE',
        entity: 'PAYMENT',
        entityId: result.id,
        meta: {
          invoiceId: data.invoiceId,
          amount: data.amount,
          method: data.paymentMethod
        }
      }
    });
    
    return successResponse(result, 'Payment recorded successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

// GET /api/v1/procurement/payments - List payments
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const vendorId = searchParams.get('vendorId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const where: any = {};
    
    if (projectId) {
      where.purchaseOrder = { projectId };
    }
    
    if (vendorId) {
      where.invoice = { vendorId };
    }
    
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }
    
    const payments = await prisma.payment.findMany({
      where,
      include: {
        invoice: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });
    
    const paymentsWithDetails = payments.map(payment => ({
      ...payment,
      vendorName: payment.invoice.vendor.name,
      projectName: payment.purchaseOrder.project?.name,
      invoiceNumber: payment.invoice.invoiceNumber
    }));
    
    return successResponse(paymentsWithDetails);
  } catch (error) {
    return errorResponse(error);
  }
}