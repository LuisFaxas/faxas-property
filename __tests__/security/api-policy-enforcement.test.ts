/**
 * API Policy Enforcement Tests
 * Verifies that all API routes use the policy engine and scoped repositories
 */

import { NextRequest } from 'next/server';
import { Policy } from '@/lib/policy';
import * as DataLayer from '@/lib/data';
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
import { Module } from '@prisma/client';

// Import all refactored API routes
import { GET as TasksGET, POST as TasksPOST } from '@/app/api/v1/tasks/route';
import { GET as ScheduleGET, POST as SchedulePOST } from '@/app/api/v1/schedule/route';
import { GET as BudgetGET, POST as BudgetPOST } from '@/app/api/v1/budget/route';
import { GET as ProcurementGET, POST as ProcurementPOST } from '@/app/api/v1/procurement/route';
import { GET as ContactsGET, POST as ContactsPOST } from '@/app/api/v1/contacts/route';
import { GET as ProjectsGET, POST as ProjectsPOST } from '@/app/api/v1/projects/route';

// Mock modules
jest.mock('@/lib/firebaseAdmin', () => ({
  auth: {
    verifyIdToken: jest.fn()
  }
}));

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
      findMany: jest.fn(),
      create: jest.fn()
    },
    userModuleAccess: {
      findFirst: jest.fn()
    },
    auditLog: {
      create: jest.fn()
    },
    taskActivity: {
      create: jest.fn()
    },
    procurement: {
      findFirst: jest.fn()
    }
  }
}));

// Spy on Policy functions
jest.mock('@/lib/policy', () => {
  const originalModule = jest.requireActual('@/lib/policy');
  return {
    ...originalModule,
    Policy: {
      ...originalModule.Policy,
      assertMember: jest.fn(originalModule.Policy.assertMember),
      assertModuleAccess: jest.fn(originalModule.Policy.assertModuleAccess),
      getUserProjectRole: jest.fn(originalModule.Policy.getUserProjectRole),
      getUserProjects: jest.fn(originalModule.Policy.getUserProjects),
      getRateLimitTier: jest.fn(originalModule.Policy.getRateLimitTier),
      logPolicyDecision: jest.fn(originalModule.Policy.logPolicyDecision)
    }
  };
});

// Spy on Data Layer
jest.mock('@/lib/data', () => {
  const originalModule = jest.requireActual('@/lib/data');
  return {
    ...originalModule,
    createSecurityContext: jest.fn(),
    createRepositories: jest.fn()
  };
});

describe('API Routes Policy Enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  const setupMocks = (user: any = TEST_USERS.admin, hasAccess: boolean = true) => {
    // Mock Firebase auth
    (auth.verifyIdToken as jest.Mock).mockResolvedValue({
      uid: user.uid,
      email: user.email
    });
    
    // Mock user lookup
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: user.id,
      email: user.email,
      role: user.role
    });
    
    // Mock project existence
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(TEST_PROJECTS.project1);
    
    if (hasAccess) {
      // Mock project membership
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(
        createMockProjectMember(user.id, TEST_PROJECTS.project1.id, user.role)
      );
      
      // Mock module access for all modules
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(
        createMockModuleAccess(user.id, TEST_PROJECTS.project1.id, Module.TASKS, {
          canView: true,
          canEdit: user.role !== 'CONTRACTOR'
        })
      );
      
      // Mock getUserProjects
      (prisma.projectMember.findMany as jest.Mock).mockResolvedValue([
        { projectId: TEST_PROJECTS.project1.id }
      ]);
      
      // Mock getUserProjectRole
      (Policy.getUserProjectRole as jest.Mock).mockResolvedValue(user.role);
    } else {
      // No membership
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.projectMember.findMany as jest.Mock).mockResolvedValue([]);
    }
    
    // Mock data layer
    const mockRepos = {
      tasks: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'task-1', title: 'Test Task' })
      },
      schedule: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'event-1', title: 'Test Event' })
      },
      budget: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'budget-1', item: 'Test Item' })
      },
      procurement: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'proc-1', materialItem: 'Test Material' })
      },
      contacts: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'contact-1', name: 'Test Contact' })
      }
    };
    
    (DataLayer.createSecurityContext as jest.Mock).mockResolvedValue({
      userId: user.id,
      projectId: TEST_PROJECTS.project1.id,
      callerProjects: hasAccess ? [TEST_PROJECTS.project1.id] : []
    });
    
    (DataLayer.createRepositories as jest.Mock).mockReturnValue(mockRepos);
    
    // Mock rate limit tier
    (Policy.getRateLimitTier as jest.Mock).mockResolvedValue({
      requests: 200,
      window: 60000
    });
    
    // Mock PO number generation for procurement
    (prisma.procurement.findFirst as jest.Mock).mockResolvedValue(null);
    
    return mockRepos;
  };

  describe('Tasks API', () => {
    test('GET /tasks calls Policy.assertModuleAccess', async () => {
      const user = TEST_USERS.admin;
      setupMocks(user);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      await TasksGET(request, {});
      
      expect(Policy.assertModuleAccess).toHaveBeenCalledWith(
        user.id,
        TEST_PROJECTS.project1.id,
        Module.TASKS,
        'read'
      );
    });

    test('POST /tasks uses scoped repositories', async () => {
      const user = TEST_USERS.admin;
      const mockRepos = setupMocks(user);
      
      const request = createAuthRequest({
        method: 'POST',
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id },
        body: { title: 'New Task', description: 'Test' }
      });
      
      await TasksPOST(request, {});
      
      expect(DataLayer.createRepositories).toHaveBeenCalled();
      expect(mockRepos.tasks.create).toHaveBeenCalled();
    });
  });

  describe('Schedule API', () => {
    test('GET /schedule calls Policy.assertModuleAccess', async () => {
      const user = TEST_USERS.admin;
      setupMocks(user);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      await ScheduleGET(request, {});
      
      expect(Policy.assertModuleAccess).toHaveBeenCalledWith(
        user.id,
        TEST_PROJECTS.project1.id,
        Module.SCHEDULE,
        'read'
      );
    });

    test('POST /schedule uses scoped repositories', async () => {
      const user = TEST_USERS.admin;
      const mockRepos = setupMocks(user);
      
      const request = createAuthRequest({
        method: 'POST',
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id },
        body: {
          title: 'Test Event',
          startTime: new Date().toISOString(),
          type: 'INSPECTION',
          requiredBy: new Date().toISOString()
        }
      });
      
      await SchedulePOST(request, {});
      
      expect(DataLayer.createRepositories).toHaveBeenCalled();
      expect(mockRepos.schedule.create).toHaveBeenCalled();
    });
  });

  describe('Budget API', () => {
    test('GET /budget calls Policy.assertModuleAccess', async () => {
      const user = TEST_USERS.admin;
      setupMocks(user);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      await BudgetGET(request, {});
      
      expect(Policy.assertModuleAccess).toHaveBeenCalledWith(
        user.id,
        TEST_PROJECTS.project1.id,
        Module.BUDGET,
        'read'
      );
    });

    test('POST /budget logs policy decision', async () => {
      const user = TEST_USERS.admin;
      const mockRepos = setupMocks(user);
      
      const request = createAuthRequest({
        method: 'POST',
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id },
        body: {
          discipline: 'CONSTRUCTION',
          category: 'MATERIALS',
          item: 'Test Item',
          unit: 'EA',
          qty: 1,
          estUnitCost: 100,
          estTotal: 100,
          committedTotal: 0,
          paidToDate: 0
        }
      });
      
      await BudgetPOST(request, {});
      
      expect(Policy.logPolicyDecision).toHaveBeenCalledWith(
        user.id,
        TEST_PROJECTS.project1.id,
        Module.BUDGET,
        'write',
        true,
        'Budget item created successfully'
      );
    });
  });

  describe('Procurement API', () => {
    test('GET /procurement calls Policy.assertModuleAccess', async () => {
      const user = TEST_USERS.admin;
      setupMocks(user);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      await ProcurementGET(request, {});
      
      expect(Policy.assertModuleAccess).toHaveBeenCalledWith(
        user.id,
        TEST_PROJECTS.project1.id,
        Module.PROCUREMENT,
        'read'
      );
    });

    test('POST /procurement uses scoped repositories', async () => {
      const user = TEST_USERS.admin;
      const mockRepos = setupMocks(user);
      
      const request = createAuthRequest({
        method: 'POST',
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id },
        body: {
          materialItem: 'Test Material',
          quantity: 10,
          unit: 'EA',
          requiredBy: new Date().toISOString()
        }
      });
      
      await ProcurementPOST(request, {});
      
      expect(DataLayer.createRepositories).toHaveBeenCalled();
      expect(mockRepos.procurement.create).toHaveBeenCalled();
    });
  });

  describe('Contacts API', () => {
    test('GET /contacts calls Policy.assertModuleAccess', async () => {
      const user = TEST_USERS.admin;
      setupMocks(user);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      await ContactsGET(request, {});
      
      expect(Policy.assertModuleAccess).toHaveBeenCalledWith(
        user.id,
        TEST_PROJECTS.project1.id,
        Module.CONTACTS,
        'read'
      );
    });

    test('POST /contacts logs policy decision', async () => {
      const user = TEST_USERS.admin;
      const mockRepos = setupMocks(user);
      
      const request = createAuthRequest({
        method: 'POST',
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id },
        body: {
          name: 'Test Contact',
          email: 'test@example.com',
          phone: '555-1234',
          company: 'Test Co'
        }
      });
      
      await ContactsPOST(request, {});
      
      expect(Policy.logPolicyDecision).toHaveBeenCalledWith(
        user.id,
        TEST_PROJECTS.project1.id,
        Module.CONTACTS,
        'write',
        true,
        'Contact created successfully'
      );
    });
  });

  describe('Projects API', () => {
    test('GET /projects uses Policy.getUserProjects', async () => {
      const user = TEST_USERS.admin;
      setupMocks(user);
      
      // Mock getUserProjects
      (Policy.getUserProjects as jest.Mock).mockResolvedValue([TEST_PROJECTS.project1.id]);
      
      // Mock project findMany
      (prisma.project.findMany as jest.Mock).mockResolvedValue([TEST_PROJECTS.project1]);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid })
      });
      
      await ProjectsGET(request, {});
      
      expect(Policy.getUserProjects).toHaveBeenCalledWith(user.id);
    });

    test('POST /projects logs policy decision', async () => {
      const user = TEST_USERS.admin;
      setupMocks(user);
      
      // Mock project creation
      (prisma.project.create as jest.Mock).mockResolvedValue({
        id: 'new-project',
        name: 'New Project'
      });
      
      const request = createAuthRequest({
        method: 'POST',
        token: createMockToken({ uid: user.uid }),
        body: {
          name: 'New Project',
          description: 'Test project'
        }
      });
      
      await ProjectsPOST(request, {});
      
      expect(Policy.logPolicyDecision).toHaveBeenCalled();
    });
  });

  describe('Rate Limiting', () => {
    test('All GET endpoints apply rate limiting', async () => {
      const user = TEST_USERS.admin;
      setupMocks(user);
      
      const endpoints = [
        { handler: TasksGET, module: Module.TASKS },
        { handler: ScheduleGET, module: Module.SCHEDULE },
        { handler: BudgetGET, module: Module.BUDGET },
        { handler: ProcurementGET, module: Module.PROCUREMENT },
        { handler: ContactsGET, module: Module.CONTACTS }
      ];
      
      for (const { handler, module } of endpoints) {
        jest.clearAllMocks();
        setupMocks(user);
        
        const request = createAuthRequest({
          token: createMockToken({ uid: user.uid }),
          params: { projectId: TEST_PROJECTS.project1.id }
        });
        
        await handler(request, {});
        
        expect(Policy.getRateLimitTier).toHaveBeenCalledWith(user.id);
      }
    });
  });

  describe('Error Handling', () => {
    test('Returns 403 when user lacks access', async () => {
      const user = TEST_USERS.contractor;
      setupMocks(user, false); // No access
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await TasksGET(request, {});
      await assertErrorResponse(response, 403);
    });

    test('Handles repository errors gracefully', async () => {
      const user = TEST_USERS.admin;
      const mockRepos = setupMocks(user);
      
      // Make repository throw an error
      mockRepos.tasks.findMany.mockRejectedValue(new Error('Database error'));
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await TasksGET(request, {});
      await assertErrorResponse(response, 500);
    });
  });

  describe('Security Context Creation', () => {
    test('All routes create security context before data access', async () => {
      const user = TEST_USERS.admin;
      setupMocks(user);
      
      const endpoints = [
        TasksGET,
        ScheduleGET,
        BudgetGET,
        ProcurementGET,
        ContactsGET
      ];
      
      for (const handler of endpoints) {
        jest.clearAllMocks();
        setupMocks(user);
        
        const request = createAuthRequest({
          token: createMockToken({ uid: user.uid }),
          params: { projectId: TEST_PROJECTS.project1.id }
        });
        
        await handler(request, {});
        
        expect(DataLayer.createSecurityContext).toHaveBeenCalledWith(
          user.id,
          TEST_PROJECTS.project1.id
        );
      }
    });
  });
});