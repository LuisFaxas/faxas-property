/**
 * IDOR (Insecure Direct Object Reference) Security Tests
 * Tests cross-tenant attacks and project isolation across all modules
 */

import { NextRequest } from 'next/server';
import { GET as TasksGET, POST as TasksPOST } from '@/app/api/v1/tasks/route';
import { GET as ScheduleGET, POST as SchedulePOST } from '@/app/api/v1/schedule/route';
import { GET as BudgetGET, POST as BudgetPOST } from '@/app/api/v1/budget/route';
import { GET as ProcurementGET, POST as ProcurementPOST } from '@/app/api/v1/procurement/route';
import { GET as ContactsGET, POST as ContactsPOST } from '@/app/api/v1/contacts/route';
import { GET as ProjectsGET, POST as ProjectsPOST } from '@/app/api/v1/projects/route';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/firebaseAdmin';
import {
  TEST_USERS,
  TEST_PROJECTS,
  createMockToken,
  createAuthRequest,
  createMockProjectMember,
  createMockModuleAccess,
  assertErrorResponse,
  assertSuccessResponse
} from './utils/test-helpers';
import { mockTasks, mockScheduleEvents, mockContacts, mockProcurementItems } from './fixtures/mock-data';

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
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn()
    },
    projectMember: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    userModuleAccess: {
      findFirst: jest.fn()
    },
    task: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn()
    },
    scheduleEvent: {
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
    auditLog: {
      create: jest.fn()
    },
    taskActivity: {
      create: jest.fn()
    }
  }
}));

describe('IDOR Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set test environment
    process.env.NODE_ENV = 'test';
  });

  describe('Cross-Tenant Access Prevention', () => {
    const setupUserWithProjectAccess = (user: any, projectId: string) => {
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({ 
        uid: user.uid,
        email: user.email
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: user.id,
        email: user.email,
        role: user.role
      });
      
      // User is member of project1 only
      (prisma.projectMember.findUnique as jest.Mock).mockImplementation(async ({ where }) => {
        if (where.projectId_userId.projectId === TEST_PROJECTS.project1.id && 
            where.projectId_userId.userId === user.id) {
          return createMockProjectMember(user.id, TEST_PROJECTS.project1.id, user.role);
        }
        return null; // Not a member of other projects
      });
      
      // Grant module access for project1 only
      (prisma.userModuleAccess.findFirst as jest.Mock).mockImplementation(async ({ where }) => {
        if (where.projectId === TEST_PROJECTS.project1.id && where.userId === user.id) {
          return createMockModuleAccess(user.id, TEST_PROJECTS.project1.id, where.module, {
            canView: true,
            canEdit: user.role !== 'CONTRACTOR'
          });
        }
        return null;
      });
    };

    test('Tasks: Should prevent access to tasks from unauthorized project', async () => {
      setupUserWithProjectAccess(TEST_USERS.staff, TEST_PROJECTS.project1.id);
      
      // Try to access tasks from project2 (user is not a member)
      const request = createAuthRequest({
        token: createMockToken({ uid: TEST_USERS.staff.uid }),
        params: { projectId: TEST_PROJECTS.project2.id }
      });
      
      const response = await TasksGET(request, {});
      await assertErrorResponse(response, 403, 'Not a member of this project');
    });

    test('Tasks: Should allow access to tasks from authorized project', async () => {
      setupUserWithProjectAccess(TEST_USERS.staff, TEST_PROJECTS.project1.id);
      
      (prisma.task.findMany as jest.Mock).mockResolvedValue([mockTasks[0]]);
      (prisma.task.count as jest.Mock).mockResolvedValue(1);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: TEST_USERS.staff.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await TasksGET(request, {});
      const data = await assertSuccessResponse(response);
      
      expect(data).toHaveLength(1);
      expect(data[0].projectId).toBe(TEST_PROJECTS.project1.id);
      
      // Verify query was scoped to correct project
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: TEST_PROJECTS.project1.id
          })
        })
      );
    });

    test('Schedule: Should prevent access to events from unauthorized project', async () => {
      setupUserWithProjectAccess(TEST_USERS.admin, TEST_PROJECTS.project1.id);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: TEST_USERS.admin.uid }),
        params: { projectId: TEST_PROJECTS.project2.id }
      });
      
      const response = await ScheduleGET(request, {});
      await assertErrorResponse(response, 403, 'Not a member of this project');
    });

    test('Budget: Should prevent access to budget items from unauthorized project', async () => {
      setupUserWithProjectAccess(TEST_USERS.staff, TEST_PROJECTS.project1.id);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: TEST_USERS.staff.uid }),
        params: { projectId: TEST_PROJECTS.inaccessible.id }
      });
      
      const response = await BudgetGET(request, {});
      await assertErrorResponse(response, 403, 'Not a member of this project');
    });

    test('Procurement: Should prevent access to procurement items from unauthorized project', async () => {
      setupUserWithProjectAccess(TEST_USERS.admin, TEST_PROJECTS.project1.id);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: TEST_USERS.admin.uid }),
        params: { projectId: TEST_PROJECTS.project2.id }
      });
      
      const response = await ProcurementGET(request, {});
      await assertErrorResponse(response, 403, 'Not a member of this project');
    });

    test('Contacts: Should prevent access to contacts from unauthorized project', async () => {
      setupUserWithProjectAccess(TEST_USERS.staff, TEST_PROJECTS.project1.id);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: TEST_USERS.staff.uid }),
        params: { projectId: TEST_PROJECTS.project2.id }
      });
      
      const response = await ContactsGET(request, {});
      await assertErrorResponse(response, 403, 'Not a member of this project');
    });
  });

  describe('Project List Isolation', () => {
    test('Projects: User should only see projects where they are a member', async () => {
      const user = TEST_USERS.staff;
      
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({ 
        uid: user.uid,
        email: user.email
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: user.id,
        email: user.email,
        role: user.role
      });
      
      // User is member of project1 and project2, but not inaccessible project
      (prisma.projectMember.findMany as jest.Mock).mockResolvedValue([
        createMockProjectMember(user.id, TEST_PROJECTS.project1.id, user.role),
        createMockProjectMember(user.id, TEST_PROJECTS.project2.id, user.role)
      ]);
      
      // Mock the projects the user has access to
      (prisma.project.findMany as jest.Mock).mockResolvedValue([
        TEST_PROJECTS.project1,
        TEST_PROJECTS.project2
      ]);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid })
      });
      
      const response = await ProjectsGET(request, {});
      const data = await assertSuccessResponse(response);
      
      expect(data).toHaveLength(2);
      expect(data.map((p: any) => p.id)).toContain(TEST_PROJECTS.project1.id);
      expect(data.map((p: any) => p.id)).toContain(TEST_PROJECTS.project2.id);
      expect(data.map((p: any) => p.id)).not.toContain(TEST_PROJECTS.inaccessible.id);
      
      // Verify query was scoped to user's projects
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            members: expect.objectContaining({
              some: expect.objectContaining({
                userId: user.id
              })
            })
          })
        })
      );
    });
  });

  describe('Resource Creation Isolation', () => {
    test('Tasks: Should prevent creating tasks in unauthorized project via body manipulation', async () => {
      const user = TEST_USERS.staff;
      
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({ 
        uid: user.uid,
        email: user.email
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: user.id,
        email: user.email,
        role: user.role
      });
      
      // User is member of project1
      (prisma.projectMember.findUnique as jest.Mock).mockImplementation(async ({ where }) => {
        if (where.projectId_userId.projectId === TEST_PROJECTS.project1.id) {
          return createMockProjectMember(user.id, TEST_PROJECTS.project1.id, user.role);
        }
        return null;
      });
      
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(
        createMockModuleAccess(user.id, TEST_PROJECTS.project1.id, 'TASKS', {
          canView: true,
          canEdit: true
        })
      );
      
      (prisma.task.create as jest.Mock).mockResolvedValue({
        id: 'new-task',
        title: 'Test Task',
        projectId: TEST_PROJECTS.project1.id // Should use security context, not body
      });
      
      // Try to create task in project2 via body (should be ignored)
      const request = createAuthRequest({
        method: 'POST',
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id },
        body: {
          title: 'Test Task',
          projectId: TEST_PROJECTS.project2.id // Malicious attempt
        }
      });
      
      const response = await TasksPOST(request, {});
      await assertSuccessResponse(response);
      
      // Verify task was created in project1 (from security context), not project2 (from body)
      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: TEST_PROJECTS.project1.id // Security context wins
          })
        })
      );
    });

    test('Contacts: Should enforce project scope when creating contacts', async () => {
      const user = TEST_USERS.admin;
      
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
        createMockProjectMember(user.id, TEST_PROJECTS.project1.id, user.role)
      );
      
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(
        createMockModuleAccess(user.id, TEST_PROJECTS.project1.id, 'CONTACTS', {
          canView: true,
          canEdit: true
        })
      );
      
      (prisma.contact.create as jest.Mock).mockResolvedValue({
        id: 'new-contact',
        name: 'Test Contact',
        email: 'test@example.com',
        projectId: TEST_PROJECTS.project1.id
      });
      
      const request = createAuthRequest({
        method: 'POST',
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id },
        body: {
          name: 'Test Contact',
          email: 'test@example.com',
          projectId: TEST_PROJECTS.inaccessible.id // Try to create in different project
        }
      });
      
      const response = await ContactsPOST(request, {});
      await assertSuccessResponse(response);
      
      // Verify contact was created in the authorized project
      expect(prisma.contact.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: TEST_PROJECTS.project1.id
          })
        })
      );
    });
  });

  describe('Query Scoping Verification', () => {
    test('Should never query without projectId constraint', async () => {
      const user = TEST_USERS.admin;
      
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
        createMockProjectMember(user.id, TEST_PROJECTS.project1.id, user.role)
      );
      
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(
        createMockModuleAccess(user.id, TEST_PROJECTS.project1.id, 'TASKS', {
          canView: true,
          canEdit: true
        })
      );
      
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.task.count as jest.Mock).mockResolvedValue(0);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      await TasksGET(request, {});
      
      // Verify all queries include projectId constraint
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: TEST_PROJECTS.project1.id
          })
        })
      );
      
      expect(prisma.task.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: TEST_PROJECTS.project1.id
          })
        })
      );
    });
  });

  describe('Invalid Project ID Handling', () => {
    test('Should handle non-existent projectId gracefully', async () => {
      const user = TEST_USERS.admin;
      
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({ 
        uid: user.uid,
        email: user.email
      });
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: user.id,
        email: user.email,
        role: user.role
      });
      
      // Project doesn't exist
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);
      
      // User has access to project1
      (prisma.projectMember.findMany as jest.Mock).mockResolvedValue([
        createMockProjectMember(user.id, TEST_PROJECTS.project1.id, user.role)
      ]);
      
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(
        createMockProjectMember(user.id, TEST_PROJECTS.project1.id, user.role)
      );
      
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(
        createMockModuleAccess(user.id, TEST_PROJECTS.project1.id, 'TASKS', {
          canView: true,
          canEdit: true
        })
      );
      
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.task.count as jest.Mock).mockResolvedValue(0);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: 'non-existent-project-id' }
      });
      
      const response = await TasksGET(request, {});
      
      // Should fallback to user's first available project
      expect(response.status).toBe(200);
    });
  });
});