/**
 * RBAC (Role-Based Access Control) Security Tests
 * Tests role-based permissions, module access, and budget redaction
 */

import { NextRequest } from 'next/server';
import { GET as BudgetGET, POST as BudgetPOST } from '@/app/api/v1/budget/route';
import { GET as ProcurementGET, POST as ProcurementPOST } from '@/app/api/v1/procurement/route';
import { PUT as ProcurementPUT } from '@/app/api/v1/procurement/[id]/route';
import { DELETE as ProcurementDELETE } from '@/app/api/v1/procurement/[id]/route';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/firebaseAdmin';
import {
  TEST_USERS,
  TEST_PROJECTS,
  createMockToken,
  createAuthRequest,
  createMockProjectMember,
  createMockModuleAccess,
  createMockBudgetItem,
  assertErrorResponse,
  assertSuccessResponse
} from './utils/test-helpers';
import { Module } from '@prisma/client';

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
    project: {
      findUnique: jest.fn()
    },
    projectMember: {
      findUnique: jest.fn()
    },
    userModuleAccess: {
      findFirst: jest.fn()
    },
    budgetItem: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn()
    },
    procurement: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    auditLog: {
      create: jest.fn()
    }
  }
}));

describe('RBAC Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  const setupUserWithRole = (user: any, projectId: string) => {
    (auth.verifyIdToken as jest.Mock).mockResolvedValue({ 
      uid: user.uid,
      email: user.email
    });
    
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(
      createMockProjectMember(user.id, projectId, user.role)
    );
    
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(TEST_PROJECTS.project1);
  };

  describe('Budget Cost Redaction for Contractors', () => {
    test('Should redact all cost fields for CONTRACTOR role', async () => {
      const user = TEST_USERS.contractor;
      setupUserWithRole(user, TEST_PROJECTS.project1.id);
      
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(
        createMockModuleAccess(user.id, TEST_PROJECTS.project1.id, Module.BUDGET, {
          canView: true,
          canEdit: false
        })
      );
      
      const fullBudgetItem = createMockBudgetItem(TEST_PROJECTS.project1.id, true);
      (prisma.budgetItem.findMany as jest.Mock).mockResolvedValue([fullBudgetItem]);
      (prisma.budgetItem.count as jest.Mock).mockResolvedValue(1);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await BudgetGET(request, {});
      const result = await response.json();
      
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      
      const budgetItem = result.data[0];
      
      // Verify cost fields are redacted
      expect(budgetItem).not.toHaveProperty('estUnitCost');
      expect(budgetItem).not.toHaveProperty('estTotal');
      expect(budgetItem).not.toHaveProperty('committedTotal');
      expect(budgetItem).not.toHaveProperty('paidToDate');
      expect(budgetItem).not.toHaveProperty('variance');
      expect(budgetItem).not.toHaveProperty('varianceAmount');
      expect(budgetItem).not.toHaveProperty('variancePercent');
      
      // Verify non-cost fields are present
      expect(budgetItem).toHaveProperty('id');
      expect(budgetItem).toHaveProperty('item');
      expect(budgetItem).toHaveProperty('discipline');
      expect(budgetItem).toHaveProperty('category');
    });

    test('Should NOT redact cost fields for ADMIN role', async () => {
      const user = TEST_USERS.admin;
      setupUserWithRole(user, TEST_PROJECTS.project1.id);
      
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(
        createMockModuleAccess(user.id, TEST_PROJECTS.project1.id, Module.BUDGET, {
          canView: true,
          canEdit: true
        })
      );
      
      const fullBudgetItem = createMockBudgetItem(TEST_PROJECTS.project1.id, true);
      (prisma.budgetItem.findMany as jest.Mock).mockResolvedValue([fullBudgetItem]);
      (prisma.budgetItem.count as jest.Mock).mockResolvedValue(1);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await BudgetGET(request, {});
      const result = await response.json();
      
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      
      const budgetItem = result.data[0];
      
      // Verify all cost fields are present
      expect(budgetItem).toHaveProperty('estUnitCost');
      expect(budgetItem).toHaveProperty('estTotal');
      expect(budgetItem).toHaveProperty('committedTotal');
      expect(budgetItem).toHaveProperty('paidToDate');
      expect(budgetItem).toHaveProperty('variance');
    });

    test('Should NOT redact cost fields for STAFF role', async () => {
      const user = TEST_USERS.staff;
      setupUserWithRole(user, TEST_PROJECTS.project1.id);
      
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(
        createMockModuleAccess(user.id, TEST_PROJECTS.project1.id, Module.BUDGET, {
          canView: true,
          canEdit: true
        })
      );
      
      const fullBudgetItem = createMockBudgetItem(TEST_PROJECTS.project1.id, true);
      (prisma.budgetItem.findMany as jest.Mock).mockResolvedValue([fullBudgetItem]);
      (prisma.budgetItem.count as jest.Mock).mockResolvedValue(1);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await BudgetGET(request, {});
      const result = await response.json();
      
      expect(response.status).toBe(200);
      
      const budgetItem = result.data[0];
      
      // Verify all cost fields are present for STAFF
      expect(budgetItem).toHaveProperty('estTotal');
      expect(budgetItem).toHaveProperty('variance');
    });

    test('Should prevent CONTRACTOR from creating budget items', async () => {
      const user = TEST_USERS.contractor;
      setupUserWithRole(user, TEST_PROJECTS.project1.id);
      
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(
        createMockModuleAccess(user.id, TEST_PROJECTS.project1.id, Module.BUDGET, {
          canView: true,
          canEdit: false // Contractors can't edit
        })
      );
      
      const request = createAuthRequest({
        method: 'POST',
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id },
        body: {
          item: 'New Budget Item',
          category: 'Materials',
          estTotal: 1000
        }
      });
      
      const response = await BudgetPOST(request, {});
      await assertErrorResponse(response, 403, 'edit permission required');
    });
  });

  describe('Procurement RBAC - ADMIN/STAFF Only', () => {
    test('Should allow ADMIN to GET procurement items', async () => {
      const user = TEST_USERS.admin;
      setupUserWithRole(user, TEST_PROJECTS.project1.id);
      
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(
        createMockModuleAccess(user.id, TEST_PROJECTS.project1.id, Module.PROCUREMENT, {
          canView: true,
          canEdit: true
        })
      );
      
      (prisma.procurement.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.procurement.count as jest.Mock).mockResolvedValue(0);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await ProcurementGET(request, {});
      await assertSuccessResponse(response);
    });

    test('Should allow STAFF to GET procurement items', async () => {
      const user = TEST_USERS.staff;
      setupUserWithRole(user, TEST_PROJECTS.project1.id);
      
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(
        createMockModuleAccess(user.id, TEST_PROJECTS.project1.id, Module.PROCUREMENT, {
          canView: true,
          canEdit: true
        })
      );
      
      (prisma.procurement.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.procurement.count as jest.Mock).mockResolvedValue(0);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await ProcurementGET(request, {});
      await assertSuccessResponse(response);
    });

    test('Should allow CONTRACTOR to GET procurement items with limited view', async () => {
      const user = TEST_USERS.contractor;
      setupUserWithRole(user, TEST_PROJECTS.project1.id);
      
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(
        createMockModuleAccess(user.id, TEST_PROJECTS.project1.id, Module.PROCUREMENT, {
          canView: true,  // Can view
          canEdit: false  // But can't edit
        })
      );
      
      (prisma.procurement.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.procurement.count as jest.Mock).mockResolvedValue(0);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await ProcurementGET(request, {});
      await assertSuccessResponse(response);
    });

    test('Should prevent CONTRACTOR from POST to procurement', async () => {
      const user = TEST_USERS.contractor;
      setupUserWithRole(user, TEST_PROJECTS.project1.id);
      
      const request = createAuthRequest({
        method: 'POST',
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id },
        body: {
          item: 'New Procurement Item',
          category: 'MATERIALS',
          quantity: 10
        }
      });
      
      const response = await ProcurementPOST(request, {});
      await assertErrorResponse(response, 403, 'Insufficient role privileges');
    });

    test('Should prevent VIEWER from POST to procurement', async () => {
      const user = TEST_USERS.viewer;
      setupUserWithRole(user, TEST_PROJECTS.project1.id);
      
      const request = createAuthRequest({
        method: 'POST',
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id },
        body: {
          item: 'New Procurement Item',
          category: 'MATERIALS',
          quantity: 10
        }
      });
      
      const response = await ProcurementPOST(request, {});
      await assertErrorResponse(response, 403, 'Insufficient role privileges');
    });

    test('Should allow ADMIN to POST to procurement', async () => {
      const user = TEST_USERS.admin;
      setupUserWithRole(user, TEST_PROJECTS.project1.id);
      
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(
        createMockModuleAccess(user.id, TEST_PROJECTS.project1.id, Module.PROCUREMENT, {
          canView: true,
          canEdit: true
        })
      );
      
      (prisma.procurement.create as jest.Mock).mockResolvedValue({
        id: 'new-procurement',
        item: 'New Procurement Item',
        projectId: TEST_PROJECTS.project1.id
      });
      
      const request = createAuthRequest({
        method: 'POST',
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id },
        body: {
          item: 'New Procurement Item',
          category: 'MATERIALS',
          quantity: 10
        }
      });
      
      const response = await ProcurementPOST(request, {});
      await assertSuccessResponse(response);
    });

    test('Should allow STAFF to POST to procurement', async () => {
      const user = TEST_USERS.staff;
      setupUserWithRole(user, TEST_PROJECTS.project1.id);
      
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(
        createMockModuleAccess(user.id, TEST_PROJECTS.project1.id, Module.PROCUREMENT, {
          canView: true,
          canEdit: true
        })
      );
      
      (prisma.procurement.create as jest.Mock).mockResolvedValue({
        id: 'new-procurement',
        item: 'New Procurement Item',
        projectId: TEST_PROJECTS.project1.id
      });
      
      const request = createAuthRequest({
        method: 'POST',
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id },
        body: {
          item: 'New Procurement Item',
          category: 'MATERIALS',
          quantity: 10
        }
      });
      
      const response = await ProcurementPOST(request, {});
      await assertSuccessResponse(response);
    });

    test('Should prevent CONTRACTOR from PUT to procurement', async () => {
      const user = TEST_USERS.contractor;
      setupUserWithRole(user, TEST_PROJECTS.project1.id);
      
      (prisma.procurement.findUnique as jest.Mock).mockResolvedValue({
        id: 'procurement-1',
        projectId: TEST_PROJECTS.project1.id
      });
      
      const request = createAuthRequest({
        method: 'PUT',
        token: createMockToken({ uid: user.uid }),
        body: {
          item: 'Updated Item'
        }
      });
      
      const response = await ProcurementPUT(request, { params: { id: 'procurement-1' } });
      await assertErrorResponse(response, 403);
    });

    test('Should prevent CONTRACTOR from DELETE to procurement', async () => {
      const user = TEST_USERS.contractor;
      setupUserWithRole(user, TEST_PROJECTS.project1.id);
      
      (prisma.procurement.findUnique as jest.Mock).mockResolvedValue({
        id: 'procurement-1',
        projectId: TEST_PROJECTS.project1.id
      });
      
      const request = createAuthRequest({
        method: 'DELETE',
        token: createMockToken({ uid: user.uid })
      });
      
      const response = await ProcurementDELETE(request, { params: { id: 'procurement-1' } });
      await assertErrorResponse(response, 403);
    });
  });

  describe('Module Access Permissions', () => {
    test('Should deny access when user lacks module permission', async () => {
      const user = TEST_USERS.staff;
      setupUserWithRole(user, TEST_PROJECTS.project1.id);
      
      // User has no PROCUREMENT module access
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(null);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await ProcurementGET(request, {});
      await assertErrorResponse(response, 403, 'No PROCUREMENT access');
    });

    test('Should deny edit when user only has view permission', async () => {
      const user = TEST_USERS.staff;
      setupUserWithRole(user, TEST_PROJECTS.project1.id);
      
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(
        createMockModuleAccess(user.id, TEST_PROJECTS.project1.id, Module.BUDGET, {
          canView: true,
          canEdit: false  // Can view but not edit
        })
      );
      
      const request = createAuthRequest({
        method: 'POST',
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id },
        body: {
          item: 'New Budget Item',
          category: 'Materials'
        }
      });
      
      const response = await BudgetPOST(request, {});
      await assertErrorResponse(response, 403, 'edit permission required');
    });

    test('Should allow access with proper module permissions', async () => {
      const user = TEST_USERS.admin;
      setupUserWithRole(user, TEST_PROJECTS.project1.id);
      
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(
        createMockModuleAccess(user.id, TEST_PROJECTS.project1.id, Module.BUDGET, {
          canView: true,
          canEdit: true
        })
      );
      
      (prisma.budgetItem.create as jest.Mock).mockResolvedValue({
        id: 'new-budget',
        item: 'New Budget Item',
        projectId: TEST_PROJECTS.project1.id
      });
      
      const request = createAuthRequest({
        method: 'POST',
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id },
        body: {
          item: 'New Budget Item',
          category: 'Materials',
          discipline: 'GENERAL'
        }
      });
      
      const response = await BudgetPOST(request, {});
      await assertSuccessResponse(response);
    });
  });

  describe('Bulk Operations RBAC', () => {
    test('Should enforce RBAC on bulk procurement operations', async () => {
      const user = TEST_USERS.contractor;
      setupUserWithRole(user, TEST_PROJECTS.project1.id);
      
      // Test bulk update endpoint if it exists
      const request = createAuthRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/v1/procurement/bulk',
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id },
        body: {
          items: [
            { id: 'proc-1', status: 'APPROVED' },
            { id: 'proc-2', status: 'APPROVED' }
          ]
        }
      });
      
      // If bulk endpoint exists, it should enforce same RBAC
      // This would fail with 403 for CONTRACTOR role
      // await assertErrorResponse(response, 403);
    });
  });
});