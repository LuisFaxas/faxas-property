/**
 * Base Repository with Tenant Scoping
 * All data access MUST go through these repositories to ensure project scoping
 */

import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api/response';
import { Policy } from '@/lib/policy';
import type { Prisma } from '@prisma/client';

export interface ScopedContext {
  userId: string;
  projectId: string;
  callerProjects: string[]; // All projects user has access to
}

/**
 * Base repository class that enforces tenant scoping
 */
export abstract class BaseRepository<T> {
  protected context: ScopedContext;
  protected modelName: string;

  constructor(context: ScopedContext, modelName: string) {
    if (!context.userId || !context.projectId) {
      throw new ApiError(400, 'Invalid security context');
    }
    
    // Verify caller has access to the specified project
    if (!context.callerProjects.includes(context.projectId)) {
      throw new ApiError(403, 'Project access denied');
    }
    
    this.context = context;
    this.modelName = modelName;
  }

  /**
   * Apply project scoping to any where clause
   */
  protected applyScopin(where: any = {}): any {
    return {
      ...where,
      projectId: this.context.projectId
    };
  }

  /**
   * Ensure query results belong to the scoped project
   */
  protected validateOwnership(data: any): void {
    if (!data) return;
    
    const items = Array.isArray(data) ? data : [data];
    
    for (const item of items) {
      if (item.projectId && item.projectId !== this.context.projectId) {
        throw new ApiError(403, 'Access denied - resource belongs to different project');
      }
    }
  }

  /**
   * Create audit log entry
   */
  protected async audit(
    action: string,
    entityId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: this.context.userId,
        action,
        entity: this.modelName,
        entityId: entityId || '',
        meta: metadata || {}
      }
    });
  }
}

/**
 * Generic scoped repository for any model
 */
export class ScopedRepository<T> extends BaseRepository<T> {
  private model: any;

  constructor(
    context: ScopedContext,
    modelName: keyof typeof prisma,
    private skipProjectScope = false // For models without projectId
  ) {
    super(context, String(modelName));
    this.model = (prisma as any)[modelName];
    
    if (!this.model) {
      throw new ApiError(500, `Invalid model: ${String(modelName)}`);
    }
  }

  async findMany(args?: any): Promise<T[]> {
    const scopedArgs = {
      ...args,
      where: this.skipProjectScope ? args?.where : this.applyScopin(args?.where)
    };
    
    const results = await this.model.findMany(scopedArgs);
    
    if (!this.skipProjectScope) {
      this.validateOwnership(results);
    }
    
    return results;
  }

  async findUnique(args: any): Promise<T | null> {
    const result = await this.model.findUnique(args);
    
    if (result && !this.skipProjectScope) {
      this.validateOwnership(result);
    }
    
    return result;
  }

  async findFirst(args?: any): Promise<T | null> {
    const scopedArgs = {
      ...args,
      where: this.skipProjectScope ? args?.where : this.applyScopin(args?.where)
    };
    
    const result = await this.model.findFirst(scopedArgs);
    
    if (result && !this.skipProjectScope) {
      this.validateOwnership(result);
    }
    
    return result;
  }

  async create(args: any): Promise<T> {
    const scopedData = this.skipProjectScope ? args.data : {
      ...args.data,
      projectId: this.context.projectId
    };
    
    const result = await this.model.create({
      ...args,
      data: scopedData
    });
    
    await this.audit('CREATE', (result as any).id);
    
    return result;
  }

  async update(args: any): Promise<T> {
    // First verify the record belongs to this project
    const existing = await this.model.findUnique({ where: args.where });
    
    if (!existing) {
      throw new ApiError(404, 'Resource not found');
    }
    
    if (!this.skipProjectScope) {
      this.validateOwnership(existing);
    }
    
    const result = await this.model.update(args);
    
    await this.audit('UPDATE', (result as any).id);
    
    return result;
  }

  async delete(args: any): Promise<T> {
    // First verify the record belongs to this project
    const existing = await this.model.findUnique({ where: args.where });
    
    if (!existing) {
      throw new ApiError(404, 'Resource not found');
    }
    
    if (!this.skipProjectScope) {
      this.validateOwnership(existing);
    }
    
    const result = await this.model.delete(args);
    
    await this.audit('DELETE', (result as any).id);
    
    return result;
  }

  async count(args?: any): Promise<number> {
    const scopedArgs = {
      ...args,
      where: this.skipProjectScope ? args?.where : this.applyScopin(args?.where)
    };
    
    return await this.model.count(scopedArgs);
  }

  async aggregate(args: any): Promise<any> {
    const scopedArgs = {
      ...args,
      where: this.skipProjectScope ? args?.where : this.applyScopin(args?.where)
    };
    
    return await this.model.aggregate(scopedArgs);
  }

  async groupBy(args: any): Promise<any> {
    const scopedArgs = {
      ...args,
      where: this.skipProjectScope ? args?.where : this.applyScopin(args?.where)
    };
    
    return await this.model.groupBy(scopedArgs);
  }

  /**
   * Execute raw SQL with project scoping
   */
  async executeRaw(sql: string, params: any[] = []): Promise<any> {
    if (!this.skipProjectScope) {
      // Ensure SQL includes project scoping
      if (!sql.toLowerCase().includes('project_id')) {
        throw new ApiError(500, 'Raw query must include project_id filter');
      }
      
      // Add projectId to params if not present
      if (!params.includes(this.context.projectId)) {
        params.push(this.context.projectId);
      }
    }
    
    return await prisma.$executeRaw`${sql}`;
  }
}

/**
 * Create a scoped repository instance
 */
export function createScopedRepository<T>(
  context: ScopedContext,
  modelName: keyof typeof prisma,
  skipProjectScope = false
): ScopedRepository<T> {
  return new ScopedRepository<T>(context, modelName, skipProjectScope);
}

/**
 * Helper to get security context from authenticated user
 */
export async function createSecurityContext(
  userId: string,
  projectId: string
): Promise<ScopedContext> {
  // Get all projects user has access to
  const callerProjects = await Policy.getUserProjects(userId);
  
  if (!callerProjects.includes(projectId)) {
    throw new ApiError(403, 'Not authorized for this project');
  }
  
  return {
    userId,
    projectId,
    callerProjects
  };
}