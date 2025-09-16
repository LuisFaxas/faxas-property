/**
 * Unit Tests for Policy Engine
 */

import { Policy, RATE_LIMIT_TIERS, type AccessWindow } from '../index';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api/response';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    projectMember: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    userModuleAccess: {
      findFirst: jest.fn(),
      findMany: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    },
    auditLog: {
      create: jest.fn()
    }
  }
}));

describe('Policy Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('assertMember', () => {
    test('should pass for valid project member', async () => {
      const mockMember = { 
        userId: 'user-1', 
        projectId: 'project-1', 
        role: 'STAFF' 
      };
      
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(mockMember);
      
      const result = await Policy.assertMember('user-1', 'project-1');
      
      expect(result).toEqual(mockMember);
      expect(prisma.projectMember.findUnique).toHaveBeenCalledWith({
        where: {
          projectId_userId: {
            projectId: 'project-1',
            userId: 'user-1'
          }
        }
      });
    });

    test('should throw error for non-member', async () => {
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(null);
      
      await expect(
        Policy.assertMember('user-1', 'project-1')
      ).rejects.toThrow('Not a member of this project');
    });

    test('should throw error for missing parameters', async () => {
      await expect(
        Policy.assertMember('', 'project-1')
      ).rejects.toThrow('User ID and Project ID are required');
      
      await expect(
        Policy.assertMember('user-1', '')
      ).rejects.toThrow('User ID and Project ID are required');
    });
  });

  describe('assertModuleAccess', () => {
    beforeEach(() => {
      const mockMember = { 
        userId: 'user-1', 
        projectId: 'project-1', 
        role: 'STAFF' 
      };
      
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(mockMember);
    });

    test('should pass for read permission when canView is true', async () => {
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue({
        canView: true,
        canEdit: false
      });
      
      await expect(
        Policy.assertModuleAccess('user-1', 'project-1', 'TASKS', 'read')
      ).resolves.not.toThrow();
    });

    test('should throw for write permission when canEdit is false', async () => {
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue({
        canView: true,
        canEdit: false
      });
      
      await expect(
        Policy.assertModuleAccess('user-1', 'project-1', 'TASKS', 'write')
      ).rejects.toThrow('No write permission for TASKS');
    });

    test('should throw for approve permission for non-ADMIN/STAFF', async () => {
      const mockMember = { 
        userId: 'user-1', 
        projectId: 'project-1', 
        role: 'CONTRACTOR' 
      };
      
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(mockMember);
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue({
        canView: true,
        canEdit: true
      });
      
      await expect(
        Policy.assertModuleAccess('user-1', 'project-1', 'TASKS', 'approve')
      ).rejects.toThrow('No approve permission for TASKS');
    });

    test('should pass for approve permission for ADMIN', async () => {
      const mockMember = { 
        userId: 'user-1', 
        projectId: 'project-1', 
        role: 'ADMIN' 
      };
      
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(mockMember);
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue({
        canView: true,
        canEdit: true
      });
      
      await expect(
        Policy.assertModuleAccess('user-1', 'project-1', 'TASKS', 'approve')
      ).resolves.not.toThrow();
    });

    test('should throw for no module access', async () => {
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue(null);
      
      await expect(
        Policy.assertModuleAccess('user-1', 'project-1', 'TASKS', 'read')
      ).rejects.toThrow('No TASKS access for this project');
    });
  });

  describe('getUserProjectRole', () => {
    test('should return role for project member', async () => {
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        projectId: 'project-1',
        role: 'ADMIN'
      });
      
      const role = await Policy.getUserProjectRole('user-1', 'project-1');
      
      expect(role).toBe('ADMIN');
    });

    test('should return null for non-member', async () => {
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(null);
      
      const role = await Policy.getUserProjectRole('user-1', 'project-1');
      
      expect(role).toBeNull();
    });
  });

  describe('getUserProjects', () => {
    test('should return all user projects', async () => {
      (prisma.projectMember.findMany as jest.Mock).mockResolvedValue([
        { projectId: 'project-1' },
        { projectId: 'project-2' },
        { projectId: 'project-3' }
      ]);
      
      const projects = await Policy.getUserProjects('user-1');
      
      expect(projects).toEqual(['project-1', 'project-2', 'project-3']);
    });

    test('should return empty array for user with no projects', async () => {
      (prisma.projectMember.findMany as jest.Mock).mockResolvedValue([]);
      
      const projects = await Policy.getUserProjects('user-1');
      
      expect(projects).toEqual([]);
    });
  });

  describe('hasRole', () => {
    test('should return true for allowed role', async () => {
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        projectId: 'project-1',
        role: 'ADMIN'
      });
      
      const hasRole = await Policy.hasRole('user-1', 'project-1', ['ADMIN', 'STAFF']);
      
      expect(hasRole).toBe(true);
    });

    test('should return false for disallowed role', async () => {
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        projectId: 'project-1',
        role: 'CONTRACTOR'
      });
      
      const hasRole = await Policy.hasRole('user-1', 'project-1', ['ADMIN', 'STAFF']);
      
      expect(hasRole).toBe(false);
    });

    test('should return false for non-member', async () => {
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(null);
      
      const hasRole = await Policy.hasRole('user-1', 'project-1', ['ADMIN']);
      
      expect(hasRole).toBe(false);
    });
  });

  describe('getRateLimitTier', () => {
    test('should return correct tier for ADMIN', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'ADMIN' });
      
      const tier = await Policy.getRateLimitTier('user-1');
      
      expect(tier).toEqual(RATE_LIMIT_TIERS.ADMIN);
    });

    test('should return VIEWER tier for unknown user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      
      const tier = await Policy.getRateLimitTier('user-1');
      
      expect(tier).toEqual(RATE_LIMIT_TIERS.VIEWER);
    });
  });

  describe('isWithinAccessWindow', () => {
    test('should return true for current time within window', () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      const window: AccessWindow = {
        startHour: Math.max(0, currentHour - 1),
        endHour: Math.min(23, currentHour + 1),
        timezone: 'UTC'
      };
      
      expect(Policy.isWithinAccessWindow(window)).toBe(true);
    });

    test('should return false for current time outside window', () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      const window: AccessWindow = {
        startHour: (currentHour + 2) % 24,
        endHour: (currentHour + 3) % 24,
        timezone: 'UTC'
      };
      
      expect(Policy.isWithinAccessWindow(window)).toBe(false);
    });

    test('should handle overnight windows', () => {
      const window: AccessWindow = {
        startHour: 22,
        endHour: 2,
        timezone: 'UTC'
      };
      
      // Mock current time to 23:00
      const originalDate = global.Date;
      global.Date = jest.fn(() => ({
        getHours: () => 23,
        getDay: () => 1
      })) as any;
      
      expect(Policy.isWithinAccessWindow(window)).toBe(true);
      
      global.Date = originalDate;
    });

    test('should respect day of week restrictions', () => {
      const today = new Date().getDay();
      
      const window: AccessWindow = {
        startHour: 0,
        endHour: 23,
        timezone: 'UTC',
        daysOfWeek: [today]
      };
      
      expect(Policy.isWithinAccessWindow(window)).toBe(true);
      
      window.daysOfWeek = [(today + 1) % 7];
      expect(Policy.isWithinAccessWindow(window)).toBe(false);
    });
  });

  describe('applyDataRedaction', () => {
    test('should redact budget data for CONTRACTOR', () => {
      const data = {
        id: '1',
        item: 'Materials',
        estUnitCost: 100,
        estTotal: 1000,
        committedTotal: 500,
        paidToDate: 200,
        variance: 300,
        description: 'Construction materials'
      };
      
      const redacted = Policy.applyDataRedaction(data, 'CONTRACTOR', 'BUDGET');
      
      expect(redacted).not.toHaveProperty('estUnitCost');
      expect(redacted).not.toHaveProperty('estTotal');
      expect(redacted).not.toHaveProperty('committedTotal');
      expect(redacted).not.toHaveProperty('paidToDate');
      expect(redacted).not.toHaveProperty('variance');
      expect(redacted).toHaveProperty('item');
      expect(redacted).toHaveProperty('description');
    });

    test('should not redact data for ADMIN', () => {
      const data = {
        id: '1',
        item: 'Materials',
        estTotal: 1000
      };
      
      const result = Policy.applyDataRedaction(data, 'ADMIN', 'BUDGET');
      
      expect(result).toEqual(data);
    });

    test('should redact sensitive fields for VIEWER', () => {
      const data = {
        id: '1',
        name: 'Item',
        cost: 100,
        price: 200,
        amount: 300
      };
      
      const redacted = Policy.applyDataRedaction(data, 'VIEWER', 'PROCUREMENT');
      
      expect(redacted).not.toHaveProperty('cost');
      expect(redacted).not.toHaveProperty('price');
      expect(redacted).not.toHaveProperty('amount');
      expect(redacted).toHaveProperty('name');
    });
  });

  describe('assertMultipleAccess', () => {
    test('should pass when all permissions are granted', async () => {
      const mockMember = { 
        userId: 'user-1', 
        projectId: 'project-1', 
        role: 'ADMIN' 
      };
      
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(mockMember);
      (prisma.userModuleAccess.findFirst as jest.Mock).mockResolvedValue({
        canView: true,
        canEdit: true
      });
      
      await expect(
        Policy.assertMultipleAccess('user-1', 'project-1', [
          { module: 'TASKS', permission: 'read' },
          { module: 'BUDGET', permission: 'write' }
        ])
      ).resolves.not.toThrow();
    });

    test('should throw when any permission is denied', async () => {
      const mockMember = { 
        userId: 'user-1', 
        projectId: 'project-1', 
        role: 'CONTRACTOR' 
      };
      
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(mockMember);
      (prisma.userModuleAccess.findFirst as jest.Mock)
        .mockResolvedValueOnce({ canView: true, canEdit: true })
        .mockResolvedValueOnce({ canView: true, canEdit: false });
      
      await expect(
        Policy.assertMultipleAccess('user-1', 'project-1', [
          { module: 'TASKS', permission: 'write' },
          { module: 'BUDGET', permission: 'write' }
        ])
      ).rejects.toThrow('No write permission for BUDGET');
    });
  });

  describe('getEffectivePermissions', () => {
    test('should return all permissions for user', async () => {
      const mockMember = { 
        userId: 'user-1', 
        projectId: 'project-1', 
        role: 'ADMIN' 
      };
      
      (prisma.projectMember.findUnique as jest.Mock).mockResolvedValue(mockMember);
      (prisma.userModuleAccess.findMany as jest.Mock).mockResolvedValue([
        { module: 'TASKS', canView: true, canEdit: true },
        { module: 'BUDGET', canView: true, canEdit: false },
        { module: 'CONTACTS', canView: false, canEdit: false }
      ]);
      
      const permissions = await Policy.getEffectivePermissions('user-1', 'project-1');
      
      expect(permissions.get('TASKS')).toContain('read');
      expect(permissions.get('TASKS')).toContain('write');
      expect(permissions.get('TASKS')).toContain('approve'); // ADMIN gets approve
      
      expect(permissions.get('BUDGET')).toContain('read');
      expect(permissions.get('BUDGET')).not.toContain('write');
      
      expect(permissions.get('CONTACTS')).toBeUndefined();
    });
  });
});