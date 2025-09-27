/**
 * Centralized Policy Engine
 * All authorization decisions flow through this module
 */

import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api/response';
import type { Role, Module, ProjectMember, User } from '@prisma/client';

// Permission types for fine-grained access control
export type Permission = 'read' | 'write' | 'export' | 'delete' | 'approve';

// Rate limit tiers based on role
export const RATE_LIMIT_TIERS = {
  ADMIN: { requests: 200, window: 60000 },      // 200 req/min
  STAFF: { requests: 150, window: 60000 },      // 150 req/min
  CONTRACTOR: { requests: 100, window: 60000 }, // 100 req/min
  VIEWER: { requests: 50, window: 60000 }        // 50 req/min
} as const;

// Time-of-day access windows (optional feature)
export interface AccessWindow {
  startHour: number; // 0-23
  endHour: number;   // 0-23
  timezone: string;  // e.g., 'America/New_York'
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
}

/**
 * Assert user is a member of the project
 * @throws ApiError if not a member
 */
export async function assertMember(
  userId: string, 
  projectId: string
): Promise<ProjectMember> {
  if (!userId || !projectId) {
    throw new ApiError(400, 'User ID and Project ID are required');
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId
      }
    }
  });

  if (!member) {
    throw new ApiError(403, 'Not a member of this project');
  }

  return member;
}

/**
 * Assert user has specific module access with permission
 * @throws ApiError if access denied
 */
export async function assertModuleAccess(
  userId: string,
  projectId: string,
  module: Module,
  permission: Permission
): Promise<void> {
  // First verify project membership
  const member = await assertMember(userId, projectId);

  // Check module access
  const access = await prisma.userModuleAccess.findFirst({
    where: {
      userId,
      projectId,
      module
    }
  });

  if (!access) {
    throw new ApiError(403, `No ${module} access for this project`);
  }

  // Check specific permission
  switch (permission) {
    case 'read':
      if (!access.canView) {
        throw new ApiError(403, `No read permission for ${module}`);
      }
      break;
    
    case 'write':
      if (!access.canEdit) {
        throw new ApiError(403, `No write permission for ${module}`);
      }
      break;
    
    case 'export':
      // Export requires view permission minimum
      if (!access.canView) {
        throw new ApiError(403, `No export permission for ${module}`);
      }
      break;
    
    case 'delete':
      // Delete requires edit permission
      if (!access.canEdit) {
        throw new ApiError(403, `No delete permission for ${module}`);
      }
      break;
    
    case 'approve':
      // Approve requires special permission or ADMIN/STAFF role
      if (!access.canEdit || !['ADMIN', 'STAFF'].includes(member.role)) {
        throw new ApiError(403, `No approve permission for ${module}`);
      }
      break;
    
    default:
      throw new ApiError(400, `Unknown permission: ${permission}`);
  }
}

/**
 * Get user's role in a project
 */
export async function getUserProjectRole(
  userId: string,
  projectId: string
): Promise<Role | null> {
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId
      }
    }
  });

  return member?.role || null;
}

/**
 * Get all projects user has access to
 */
export async function getUserProjects(userId: string): Promise<string[]> {
  // Get user to check their role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true }
  });

  if (!user) {
    console.log('[Policy] User not found:', userId);
    return [];
  }

  console.log('[Policy] Getting projects for user:', user.email, 'with role:', user.role);

  // For ADMIN/STAFF users, ensure Miami Duplex access
  if (user.role === 'ADMIN' || user.role === 'STAFF') {
    // First check if Miami Duplex exists
    let miamiDuplex = await prisma.project.findFirst({
      where: { name: 'Miami Duplex Remodel' }
    });

    if (!miamiDuplex) {
      console.log('[Policy] Creating Miami Duplex project for admin user');
      miamiDuplex = await prisma.project.create({
        data: {
          name: 'Miami Duplex Remodel',
          status: 'ACTIVE',
          projectType: 'RENOVATION',
          description: 'Complete renovation of Miami duplex property',
          color: '#3B82F6',
          address: 'Miami, FL',
          clientName: 'FAXAS Property Management',
          totalBudget: 500000,
          contingency: 50000,
          timezone: 'America/New_York'
        }
      });
      console.log('[Policy] Miami Duplex created with ID:', miamiDuplex.id);
    }

    // Check if user has membership
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: miamiDuplex.id,
          userId: userId
        }
      }
    });

    if (!membership) {
      console.log('[Policy] Creating Miami Duplex membership for admin user');
      await prisma.projectMember.create({
        data: {
          projectId: miamiDuplex.id,
          userId: userId,
          role: user.role
        }
      });
    }
  }

  // Now get all memberships
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true }
  });

  const projectIds = memberships.map(m => m.projectId);
  console.log('[Policy] User has access to', projectIds.length, 'projects:', projectIds);

  return projectIds;
}

/**
 * Check if user has any of the specified roles
 */
export async function hasRole(
  userId: string,
  projectId: string,
  allowedRoles: Role[]
): Promise<boolean> {
  const role = await getUserProjectRole(userId, projectId);
  return role ? allowedRoles.includes(role) : false;
}

/**
 * Get rate limit tier for user
 */
export async function getRateLimitTier(userId: string): Promise<typeof RATE_LIMIT_TIERS[keyof typeof RATE_LIMIT_TIERS]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (!user) {
    return RATE_LIMIT_TIERS.VIEWER; // Most restrictive by default
  }

  return RATE_LIMIT_TIERS[user.role] || RATE_LIMIT_TIERS.VIEWER;
}

/**
 * Check if current time is within access window
 */
export function isWithinAccessWindow(window: AccessWindow): boolean {
  const now = new Date();
  
  // Convert to timezone if specified
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    hour12: false,
    timeZone: window.timezone
  };
  
  const currentHour = parseInt(
    new Intl.DateTimeFormat('en-US', options).format(now)
  );
  
  // Check hour range
  let inTimeRange = false;
  if (window.startHour <= window.endHour) {
    inTimeRange = currentHour >= window.startHour && currentHour < window.endHour;
  } else {
    // Handles overnight windows (e.g., 22:00 - 02:00)
    inTimeRange = currentHour >= window.startHour || currentHour < window.endHour;
  }
  
  // Check day of week if specified
  if (window.daysOfWeek && window.daysOfWeek.length > 0) {
    const currentDay = now.getDay();
    if (!window.daysOfWeek.includes(currentDay)) {
      return false;
    }
  }
  
  return inTimeRange;
}

/**
 * Apply data redaction based on role
 */
export function applyDataRedaction<T extends Record<string, any>>(
  data: T,
  role: Role,
  module: Module
): T {
  // Contractors get redacted budget data
  if (role === 'CONTRACTOR' && module === 'BUDGET') {
    const redacted = { ...data };
    const costFields = [
      'estUnitCost', 'estTotal', 'committedTotal', 
      'paidToDate', 'variance', 'varianceAmount', 'variancePercent',
      'unitCost', 'totalCost', 'cost', 'amount', 'value'
    ];
    
    costFields.forEach(field => {
      if (field in redacted) {
        delete redacted[field];
      }
    });
    
    return redacted;
  }
  
  // Viewers get limited data across all modules
  if (role === 'VIEWER') {
    const redacted = { ...data };
    const sensitiveFields = ['cost', 'price', 'amount', 'rate', 'salary'];
    
    sensitiveFields.forEach(field => {
      if (field in redacted) {
        delete redacted[field];
      }
    });
    
    return redacted;
  }
  
  return data;
}

/**
 * Batch check multiple permissions
 */
export async function assertMultipleAccess(
  userId: string,
  projectId: string,
  permissions: Array<{ module: Module; permission: Permission }>
): Promise<void> {
  // Verify membership once
  await assertMember(userId, projectId);
  
  // Check each permission
  for (const { module, permission } of permissions) {
    await assertModuleAccess(userId, projectId, module, permission);
  }
}

/**
 * Get effective permissions for a user in a project
 */
export async function getEffectivePermissions(
  userId: string,
  projectId: string
): Promise<Map<Module, Set<Permission>>> {
  const member = await assertMember(userId, projectId);
  
  const moduleAccess = await prisma.userModuleAccess.findMany({
    where: {
      userId,
      projectId
    }
  });
  
  const permissions = new Map<Module, Set<Permission>>();
  
  for (const access of moduleAccess) {
    const perms = new Set<Permission>();
    
    if (access.canView) perms.add('read');
    if (access.canView) perms.add('export');
    if (access.canEdit) perms.add('write');
    if (access.canEdit) perms.add('delete');
    
    // Approve permission for ADMIN/STAFF
    if (access.canEdit && ['ADMIN', 'STAFF'].includes(member.role)) {
      perms.add('approve');
    }
    
    permissions.set(access.module, perms);
  }
  
  return permissions;
}

/**
 * Audit log helper
 */
export async function logPolicyDecision(
  userId: string,
  projectId: string,
  module: Module,
  permission: Permission,
  granted: boolean,
  reason?: string
): Promise<void> {
  // This could write to a policy audit log for compliance
  // For now, we'll use console.log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Policy Decision:', {
      userId,
      projectId,
      module,
      permission,
      granted,
      reason,
      timestamp: new Date().toISOString()
    });
  }
}

// Export all functions as a namespace for cleaner imports
export const Policy = {
  assertMember,
  assertModuleAccess,
  getUserProjectRole,
  getUserProjects,
  hasRole,
  getRateLimitTier,
  isWithinAccessWindow,
  applyDataRedaction,
  assertMultipleAccess,
  getEffectivePermissions,
  logPolicyDecision
};