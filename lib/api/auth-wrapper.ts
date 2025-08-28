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

export function withAuth<T extends Function>(
  handler: T,
  options: WithAuthOptions = {}
) {
  return async (req: NextRequest, ctx?: any) => {
    try {
      // 1. Authenticate user
      const auth = await requireAuth();
      
      // 2. Rate limiting (will implement with Redis/Upstash)
      await rateLimit(auth.uid);
      
      // 3. Check roles if specified
      if (options.roles && !options.roles.includes(auth.role)) {
        throw new ApiError(403, 'Insufficient role privileges');
      }
      
      // 4. Resolve project scope (from DB, not request)
      let projectId: string | null = null;
      let projectMember: ProjectMember | null = null;
      
      if (options.requireProject) {
        // For GET requests, projectId comes from query params
        if (req.method === 'GET') {
          projectId = req.nextUrl.searchParams.get('projectId');
          if (!projectId) {
            throw new ApiError(400, 'Project ID required');
          }
        } else if (options.resolveProjectId) {
          // For mutations, resolve from resource
          projectId = await options.resolveProjectId(req, ctx);
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