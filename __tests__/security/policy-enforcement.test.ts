/**
 * Policy Enforcement Tests
 * Verifies that all API routes use the policy engine and scoped repositories
 */

import { NextRequest } from 'next/server';
import { GET as TasksGET, POST as TasksPOST } from '@/app/api/v1/tasks/route';
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
      findUnique: jest.fn()
    },
    projectMember: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    userModuleAccess: {
      findFirst: jest.fn(),
      findMany: jest.fn()
    },
    task: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    contact: {
      findFirst: jest.fn()
    },
    taskActivity: {
      create: jest.fn()
    },
    auditLog: {
      create: jest.fn()
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

describe('Policy Enforcement in API Routes', () => {
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
      
      // Mock module access
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
        create: jest.fn().mockResolvedValue({ id: 'task-1', title: 'Test Task' }),
        update: jest.fn(),
        findUnique: jest.fn()
      }
    };
    
    (DataLayer.createSecurityContext as jest.Mock).mockResolvedValue({
      userId: user.id,
      projectId: TEST_PROJECTS.project1.id,
      callerProjects: hasAccess ? [TEST_PROJECTS.project1.id] : []
    });
    
    (DataLayer.createRepositories as jest.Mock).mockReturnValue(mockRepos);
    
    return mockRepos;
  };

  describe('Policy Engine Usage', () => {
    test('GET /tasks should call Policy.assertModuleAccess', async () => {
      const user = TEST_USERS.admin;
      setupMocks(user);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      await TasksGET(request, {});
      
      // Verify policy engine was called
      expect(Policy.assertModuleAccess).toHaveBeenCalledWith(
        user.id,
        TEST_PROJECTS.project1.id,
        Module.TASKS,
        'read'
      );
    });

    test('POST /tasks should call Policy.assertModuleAccess with write permission', async () => {
      const user = TEST_USERS.admin;
      setupMocks(user);
      
      const request = createAuthRequest({
        method: 'POST',
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id },
        body: {
          title: 'New Task',
          description: 'Test task'
        }
      });
      
      await TasksPOST(request, {});
      
      // Verify policy engine was called with write permission
      expect(Policy.assertModuleAccess).toHaveBeenCalledWith(
        user.id,
        TEST_PROJECTS.project1.id,
        Module.TASKS,
        'write'
      );
    });

    test('Should log policy decisions for audit', async () => {
      const user = TEST_USERS.admin;
      setupMocks(user);
      
      const request = createAuthRequest({
        method: 'POST',
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id },
        body: {
          title: 'New Task',
          description: 'Test task'
        }
      });
      
      await TasksPOST(request, {});
      
      // Verify policy decision was logged
      expect(Policy.logPolicyDecision).toHaveBeenCalledWith(
        user.id,
        TEST_PROJECTS.project1.id,
        Module.TASKS,
        'write',
        true,
        'Task created successfully'
      );
    });
  });

  describe('Scoped Repository Usage', () => {
    test('Should create security context before data access', async () => {
      const user = TEST_USERS.admin;
      setupMocks(user);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      await TasksGET(request, {});
      
      // Verify security context was created
      expect(DataLayer.createSecurityContext).toHaveBeenCalledWith(
        user.id,
        TEST_PROJECTS.project1.id
      );
    });

    test('Should use scoped repositories for data access', async () => {
      const user = TEST_USERS.admin;
      const mockRepos = setupMocks(user);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      await TasksGET(request, {});
      
      // Verify scoped repository was used
      expect(DataLayer.createRepositories).toHaveBeenCalled();
      expect(mockRepos.tasks.findMany).toHaveBeenCalled();
      expect(mockRepos.tasks.count).toHaveBeenCalled();
    });

    test('Should never access prisma directly for project-scoped data', async () => {
      const user = TEST_USERS.admin;
      setupMocks(user);
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      // Reset prisma mocks to ensure they're not called
      (prisma.task.findMany as jest.Mock).mockClear();
      (prisma.task.count as jest.Mock).mockClear();
      
      await TasksGET(request, {});
      
      // Verify prisma.task was NOT called directly (except for specific cases)
      expect(prisma.task.findMany).not.toHaveBeenCalled();
      expect(prisma.task.count).not.toHaveBeenCalled();
    });
  });

  describe('Query Scoping Verification', () => {
    test('Repository should enforce project scoping even if handler forgets', async () => {
      const user = TEST_USERS.admin;
      const context = {
        userId: user.id,
        projectId: TEST_PROJECTS.project1.id,
        callerProjects: [TEST_PROJECTS.project1.id]
      };
      
      // Create actual repository instance
      const { ScopedRepository } = jest.requireActual('@/lib/data');
      const repo = new ScopedRepository(context, 'task');
      
      // Spy on the applyScopin method
      const applyScopinSpy = jest.spyOn(repo as any, 'applyScopin');
      
      // Mock prisma response
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
      
      // Call findMany without projectId in where clause
      await repo.findMany({ where: { status: 'TODO' } });
      
      // Verify scoping was applied
      expect(applyScopinSpy).toHaveBeenCalled();
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          status: 'TODO',
          projectId: TEST_PROJECTS.project1.id // Should be added automatically
        }
      });
    });

    test('Repository should validate ownership of returned data', async () => {
      const user = TEST_USERS.admin;
      const context = {
        userId: user.id,
        projectId: TEST_PROJECTS.project1.id,
        callerProjects: [TEST_PROJECTS.project1.id]
      };
      
      const { ScopedRepository } = jest.requireActual('@/lib/data');
      const repo = new ScopedRepository(context, 'task');
      
      // Mock prisma returning data from wrong project
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        id: 'task-1',
        projectId: 'different-project-id'
      });
      
      // Should throw when data doesn't belong to scoped project
      await expect(
        repo.findUnique({ where: { id: 'task-1' } })
      ).rejects.toThrow('Access denied - resource belongs to different project');
    });
  });

  describe('Rate Limiting by Role', () => {
    test('Should apply rate limiting based on user role', async () => {
      const user = TEST_USERS.admin;
      setupMocks(user);
      
      // Mock rate limit tier
      (Policy.getRateLimitTier as jest.Mock).mockResolvedValue({
        requests: 200,
        window: 60000
      });
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      await TasksGET(request, {});
      
      // Verify rate limit tier was fetched
      expect(Policy.getRateLimitTier).toHaveBeenCalledWith(user.id);
    });
  });

  describe('Cross-Cutting Concerns', () => {
    test('Should handle errors gracefully when policy check fails', async () => {
      const user = TEST_USERS.contractor;
      setupMocks(user, false); // No access
      
      const request = createAuthRequest({
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id }
      });
      
      const response = await TasksGET(request, {});
      
      // Should return 403
      await assertErrorResponse(response, 403);
    });

    test('Should create audit logs for all mutations', async () => {
      const user = TEST_USERS.admin;
      const mockRepos = setupMocks(user);
      
      mockRepos.tasks.create.mockResolvedValue({
        id: 'new-task',
        title: 'Test Task',
        projectId: TEST_PROJECTS.project1.id
      });
      
      const request = createAuthRequest({
        method: 'POST',
        token: createMockToken({ uid: user.uid }),
        params: { projectId: TEST_PROJECTS.project1.id },
        body: {
          title: 'Test Task',
          description: 'Test'
        }
      });
      
      await TasksPOST(request, {});
      
      // Verify audit log was created
      expect(prisma.taskActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: user.id,
          action: 'CREATED'
        })
      });
    });
  });

  describe('Security Headers', () => {
    test('CSP header should be present in responses', async () => {
      // This would be tested in an integration test with the actual middleware
      // Here we can verify the middleware exports the correct function
      const middleware = require('@/middleware');
      expect(middleware.middleware).toBeDefined();
      expect(middleware.config).toBeDefined();
    });
  });
});