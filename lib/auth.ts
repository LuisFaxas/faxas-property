import { getAdminAuth } from './firebase-admin-singleton';
import { DecodedIdToken } from 'firebase-admin/auth';
import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';

export interface AuthUser {
  uid: string;
  email: string;
  role: Role;
}

export async function verifyIdToken(authorizationHeader: string | null): Promise<AuthUser | null> {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  const idToken = authorizationHeader.split('Bearer ')[1];

  try {
    const adminAuth = await getAdminAuth();
    const decodedToken: DecodedIdToken = await adminAuth.verifyIdToken(idToken);
    
    const role = decodedToken.role || 'VIEWER';
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: role as Role
    };
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
}

export function requireRole(allowedRoles: Role[]) {
  return async function middleware(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const user = await verifyIdToken(authHeader);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }
    
    return user;
  };
}

export async function getUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get('authorization');
  return verifyIdToken(authHeader);
}

export async function setCustomClaims(uid: string, claims: { role: Role }) {
  try {
    await adminAuth().setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('Error setting custom claims:', error);
    return false;
  }
}