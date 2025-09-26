import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { adminAuth } from '@/lib/firebaseAdmin';
import { applyAccessPreset } from '@/lib/access';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const inviteContractorSchema = z.object({
  projectId: z.string(),
  contactId: z.string(),
  email: z.string().email(),
  name: z.string(),
  preset: z.enum(['FIELD_CONTRACTOR', 'SUPPLIER', 'VIEWER'])
});

export async function POST(req: NextRequest) {
  try {
    // Skip during build
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({ error: 'Build phase' }, { status: 503 });
    }

    // Check if Firebase Admin is available
    const auth = adminAuth();
    if (!auth) {
      return NextResponse.json(
        { error: 'Firebase Admin not available' },
        { status: 503 }
      );
    }

    // Verify admin role
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { projectId, contactId, email, name, preset } = inviteContractorSchema.parse(body);

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId }
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    let firebaseUser;
    
    // Try to get existing user or create new one
    try {
      firebaseUser = await auth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create new Firebase user
        firebaseUser = await auth.createUser({
          email,
          displayName: name,
          emailVerified: false
        });
      } else {
        throw error;
      }
    }

    // Set custom claims
    await auth.setCustomUserClaims(firebaseUser.uid, {
      role: 'CONTRACTOR'
    });

    // Create or update user in database
    await prisma.user.upsert({
      where: { id: firebaseUser.uid },
      update: {
        email,
        role: 'CONTRACTOR'
      },
      create: {
        id: firebaseUser.uid,
        email,
        role: 'CONTRACTOR'
      }
    });

    // Link contact to user
    await prisma.contact.update({
      where: { id: contactId },
      data: { userId: firebaseUser.uid }
    });

    // Apply access preset
    await applyAccessPreset(firebaseUser.uid, projectId, preset);

    // Generate password reset link
    const resetLink = await auth.generatePasswordResetLink(email);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.uid,
        action: 'INVITE_CONTRACTOR',
        entity: 'User',
        entityId: firebaseUser.uid,
        meta: {
          projectId,
          contactId,
          email,
          name,
          preset
        }
      }
    });

    return NextResponse.json({
      ok: true,
      userId: firebaseUser.uid,
      resetLink,
      message: 'Contractor invited successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error('Error inviting contractor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}