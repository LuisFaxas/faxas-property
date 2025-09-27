import { NextRequest, NextResponse } from 'next/server';
import { setCustomClaims } from '@/lib/auth';
import { Role } from '@prisma/client';
import { z } from 'zod';

const setClaimsSchema = z.object({
  uid: z.string(),
  role: z.enum(['ADMIN', 'STAFF', 'CONTRACTOR', 'VIEWER'])
});

export async function POST(req: NextRequest) {
  try {
    // Check webhook secret
    const webhookSecret = req.headers.get('x-webhook-secret');
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { uid, role } = setClaimsSchema.parse(body);

    const success = await setCustomClaims(uid, { role: role as Role });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to set custom claims' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Custom claims set for user ${uid}`,
      role
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error('Error in set-claims route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Force Node.js runtime for Firebase Admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';