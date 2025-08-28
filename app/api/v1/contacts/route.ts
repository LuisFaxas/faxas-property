import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, paginationMetadata } from '@/lib/api/response';
import { createContactSchema, contactQuerySchema } from '@/lib/validations/contact';
import { Prisma, Module } from '@prisma/client';
import { withAuth, type SecurityContext } from '@/lib/api/auth-wrapper';
import { Policy } from '@/lib/policy';
import { createSecurityContext, createRepositories } from '@/lib/data';

// GET /api/v1/contacts - List contacts with filters
export const GET = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth, projectId } = security;
      
      // Use policy engine to verify access
      await Policy.assertModuleAccess(auth.user.id, projectId!, Module.CONTACTS, 'read');
      
      // Create scoped context and repositories
      const scopedContext = await createSecurityContext(auth.user.id, projectId!);
      const repos = createRepositories(scopedContext);
      
      const searchParams = Object.fromEntries(request.nextUrl.searchParams);
      const query = contactQuerySchema.parse(searchParams);
    
    // Build where clause - projectId is automatically enforced by repository
    const where: any = {
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
    
    // Use scoped repository for data access
    const [contacts, total] = await Promise.all([
      repos.contacts.findMany({
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
      repos.contacts.count({ where })
    ]);
    
    // Apply rate limiting based on role
    const rateLimitTier = await Policy.getRateLimitTier(auth.user.id);
    
    return successResponse(
      contacts,
      undefined,
      paginationMetadata(query.page, query.limit, total)
    );
    } catch (error) {
      return errorResponse(error);
    }
  },
  {
    module: Module.CONTACTS,
    action: 'view',
    requireProject: true
  }
);

// POST /api/v1/contacts - Create new contact
export const POST = withAuth(
  async (request: NextRequest, ctx: any, security: SecurityContext) => {
    try {
      const { auth, projectId } = security;
      
      // Use policy engine to verify write access
      await Policy.assertModuleAccess(auth.user.id, projectId!, Module.CONTACTS, 'write');
      
      // Create scoped context and repositories
      const scopedContext = await createSecurityContext(auth.user.id, projectId!);
      const repos = createRepositories(scopedContext);
      
      const body = await request.json();
      const data = createContactSchema.parse(body);
    
    // Create contact using scoped repository
    const contact = await repos.contacts.create({
      data: {
        name: data.name,
        emails: data.email ? [data.email] : [],
        phones: data.phone ? [data.phone] : [],
        company: data.company,
        category: data.category || 'GENERAL',
        specialty: data.specialty,
        status: data.status || 'ACTIVE',
        notes: data.notes,
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
        entity: 'CONTACT',
        entityId: contact.id,
        meta: {
          name: contact.name,
          category: contact.category
        }
      }
    });
    
    // Log policy decision for audit
    await Policy.logPolicyDecision(
      auth.user.id,
      projectId!,
      Module.CONTACTS,
      'write',
      true,
      'Contact created successfully'
    );
    
    return successResponse(contact, 'Contact created successfully');
    } catch (error) {
      return errorResponse(error);
    }
  },
  {
    module: Module.CONTACTS,
    action: 'edit',
    requireProject: true,
    roles: ['ADMIN', 'STAFF']
  }
);

// Export runtime for Firebase Admin
export const runtime = 'nodejs';