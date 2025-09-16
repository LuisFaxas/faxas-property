/**
 * Security Test Utilities
 * Helper functions for security testing
 */

import { NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { Role, Module } from '@prisma/client';

// Test user configurations
export const TEST_USERS = {
  admin: {
    id: 'admin-user-id',
    email: 'admin@test.com',
    role: 'ADMIN' as Role,
    uid: 'admin-firebase-uid'
  },
  staff: {
    id: 'staff-user-id',
    email: 'staff@test.com',
    role: 'STAFF' as Role,
    uid: 'staff-firebase-uid'
  },
  contractor: {
    id: 'contractor-user-id',
    email: 'contractor@test.com',
    role: 'CONTRACTOR' as Role,
    uid: 'contractor-firebase-uid'
  },
  viewer: {
    id: 'viewer-user-id',
    email: 'viewer@test.com',
    role: 'VIEWER' as Role,
    uid: 'viewer-firebase-uid'
  },
  unauthorized: {
    id: 'unauthorized-user-id',
    email: 'unauthorized@test.com',
    role: 'STAFF' as Role,
    uid: 'unauthorized-firebase-uid'
  }
};

// Test project configurations
export const TEST_PROJECTS = {
  project1: {
    id: 'project-1',
    name: 'Test Project 1',
    description: 'First test project'
  },
  project2: {
    id: 'project-2',
    name: 'Test Project 2',
    description: 'Second test project'
  },
  inaccessible: {
    id: 'inaccessible-project',
    name: 'Inaccessible Project',
    description: 'Project with no members'
  }
};

/**
 * Creates a mock Firebase token
 */
export function createMockToken(options: {
  uid?: string;
  email?: string;
  aud?: string;
  iss?: string;
  exp?: number;
  auth_time?: number;
  sub?: string;
} = {}) {
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    uid: options.uid || TEST_USERS.admin.uid,
    email: options.email || TEST_USERS.admin.email,
    aud: options.aud || 'test-project',
    iss: options.iss || 'https://securetoken.google.com/test-project',
    exp: options.exp !== undefined ? options.exp : now + 3600,
    auth_time: options.auth_time !== undefined ? options.auth_time : now - 60,
    sub: options.sub !== undefined ? options.sub : options.uid || TEST_USERS.admin.uid,
    iat: now
  };
  
  // Sign with a test secret (in real tests, Firebase Admin would verify)
  return jwt.sign(payload, 'test-secret');
}

/**
 * Creates a mock NextRequest with authentication
 */
export function createAuthRequest(options: {
  method?: string;
  url?: string;
  token?: string;
  params?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
} = {}) {
  const url = new URL(options.url || 'http://localhost:3000/api/v1/test');
  
  // Add query parameters
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  const headers = new Headers(options.headers || {});
  
  // Add authorization header if token provided
  if (options.token) {
    headers.append('authorization', `Bearer ${options.token}`);
  }
  
  // Add content-type for POST/PUT requests
  if (options.body && !headers.has('content-type')) {
    headers.append('content-type', 'application/json');
  }
  
  const request = new NextRequest(url, {
    method: options.method || 'GET',
    headers,
  });
  
  // Mock the json() method for POST/PUT requests
  if (options.body) {
    request.json = jest.fn().mockResolvedValue(options.body);
  }
  
  return request;
}

/**
 * Creates mock project member data
 */
export function createMockProjectMember(userId: string, projectId: string, role: Role) {
  return {
    id: `member-${userId}-${projectId}`,
    userId,
    projectId,
    role,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Creates mock module access data
 */
export function createMockModuleAccess(
  userId: string,
  projectId: string,
  module: Module,
  permissions: {
    canView?: boolean;
    canEdit?: boolean;
    canUpload?: boolean;
    canRequest?: boolean;
  } = {}
) {
  return {
    userId,
    projectId,
    module,
    canView: permissions.canView ?? true,
    canEdit: permissions.canEdit ?? false,
    canUpload: permissions.canUpload ?? false,
    canRequest: permissions.canRequest ?? true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Assert response status and error
 */
export async function assertErrorResponse(
  response: Response,
  expectedStatus: number,
  errorContains?: string
) {
  expect(response.status).toBe(expectedStatus);
  
  const data = await response.json();
  expect(data.success).toBe(false);
  
  if (errorContains) {
    expect(data.error).toContain(errorContains);
  }
}

/**
 * Assert successful response
 */
export async function assertSuccessResponse(
  response: Response,
  dataAssertion?: (data: any) => void
) {
  expect(response.status).toBe(200);
  
  const result = await response.json();
  expect(result.success).toBe(true);
  
  if (dataAssertion) {
    dataAssertion(result.data);
  }
  
  return result.data;
}

/**
 * Create mock budget item with optional cost redaction
 */
export function createMockBudgetItem(projectId: string, includesCosts: boolean = true) {
  const base = {
    id: 'budget-item-1',
    item: 'Test Budget Item',
    discipline: 'GENERAL',
    category: 'Materials',
    projectId,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  if (includesCosts) {
    return {
      ...base,
      estUnitCost: 100,
      estTotal: 1000,
      committedTotal: 500,
      paidToDate: 300,
      variance: 0.2,
      varianceAmount: 200,
      variancePercent: 20
    };
  }
  
  return base;
}

/**
 * Sleep for testing rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate multiple requests for rate limit testing
 */
export async function generateRateLimitRequests(
  endpoint: Function,
  count: number,
  requestOptions: any = {}
) {
  const responses: Response[] = [];
  
  for (let i = 0; i < count; i++) {
    const request = createAuthRequest(requestOptions);
    const response = await endpoint(request, {});
    responses.push(response);
  }
  
  return responses;
}

/**
 * Mock audit log creation
 */
export function expectAuditLog(prismaMock: any, expectedData: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  projectId?: string;
}) {
  expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining(expectedData)
    })
  );
}