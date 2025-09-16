import { Module, Role } from '@prisma/client';
import prisma from './prisma';
import { AuthUser } from './auth';

export async function checkModuleAccess(
  userId: string,
  projectId: string,
  module: Module,
  permission: 'view' | 'edit' | 'upload' | 'request' = 'view'
): Promise<boolean> {
  try {
    const access = await prisma.userModuleAccess.findUnique({
      where: {
        userId_projectId_module: {
          userId,
          projectId,
          module
        }
      }
    });

    if (!access) return false;

    switch (permission) {
      case 'view':
        return access.canView;
      case 'edit':
        return access.canEdit;
      case 'upload':
        return access.canUpload;
      case 'request':
        return access.canRequest;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking module access:', error);
    return false;
  }
}

export function requireRoleMiddleware(role: Role | Role[]) {
  const allowedRoles = Array.isArray(role) ? role : [role];
  
  return (user: AuthUser | null) => {
    if (!user) {
      throw new Error('Unauthorized: No user found');
    }
    
    if (!allowedRoles.includes(user.role)) {
      throw new Error('Forbidden: Insufficient permissions');
    }
    
    return true;
  };
}

export const ACCESS_PRESETS = {
  FIELD_CONTRACTOR: [
    { module: Module.TASKS, canView: true, canEdit: false, canUpload: false, canRequest: false },
    { module: Module.SCHEDULE, canView: true, canEdit: false, canUpload: false, canRequest: true },
    { module: Module.PLANS, canView: true, canEdit: false, canUpload: false, canRequest: false },
    { module: Module.UPLOADS, canView: true, canEdit: false, canUpload: true, canRequest: false },
    { module: Module.INVOICES, canView: true, canEdit: false, canUpload: true, canRequest: false },
  ],
  SUPPLIER: [
    { module: Module.PROCUREMENT_READ, canView: true, canEdit: false, canUpload: false, canRequest: false },
    { module: Module.INVOICES, canView: true, canEdit: false, canUpload: true, canRequest: false },
  ],
  VIEWER: [
    { module: Module.PLANS, canView: true, canEdit: false, canUpload: false, canRequest: false },
    { module: Module.DOCS_READ, canView: true, canEdit: false, canUpload: false, canRequest: false },
  ],
};

export async function applyAccessPreset(
  userId: string,
  projectId: string,
  preset: keyof typeof ACCESS_PRESETS
): Promise<void> {
  const modules = ACCESS_PRESETS[preset];
  
  for (const moduleAccess of modules) {
    await prisma.userModuleAccess.upsert({
      where: {
        userId_projectId_module: {
          userId,
          projectId,
          module: moduleAccess.module,
        },
      },
      update: {
        canView: moduleAccess.canView,
        canEdit: moduleAccess.canEdit,
        canUpload: moduleAccess.canUpload,
        canRequest: moduleAccess.canRequest,
      },
      create: {
        userId,
        projectId,
        module: moduleAccess.module,
        canView: moduleAccess.canView,
        canEdit: moduleAccess.canEdit,
        canUpload: moduleAccess.canUpload,
        canRequest: moduleAccess.canRequest,
      },
    });
  }
}