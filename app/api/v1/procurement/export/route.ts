import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth-check';
import { successResponse, errorResponse } from '@/lib/api/response';
import { exportSchema } from '@/lib/validations/procurement';
import { Prisma } from '@prisma/client';

// GET /api/v1/procurement/export - Export procurement data
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = exportSchema.parse(searchParams);
    
    // Build where clause from filters
    const where: Prisma.ProcurementWhereInput = {};
    if (query.filters) {
      const filters = query.filters;
      Object.assign(where, {
        ...(filters.projectId && { projectId: filters.projectId }),
        ...(filters.supplierId && { supplierId: filters.supplierId }),
        ...(filters.orderStatus && { orderStatus: filters.orderStatus }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.discipline && { discipline: filters.discipline }),
        ...(filters.phase && { phase: filters.phase }),
        ...(filters.category && { category: filters.category }),
        ...(filters.search && {
          OR: [
            { materialItem: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
            { poNumber: { contains: filters.search, mode: 'insensitive' } }
          ]
        })
      });
    }
    
    // Fetch procurement data
    const procurements = await prisma.procurement.findMany({
      where,
      include: {
        project: {
          select: { name: true }
        },
        supplier: {
          select: { name: true, company: true }
        },
        budgetItem: {
          select: { item: true, discipline: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Default columns if not specified
    const columns = query.columns || [
      'poNumber',
      'materialItem',
      'description',
      'quantity',
      'unitPrice',
      'totalCost',
      'discipline',
      'phase',
      'requiredBy',
      'orderStatus',
      'priority',
      'supplier',
      'project'
    ];
    
    // Format data based on export format
    let exportData: any;
    
    if (query.format === 'csv') {
      // Build CSV
      const headers = columns.join(',');
      const rows = procurements.map(p => {
        return columns.map(col => {
          switch (col) {
            case 'project':
              return p.project?.name || '';
            case 'supplier':
              return p.supplier?.name || '';
            case 'quantity':
              return p.quantity?.toString() || '0';
            case 'unitPrice':
              return p.unitPrice?.toString() || '0';
            case 'totalCost':
              return p.totalCost?.toString() || '0';
            case 'requiredBy':
              return new Date(p.requiredBy).toLocaleDateString();
            case 'eta':
              return p.eta ? new Date(p.eta).toLocaleDateString() : '';
            case 'actualDelivery':
              return p.actualDelivery ? new Date(p.actualDelivery).toLocaleDateString() : '';
            default:
              return (p as any)[col] || '';
          }
        }).map(val => `"${val}"`).join(',');
      });
      
      exportData = [headers, ...rows].join('\n');
      
      return new Response(exportData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=procurement-${Date.now()}.csv`
        }
      });
    } else if (query.format === 'excel') {
      // For Excel, we'll return JSON that frontend can convert
      exportData = {
        headers: columns,
        data: procurements.map(p => {
          const row: any = {};
          columns.forEach(col => {
            switch (col) {
              case 'project':
                row[col] = p.project?.name || '';
                break;
              case 'supplier':
                row[col] = p.supplier?.name || '';
                break;
              case 'quantity':
                row[col] = Number(p.quantity) || 0;
                break;
              case 'unitPrice':
                row[col] = Number(p.unitPrice) || 0;
                break;
              case 'totalCost':
                row[col] = Number(p.totalCost) || 0;
                break;
              case 'requiredBy':
                row[col] = new Date(p.requiredBy).toLocaleDateString();
                break;
              case 'eta':
                row[col] = p.eta ? new Date(p.eta).toLocaleDateString() : '';
                break;
              case 'actualDelivery':
                row[col] = p.actualDelivery ? new Date(p.actualDelivery).toLocaleDateString() : '';
                break;
              default:
                row[col] = (p as any)[col] || '';
            }
          });
          return row;
        })
      };
      
      return successResponse(exportData);
    } else if (query.format === 'pdf') {
      // For PDF, return structured data that frontend can format
      exportData = {
        title: 'Procurement Report',
        date: new Date().toLocaleDateString(),
        summary: {
          total: procurements.length,
          totalValue: procurements.reduce((sum, p) => sum + (Number(p.totalCost) || 0), 0),
          byStatus: procurements.reduce((acc, p) => {
            acc[p.orderStatus] = (acc[p.orderStatus] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        },
        items: procurements.map(p => ({
          poNumber: p.poNumber,
          materialItem: p.materialItem,
          description: p.description,
          quantity: Number(p.quantity),
          unitPrice: Number(p.unitPrice),
          totalCost: Number(p.totalCost),
          discipline: p.discipline,
          phase: p.phase,
          requiredBy: new Date(p.requiredBy).toLocaleDateString(),
          orderStatus: p.orderStatus,
          priority: p.priority,
          supplier: p.supplier?.name || '',
          project: p.project?.name || ''
        }))
      };
      
      return successResponse(exportData);
    }
    
    return errorResponse('Invalid export format', 400);
  } catch (error) {
    return errorResponse(error);
  }
}