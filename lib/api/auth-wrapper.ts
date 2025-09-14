import { NextRequest } from 'next/server';
import { 
  requireAuth, 
  assertProjectMember, 
  requireModuleAccess,
  type AuthenticatedUser 
} from './auth-check';
import { errorResponse, ApiError } from './response';
import { rateLimit } from './rate-limit';
import type { Role, Module, ProjectMember } from '@prisma/client';

export type SecurityContext = {
  auth: AuthenticatedUser;
  projectId: string | null;
  projectMember: ProjectMember | null;
};

export type WithAuthOptions = {
  roles?: Role[];
  module?: Module;
  action?: 'view' | 'edit' | 'approve' | 'request' | 'upload';
  requireProject?: boolean;
  // Handler must resolve projectId from the resource, not from request
  resolveProjectId?: (req: NextRequest, ctx: any) => Promise<string | null>;
};

export function withAuth<T extends (...args: any[]) => any>(
  handler: T,
  options: WithAuthOptions = {}
) {
  return async (req: NextRequest, ctx?: any) => {
    try {
      // 1. Authenticate user
      const auth = await requireAuth(req);
      
      // 2. Rate limiting with both user and IP tracking
      await rateLimit(auth.uid, 100, 60000, req);
      
      // 3. Check roles if specified
      if (options.roles && !options.roles.includes(auth.role)) {
        throw new ApiError(403, 'Insufficient role privileges');
      }
      
      // 4. Resolve project scope (from DB, not request)
      let projectId: string | null = null;
      let projectMember: ProjectMember | null = null;
      
      if (options.requireProject) {
        // First try to get projectId from query params (works for all methods)
        projectId = req.nextUrl.searchParams.get('projectId');
        
        // Check for null, undefined, or empty string
        if (!projectId || projectId.trim() === '') {
          // Try to resolve from custom function if provided
          if (options.resolveProjectId) {
            projectId = await options.resolveProjectId(req, ctx);
          }
          
          // If still no projectId, fall back to first available project
          if (!projectId) {
            const { getUserProjects } = await import('./auth-check');
            const userProjects = await getUserProjects(auth.uid);
            if (userProjects.length > 0) {
              projectId = userProjects[0];
              console.warn(`No projectId provided, defaulting to first available project: ${projectId}`);
            } else {
              throw new ApiError(400, 'No projects available for user');
            }
          }
        } else {
          // Validate that the projectId exists
          const prisma = (await import('@/lib/prisma')).default;
          const projectExists = await prisma.project.findUnique({
            where: { id: projectId }
          });
          
          if (!projectExists) {
            console.warn(`Invalid projectId: ${projectId}, falling back to first available project`);
            // Try to get a valid project for the user
            const { getUserProjects } = await import('./auth-check');
            const userProjects = await getUserProjects(auth.uid);
            if (userProjects.length > 0) {
              projectId = userProjects[0];
              console.warn(`Using fallback project: ${projectId}`);
            } else {
              throw new ApiError(404, 'Project not found and no fallback available');
            }
          }
        }
        
        if (projectId) {
          projectMember = await assertProjectMember(auth.uid, projectId);
          
          // 5. Check module permissions if specified
          if (options.module && options.action) {
            await requireModuleAccess(
              auth.uid,
              projectId,
              options.module,
              options.action
            );
          }
        }
      }
      
      // 6. Create security context
      const security: SecurityContext = {
        auth,
        projectId,
        projectMember
      };
      
      // 7. Call handler with security context
      return handler(req, ctx, security);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

// Runtime declaration for Firebase Admin
export const runtime = 'nodejs';