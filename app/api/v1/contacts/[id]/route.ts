import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse, ApiError } from '@/lib/api/response';
import { updateContactSchema } from '@/lib/validations/contact';

// GET /api/v1/contacts/[id] - Get single contact
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
            priority: true
          }
        }
      }
    });
    
    if (!contact) {
      throw new ApiError(404, 'Contact not found');
    }
    
    return successResponse(contact);
  } catch (error) {
    return errorResponse(error);
  }
}

// PUT /api/v1/contacts/[id] - Update contact
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const body = await request.json();
    const data = updateContactSchema.parse({ ...body, id: params.id });
    
    const existingContact = await prisma.contact.findUnique({
      where: { id: params.id }
    });
    
    if (!existingContact) {
      throw new ApiError(404, 'Contact not found');
    }
    
    const contact = await prisma.contact.update({
      where: { id: params.id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        category: data.category,
        type: data.type,
        status: data.status,
        notes: data.notes,
        lastContactDate: new Date()
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'UPDATE',
        entityType: 'CONTACT',
        entityId: contact.id,
        metadata: {
          changes: {
            from: existingContact,
            to: contact
          }
        }
      }
    });
    
    return successResponse(contact, 'Contact updated successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/v1/contacts/[id] - Delete contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await requireRole(['ADMIN']);
    
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        tasks: true
      }
    });
    
    if (!contact) {
      throw new ApiError(404, 'Contact not found');
    }
    
    if (contact.tasks.length > 0) {
      throw new ApiError(400, 'Cannot delete contact with associated tasks');
    }
    
    await prisma.contact.delete({
      where: { id: params.id }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'DELETE',
        entityType: 'CONTACT',
        entityId: params.id,
        metadata: {
          deletedContact: contact
        }
      }
    });
    
    return successResponse(null, 'Contact deleted successfully');
  } catch (error) {
    return errorResponse(error);
  }
}