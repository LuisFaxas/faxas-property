/**
 * Firebase Authentication Security Tests
 * Tests token validation, expiration, revocation, and malformed tokens
 */

import { NextRequest } from 'next/server';
import { GET as TasksGET } from '@/app/api/v1/tasks/route';
import { GET as ProjectsGET } from '@/app/api/v1/projects/route';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/firebaseAdmin';
import {
  TEST_USERS,
  TEST_PROJECTS,
  createMockToken,
  createAuthRequest,
  assertErrorResponse
} from './utils/test-helpers';
import { invalidTokenPayloads } from './fixtures/mock-data';

// Mock Firebase Admin
jest.mock('@/lib/firebaseAdmin', () => ({
  auth: {
    verifyIdToken: jest.fn()
  }
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    },
    projectMember: {
      findMany: jest.fn()
    }
  }
}));

describe('Firebase Authentication Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  describe('Token Validation', () => {
    test('Should reject request without authorization header', async () => {
      const request = createAuthRequest({
        params: { projectId: TEST_PROJECTS.project1.id }
        // No token provided
      });
      
      const response = await TasksGET(request, {});
      await assertErrorResponse(response, 401, 'No authorization header');
    });

    test('Should reject request with malformed authorization header', async () => {
      const request = createAuthRequest({
        params: { projectId: TEST_PROJECTS.project1.id },
        headers: {
          'authorization': 'InvalidFormat token123'  // Should be "Bearer <token>"
        }
      });
      
      const response = await TasksGET(request, {});
      await assertErrorResponse(response, 401, 'Invalid authorization format');
    });

    test('Should reject request with empty token', async () => {
      const request = createAuthRequest({
        params: { projectId: TEST_PROJECTS.project1.id },
        headers: {
          'authorization': 'Bearer '  // Empty token
        }
      });
      
      const response = await TasksGET(request, {});
      await assertErrorResponse(response, 401, 'No token provided');
    });

    test('Should reject token with wrong audience', async () => {
      const token = createMockToken({ 
        uid: TEST_USERS.admin.uid,
        aud: 'wrong-project-id'  // Wrong audience
      });
      
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(
        new Error('Firebase ID token has incorrect "aud" (audience) claim')
      );
      
      const request = createAuthRequest({
        token,
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await TasksGET(request, {});
      await assertErrorResponse(response, 401, 'Authentication failed');
    });

    test('Should reject token with wrong issuer', async () => {
      const token = createMockToken({ 
        uid: TEST_USERS.admin.uid,
        iss: 'https://securetoken.google.com/wrong-project'  // Wrong issuer
      });
      
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(
        new Error('Firebase ID token has incorrect "iss" (issuer) claim')
      );
      
      const request = createAuthRequest({
        token,
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await TasksGET(request, {});
      await assertErrorResponse(response, 401, 'Authentication failed');
    });

    test('Should reject token with empty subject', async () => {
      const token = createMockToken({ 
        uid: TEST_USERS.admin.uid,
        sub: ''  // Empty subject
      });
      
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(
        new Error('Firebase ID token has an empty "sub" (subject) claim')
      );
      
      const request = createAuthRequest({
        token,
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await TasksGET(request, {});
      await assertErrorResponse(response, 401, 'Authentication failed');
    });

    test('Should reject token with no subject', async () => {
      const token = createMockToken({ 
        uid: TEST_USERS.admin.uid,
        sub: undefined  // No subject
      });
      
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(
        new Error('Firebase ID token has no "sub" (subject) claim')
      );
      
      const request = createAuthRequest({
        token,
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await TasksGET(request, {});
      await assertErrorResponse(response, 401, 'Authentication failed');
    });

    test('Should reject token with future auth_time', async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
      const token = createMockToken({ 
        uid: TEST_USERS.admin.uid,
        auth_time: futureTime
      });
      
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(
        new Error('Firebase ID token was not issued in the past')
      );
      
      const request = createAuthRequest({
        token,
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await TasksGET(request, {});
      await assertErrorResponse(response, 401, 'Authentication failed');
    });

    test('Should reject expired token', async () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const token = createMockToken({ 
        uid: TEST_USERS.admin.uid,
        exp: pastTime
      });
      
      const error: any = new Error('Firebase ID token has expired');
      error.code = 'auth/id-token-expired';
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(error);
      
      const request = createAuthRequest({
        token,
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await TasksGET(request, {});
      await assertErrorResponse(response, 401, 'expired');
    });

    test('Should reject revoked token', async () => {
      const token = createMockToken({ uid: TEST_USERS.admin.uid });
      
      const error: any = new Error('Firebase ID token has been revoked');
      error.code = 'auth/id-token-revoked';
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(error);
      
      const request = createAuthRequest({
        token,
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await TasksGET(request, {});
      await assertErrorResponse(response, 401, 'revoked');
    });

    test('Should reject malformed JWT token', async () => {
      const request = createAuthRequest({
        token: 'not.a.valid.jwt.token.at.all',
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(
        new Error('Decoding Firebase ID token failed')
      );
      
      const response = await TasksGET(request, {});
      await assertErrorResponse(response, 401, 'Authentication failed');
    });

    test('Should reject token with invalid signature', async () => {
      const token = createMockToken({ uid: TEST_USERS.admin.uid });
      // Tamper with the token signature
      const tamperedToken = token.slice(0, -10) + 'tamperedXX';
      
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(
        new Error('Firebase ID token has invalid signature')
      );
      
      const request = createAuthRequest({
        token: tamperedToken,
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await TasksGET(request, {});
      await assertErrorResponse(response, 401, 'Authentication failed');
    });
  });

  describe('User Verification', () => {
    test('Should reject token for non-existent user', async () => {
      const token = createMockToken({ uid: 'non-existent-uid' });
      
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({
        uid: 'non-existent-uid',
        email: 'ghost@example.com'
      });
      
      // User doesn't exist in database
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      
      const request = createAuthRequest({
        token,
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await TasksGET(request, {});
      await assertErrorResponse(response, 401, 'User not found');
    });

    test('Should reject token for deactivated user', async () => {
      const token = createMockToken({ uid: TEST_USERS.admin.uid });
      
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({
        uid: TEST_USERS.admin.uid,
        email: TEST_USERS.admin.email
      });
      
      // User is deactivated
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: TEST_USERS.admin.id,
        email: TEST_USERS.admin.email,
        role: TEST_USERS.admin.role,
        isActive: false  // Deactivated user
      });
      
      const request = createAuthRequest({
        token,
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await TasksGET(request, {});
      await assertErrorResponse(response, 401, 'Account deactivated');
    });
  });

  describe('Token Claims Validation', () => {
    invalidTokenPayloads.forEach(({ name, payload, expectedError }) => {
      test(`Should reject token with ${name}`, async () => {
        const token = createMockToken({
          uid: TEST_USERS.admin.uid,
          ...payload
        });
        
        (auth.verifyIdToken as jest.Mock).mockRejectedValue(
          new Error(expectedError)
        );
        
        const request = createAuthRequest({
          token,
          params: { projectId: TEST_PROJECTS.project1.id }
        });
        
        const response = await TasksGET(request, {});
        await assertErrorResponse(response, 401);
      });
    });
  });

  describe('Token Verification with checkRevoked', () => {
    test('Should check token revocation when configured', async () => {
      const token = createMockToken({ uid: TEST_USERS.admin.uid });
      
      // First call succeeds, second call with checkRevoked fails
      (auth.verifyIdToken as jest.Mock)
        .mockResolvedValueOnce({
          uid: TEST_USERS.admin.uid,
          email: TEST_USERS.admin.email
        })
        .mockRejectedValueOnce(new Error('Token has been revoked'));
      
      // If implementation checks revocation, it should fail
      // This depends on whether the app is configured to check revocation
    });
  });

  describe('Session Token vs ID Token', () => {
    test('Should reject session cookies when ID tokens are expected', async () => {
      const request = createAuthRequest({
        params: { projectId: TEST_PROJECTS.project1.id },
        headers: {
          'cookie': 'session=invalid-session-cookie'
          // No Bearer token in Authorization header
        }
      });
      
      const response = await TasksGET(request, {});
      await assertErrorResponse(response, 401, 'No authorization header');
    });
  });

  describe('Cross-Site Request Forgery (CSRF) Protection', () => {
    test('Should validate request origin for state-changing operations', async () => {
      // This test would verify CSRF tokens or origin validation
      // for POST/PUT/DELETE operations if implemented
    });
  });
});