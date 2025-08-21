import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse, paginationMetadata } from '@/lib/api/response';
import { createContactSchema, contactQuerySchema } from '@/lib/validations/contact';
import { Prisma } from '@prisma/client';

// GET /api/v1/contacts - List contacts with filters
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = contactQuerySchema.parse(searchParams);
    
    const where: Prisma.ContactWhereInput = {
      projectId: query.projectId,
      ...(query.category && { category: query.category }),
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { company: { contains: query.search, mode: 'insensitive' } },
          { specialty: { contains: query.search, mode: 'insensitive' } }
        ]
      })
    };
    
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [
          { name: 'asc' }
        ]
      }),
      prisma.contact.count({ where })
    ]);
    
    return successResponse(
      contacts,
      undefined,
      paginationMetadata(query.page, query.limit, total)
    );
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/v1/contacts - Create new contact
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const body = await request.json();
    const data = createContactSchema.parse(body);
    
    const contact = await prisma.contact.create({
      data: {
        name: data.name,
        emails: data.email ? [data.email] : [],
        phones: data.phone ? [data.phone] : [],
        company: data.company,
        category: data.category || 'GENERAL',
        specialty: data.specialty,
        status: data.status || 'ACTIVE',
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
        entity: 'CONTACT',
        entityId: contact.id,
        meta: {
          name: contact.name,
          category: contact.category
        }
      }
    });
    
    return successResponse(contact, 'Contact created successfully');
  } catch (error) {
    return errorResponse(error);
  }
}