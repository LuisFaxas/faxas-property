import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/response';
import { z } from 'zod';
import { auth } from '@/lib/firebaseAdmin';

// Schema for accept invite request
const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
  displayName: z.string().optional(),
  phone: z.string().optional(),
});

// POST /api/v1/contacts/accept-invite - Accept portal invitation (PUBLIC)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = acceptInviteSchema.parse(body);

    // Find contact by invite token
    const contact = await prisma.contact.findFirst({
      where: {
        inviteToken: data.token,
        portalStatus: 'INVITED',
      },
      include: {
        project: true,
      }
    });

    if (!contact) {
      return errorResponse('Invalid or expired invitation', 400);
    }

    // Check if invitation has expired
    if (contact.inviteExpiry && new Date() > contact.inviteExpiry) {
      return errorResponse('Invitation has expired', 400);
    }

    // Check if contact has email
    if (!contact.emails || contact.emails.length === 0) {
      return errorResponse('Contact has no email address', 400);
    }

    const email = contact.emails[0];

    try {
      // Create Firebase user
      const userRecord = await auth.createUser({
        email,
        password: data.password,
        displayName: data.displayName || contact.name,
        emailVerified: true, // Auto-verify since they have the invite token
      });

      // Set custom claims for role
      await auth.setCustomUserClaims(userRecord.uid, {
        role: 'CONTRACTOR',
        contactId: contact.id,
        projectId: contact.projectId,
      });

      // Create User record in database
      await prisma.user.upsert({
        where: { id: userRecord.uid },
        create: {
          id: userRecord.uid,
          email,
          role: 'CONTRACTOR',
        },
        update: {
          role: 'CONTRACTOR',
        }
      });

      // Update contact with user link and activate portal
      const updatedContact = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          userId: userRecord.uid,
          portalStatus: 'ACTIVE',
          inviteToken: null, // Clear the token
          inviteExpiry: null,
          lastLoginAt: new Date(),
          lastActivityAt: new Date(),
          ...(data.phone && { phones: [data.phone] }),
        },
        include: {
          project: true,
          assignedTasks: {
            where: {
              status: {
                not: 'COMPLETED'
              }
            },
            take: 5,
            orderBy: {
              dueDate: 'asc'
            }
          }
        }
      });

      // Create default module access for contractor
      await prisma.userModuleAccess.createMany({
        data: [
          {
            userId: userRecord.uid,
            projectId: contact.projectId,
            module: 'TASKS',
            canView: true,
            canEdit: true,
          },
          {
            userId: userRecord.uid,
            projectId: contact.projectId,
            module: 'SCHEDULE',
            canView: true,
            canEdit: false,
          },
          {
            userId: userRecord.uid,
            projectId: contact.projectId,
            module: 'PLANS',
            canView: true,
            canEdit: false,
          },
          {
            userId: userRecord.uid,
            projectId: contact.projectId,
            module: 'BUDGET',
            canView: false,
            canEdit: false,
          },
        ],
        skipDuplicates: true,
      });

      // Log activity
      await prisma.auditLog.create({
        data: {
          userId: userRecord.uid,
          action: 'PORTAL_ACTIVATED',
          entity: 'CONTACT',
          entityId: contact.id,
          meta: {
            contactName: contact.name,
            email,
          }
        }
      });

      return successResponse(
        {
          contact: updatedContact,
          user: {
            id: userRecord.uid,
            email,
            role: 'CONTRACTOR',
          },
          redirectTo: '/contractor',
        },
        'Portal access activated successfully'
      );
    } catch (firebaseError: any) {
      console.error('Firebase user creation error:', firebaseError);
      
      // Handle specific Firebase errors
      if (firebaseError.code === 'auth/email-already-exists') {
        return errorResponse('An account with this email already exists', 400);
      }
      
      return errorResponse('Failed to create user account', 500);
    }
  } catch (error) {
    return errorResponse(error);
  }
}

// GET /api/v1/contacts/accept-invite - Validate invitation token (PUBLIC)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return errorResponse('Token is required', 400);
    }

    // Find contact by invite token
    const contact = await prisma.contact.findFirst({
      where: {
        inviteToken: token,
        portalStatus: 'INVITED',
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!contact) {
      return errorResponse('Invalid invitation token', 404);
    }

    // Check if invitation has expired
    if (contact.inviteExpiry && new Date() > contact.inviteExpiry) {
      return errorResponse('Invitation has expired', 400);
    }

    return successResponse({
      valid: true,
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.emails?.[0] || '',
        company: contact.company,
        project: contact.project,
      }
    });
  } catch (error) {
    return errorResponse(error);
  }
}