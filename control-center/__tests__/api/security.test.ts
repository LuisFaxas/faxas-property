/**
 * Security Tests for API Routes
 * Tests authentication, authorization, project isolation, and data protection
 */

import { NextRequest } from 'next/server';
import { GET as TasksGET, POST as TasksPOST } from '@/app/api/v1/tasks/route';
import { GET as BudgetGET, POST as BudgetPOST } from '@/app/api/v1/budget/route';
import { GET as ProcurementGET, POST as ProcurementPOST } from '@/app/api/v1/procurement/route';
import { GET as ContactsGET, POST as ContactsPOST } from '@/app/api/v1/contacts/route';
import { GET as ProjectsGET, POST as ProjectsPOST } from '@/app/api/v1/projects/route';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/firebaseAdmin';

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
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn()
    },
    userModuleAccess: {
      findFirst: jest.fn()
    },
    task: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn()
    },
    budgetItem: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn()
    },
    procurement: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn()
    },
    contact: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn()
    },
    project: {
      findMany: jest.fn(),
      create: jest.fn()
    },
    auditLog: {
      create: jest.fn()
    },
    taskActivity: {
      create: jest.fn()
    }
  }
}));

describe('API Security Tests', () => {
  const mockProjectId = 'test-project-id';
  const mockUserId = 'test-user-id';
  const mockAdminUserId = 'admin-user-id';
  const mockContractorUserId = 'contractor-user-id';
  
  const createMockRequest = (token?: string, params?: Record<string, string>) => {
    const url = new URL('http://localhost:3000/api/v1/test');
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    const headers = new Headers();
    if (token) {
      headers.append('authorization', `Bearer ${token}`);
    }
    
    return new NextRequest(url, { headers });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Tests', () => {
    test('should reject requests without token', async () => {
      const request = createMockRequest();
      const response = await TasksGET(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toContain('authorization');
    });

    test('should reject requests with invalid token', async () => {
      const request = createMockRequest('invalid-token');
      
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));
      
      const response = await TasksGET(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toContain('Authentication failed');
    });

    test('should reject requests with expired token', async () => {
      const request = createMockRequest('expired-token');
      
      const error: any = new Error('Token expired');
      error.code = 'auth/id-token-expired';
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(error);
      
      const response = await TasksGET(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toContain('expired');
    });
  });

  describe('Authorization Tests', () => {
    test('should reject contractor access to create tasks', async () => {
      const request = createMockRequest('contractor-token', { projectId: mockProjectId });
      
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: mockContractorUserId });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
        id: mockContractorUserId, 
        role: 'CONTRACTOR' 
      });
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue({
        userId: mockContractorUserId,
        projectId: mockProjectId,
        role: 'CONTRACTOR'
      });
      
      const response = await TasksPOST(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(403);
      expect(data.error).toContain('Insufficient');
    });

    test('should allow admin to create tasks', async () => {
      const request = createMockRequest('admin-token', { projectId: mockProjectId });
      request.json = jest.fn().mockResolvedValue({
        title: 'Test Task',
        projectId: mockProjectId
      });
      
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({ 
        uid: mockAdminUserId,
        email: 'admin@test.com'
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
        id: mockAdminUserId, 
        role: 'ADMIN' 
      });
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue({
        userId: mockAdminUserId,
        projectId: mockProjectId,
        role: 'ADMIN'
      });
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue({
        canView: true,
        canEdit: true
      });
      (prisma.task.create as jest.Mock).mockResolvedValue({
        id: 'new-task-id',
        title: 'Test Task',
        projectId: mockProjectId
      });
      
      const response = await TasksPOST(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Project Isolation Tests', () => {
    test('should not allow access to resources from different project', async () => {
      const request = createMockRequest('user-token', { projectId: 'different-project' });
      
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: mockUserId });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
        id: mockUserId, 
        role: 'STAFF' 
      });
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(null);
      
      const response = await TasksGET(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(403);
      expect(data.error).toContain('Not a member of this project');
    });

    test('should enforce project scope in queries', async () => {
      const request = createMockRequest('user-token', { projectId: mockProjectId });
      
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: mockUserId });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
        id: mockUserId, 
        role: 'STAFF' 
      });
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        projectId: mockProjectId,
        role: 'STAFF'
      });
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue({
        canView: true,
        canEdit: true
      });
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.task.count as jest.Mock).mockResolvedValue(0);
      
      await TasksGET(request, {});
      
      // Verify that projectId was enforced in the query
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: mockProjectId
          })
        })
      );
    });
  });

  describe('Budget Cost Redaction for Contractors', () => {
    test('should redact cost fields for contractors', async () => {
      const request = createMockRequest('contractor-token', { projectId: mockProjectId });
      
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: mockContractorUserId });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
        id: mockContractorUserId, 
        role: 'CONTRACTOR' 
      });
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue({
        userId: mockContractorUserId,
        projectId: mockProjectId,
        role: 'CONTRACTOR'
      });
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue({
        canView: true,
        canEdit: false
      });
      
      const mockBudgetItem = {
        id: 'budget-1',
        item: 'Test Item',
        discipline: 'GENERAL',
        category: 'Materials',
        estUnitCost: 100,
        estTotal: 1000,
        committedTotal: 500,
        paidToDate: 300,
        variance: 0.2,
        project: { id: mockProjectId, name: 'Test Project' }
      };
      
      (prisma.budgetItem.findMany as jest.Mock).mockResolvedValue([mockBudgetItem]);
      (prisma.budgetItem.count as jest.Mock).mockResolvedValue(1);
      
      const response = await BudgetGET(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.data[0]).not.toHaveProperty('estUnitCost');
      expect(data.data[0]).not.toHaveProperty('estTotal');
      expect(data.data[0]).not.toHaveProperty('committedTotal');
      expect(data.data[0]).not.toHaveProperty('paidToDate');
      expect(data.data[0]).not.toHaveProperty('variance');
      expect(data.data[0]).toHaveProperty('item', 'Test Item');
    });

    test('should not redact cost fields for admin/staff', async () => {
      const request = createMockRequest('admin-token', { projectId: mockProjectId });
      
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: mockAdminUserId });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
        id: mockAdminUserId, 
        role: 'ADMIN' 
      });
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue({
        userId: mockAdminUserId,
        projectId: mockProjectId,
        role: 'ADMIN'
      });
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue({
        canView: true,
        canEdit: true
      });
      
      const mockBudgetItem = {
        id: 'budget-1',
        item: 'Test Item',
        estUnitCost: 100,
        estTotal: 1000,
        committedTotal: 500,
        paidToDate: 300,
        variance: 0.2,
        project: { id: mockProjectId, name: 'Test Project' }
      };
      
      (prisma.budgetItem.findMany as jest.Mock).mockResolvedValue([mockBudgetItem]);
      (prisma.budgetItem.count as jest.Mock).mockResolvedValue(1);
      
      const response = await BudgetGET(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.data[0]).toHaveProperty('estTotal');
      expect(data.data[0]).toHaveProperty('variance');
    });
  });

  describe('Module Access Tests', () => {
    test('should deny access when user lacks module permission', async () => {
      const request = createMockRequest('user-token', { projectId: mockProjectId });
      
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: mockUserId });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
        id: mockUserId, 
        role: 'STAFF' 
      });
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        projectId: mockProjectId,
        role: 'STAFF'
      });
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(null);
      
      const response = await ProcurementGET(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(403);
      expect(data.error).toContain('No PROCUREMENT access');
    });

    test('should allow access with proper module permissions', async () => {
      const request = createMockRequest('user-token', { projectId: mockProjectId });
      
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: mockUserId });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
        id: mockUserId, 
        role: 'STAFF' 
      });
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        projectId: mockProjectId,
        role: 'STAFF'
      });
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue({
        canView: true,
        canEdit: true
      });
      (prisma.procurement.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.procurement.count as jest.Mock).mockResolvedValue(0);
      
      const response = await ProcurementGET(request, {});
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Audit Logging Tests', () => {
    test('should create audit log for mutations', async () => {
      const request = createMockRequest('admin-token', { projectId: mockProjectId });
      request.json = jest.fn().mockResolvedValue({
        name: 'New Contact',
        email: 'test@example.com'
      });
      
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({ 
        uid: mockAdminUserId,
        email: 'admin@test.com'
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
        id: mockAdminUserId, 
        role: 'ADMIN' 
      });
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue({
        userId: mockAdminUserId,
        projectId: mockProjectId,
        role: 'ADMIN'
      });
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue({
        canView: true,
        canEdit: true
      });
      (prisma.contact.create as jest.Mock).mockResolvedValue({
        id: 'new-contact-id',
        name: 'New Contact',
        projectId: mockProjectId
      });
      
      await ContactsPOST(request, {});
      
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockAdminUserId,
            action: 'CREATE',
            entity: 'CONTACT'
          })
        })
      );
    });
  });

  describe('Rate Limiting Tests', () => {
    test('should enforce rate limits in development', async () => {
      process.env.NODE_ENV = 'development';
      
      // Make many requests to trigger rate limit
      const promises = [];
      for (let i = 0; i < 110; i++) {
        const request = createMockRequest('user-token', { projectId: mockProjectId });
        
        (auth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: mockUserId });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
          id: mockUserId, 
          role: 'STAFF' 
        });
        (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue({
          userId: mockUserId,
          projectId: mockProjectId,
          role: 'STAFF'
        });
        (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue({
          canView: true
        });
        (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.task.count as jest.Mock).mockResolvedValue(0);
        
        promises.push(TasksGET(request, {}));
      }
      
      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      // At least some requests should be rate limited
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Project Attack Prevention', () => {
    test('should prevent accessing resources with client-supplied projectId', async () => {
      const request = createMockRequest('user-token', { projectId: mockProjectId });
      request.json = jest.fn().mockResolvedValue({
        title: 'Malicious Task',
        projectId: 'evil-project-id'  // Trying to create task in different project
      });
      
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: mockUserId });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
        id: mockUserId, 
        role: 'STAFF' 
      });
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue({
        userId: mockUserId,
        projectId: mockProjectId,
        role: 'STAFF'
      });
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue({
        canView: true,
        canEdit: true
      });
      (prisma.task.create as jest.Mock).mockResolvedValue({
        id: 'new-task-id',
        title: 'Malicious Task',
        projectId: mockProjectId  // Should use security context projectId
      });
      
      await TasksPOST(request, {});
      
      // Verify task was created with security context projectId, not client-supplied
      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: mockProjectId  // Not 'evil-project-id'
          })
        })
      );
    });
  });
});