import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/api/auth-check';
import { successResponse, errorResponse, ApiError } from '@/lib/api/response';
import { updateContactSchema } from '@/lib/validations/contact';

// GET /api/v1/contacts/[id] - Get single contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        assignedTasks: {
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(['ADMIN', 'STAFF']);
    const { id } = await params;
    const body = await request.json();
    const data = updateContactSchema.parse({ ...body, id });
    
    const existingContact = await prisma.contact.findUnique({
      where: { id }
    });
    
    if (!existingContact) {
      throw new ApiError(404, 'Contact not found');
    }
    
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name: data.name,
        emails: data.email ? [data.email] : undefined,
        phones: data.phone ? [data.phone] : undefined,
        company: data.company,
        category: data.category,
        status: data.status,
        notes: data.notes
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        assignedTasks: {
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
        entity: 'CONTACT',
        entityId: contact.id,
        meta: {
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(['ADMIN']);
    const { id } = await params;
    
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!contact) {
      throw new ApiError(404, 'Contact not found');
    }
    
    // Check if contact is referenced in any tasks
    const tasksWithContact = await prisma.task.findMany({
      where: {
        relatedContactIds: {
          has: id
        }
      }
    });
    
    if (tasksWithContact.length > 0) {
      throw new ApiError(400, 'Cannot delete contact that is referenced in tasks');
    }
    
    await prisma.contact.delete({
      where: { id }
    });
    
    // Log activity
    await prisma.auditLog.create({
      data: {
        userId: authUser.uid,
        action: 'DELETE',
        entity: 'CONTACT',
        entityId: id,
        meta: {
          deletedContact: contact
        }
      }
    });
    
    return successResponse(null, 'Contact deleted successfully');
  } catch (error) {
    return errorResponse(error);
  }
}