/**
 * Domain-Specific Scoped Repositories
 * These repositories provide business logic on top of base scoping
 */

import { ScopedRepository, ScopedContext, BaseRepository } from './base-repository';
import { Policy } from '@/lib/policy';
import { ApiError } from '@/lib/api/response';
import { prisma } from '@/lib/prisma';
import type { Task, BudgetItem, Procurement, Contact, ScheduleEvent, Project, Module } from '@prisma/client';

/**
 * Task Repository with business logic
 */
export class TaskRepository extends ScopedRepository<Task> {
  constructor(context: ScopedContext) {
    super(context, 'task');
  }

  async findWithAssignees(taskId: string) {
    const task = await this.findFirst({
      where: { id: taskId },
      include: {
        assignedTo: true,
        assignedContact: true,
        subtasks: true,
        attachments: true
      }
    });
    
    if (!task) {
      throw new ApiError(404, 'Task not found');
    }
    
    return task;
  }

  async updateStatus(taskId: string, status: string, userId: string) {
    // Verify task exists and belongs to project
    const task = await this.findUnique({ where: { id: taskId } });
    
    if (!task) {
      throw new ApiError(404, 'Task not found');
    }
    
    // Update with status change tracking
    const updated = await this.update({
      where: { id: taskId },
      data: {
        status,
        updatedBy: userId,
        updatedAt: new Date()
      }
    });
    
    // Create activity log
    await prisma.taskActivity.create({
      data: {
        taskId,
        userId,
        action: 'STATUS_CHANGE',
        description: `Status changed to ${status}`,
        metadata: { previousStatus: task.status, newStatus: status }
      }
    });
    
    return updated;
  }
}

/**
 * Budget Repository with cost redaction
 */
export class BudgetRepository extends ScopedRepository<BudgetItem> {
  private userRole: string | null = null;

  constructor(context: ScopedContext) {
    super(context, 'budgetItem');
  }

  async setUserRole(role: string) {
    this.userRole = role;
  }

  async findMany(args?: any): Promise<BudgetItem[]> {
    const items = await super.findMany(args);
    
    // Apply redaction for contractors
    if (this.userRole === 'CONTRACTOR') {
      return items.map(item => Policy.applyDataRedaction(item, 'CONTRACTOR', 'BUDGET'));
    }
    
    return items;
  }

  async findUnique(args: any): Promise<BudgetItem | null> {
    const item = await super.findUnique(args);
    
    if (item && this.userRole === 'CONTRACTOR') {
      return Policy.applyDataRedaction(item, 'CONTRACTOR', 'BUDGET');
    }
    
    return item;
  }

  async calculateTotals() {
    const items = await this.findMany();
    
    const totals = {
      estimatedTotal: 0,
      committedTotal: 0,
      paidToDate: 0,
      variance: 0
    };
    
    // Only calculate if user can see costs
    if (this.userRole !== 'CONTRACTOR') {
      items.forEach(item => {
        totals.estimatedTotal += Number(item.estTotal) || 0;
        totals.committedTotal += Number(item.committedTotal) || 0;
        totals.paidToDate += Number(item.paidToDate) || 0;
      });
      
      totals.variance = totals.estimatedTotal - totals.committedTotal;
    }
    
    return totals;
  }
}

/**
 * Procurement Repository with role restrictions
 */
export class ProcurementRepository extends ScopedRepository<Procurement> {
  constructor(context: ScopedContext) {
    super(context, 'procurement');
  }

  async create(data: any): Promise<Procurement> {
    // Only ADMIN/STAFF can create procurement items
    const role = await Policy.getUserProjectRole(this.context.userId, this.context.projectId);
    
    if (!role || !['ADMIN', 'STAFF'].includes(role)) {
      throw new ApiError(403, 'Only ADMIN/STAFF can create procurement items');
    }
    
    return super.create({ data });
  }

  async approve(procurementId: string, approverId: string) {
    // Only ADMIN/STAFF can approve
    const role = await Policy.getUserProjectRole(approverId, this.context.projectId);
    
    if (!role || !['ADMIN', 'STAFF'].includes(role)) {
      throw new ApiError(403, 'Only ADMIN/STAFF can approve procurement items');
    }
    
    return this.update({
      where: { id: procurementId },
      data: {
        orderStatus: 'APPROVED',
        approvedBy: approverId,
        approvedAt: new Date()
      }
    });
  }
}

/**
 * Contact Repository with portal access management
 */
export class ContactRepository extends ScopedRepository<Contact> {
  constructor(context: ScopedContext) {
    super(context, 'contact');
  }

  async createWithPortalAccess(data: any, sendInvite: boolean = false) {
    const contact = await this.create({ data });
    
    if (sendInvite && data.email) {
      // Create portal invitation
      await prisma.portalInvitation.create({
        data: {
          contactId: contact.id,
          email: data.email,
          projectId: this.context.projectId,
          invitedBy: this.context.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });
    }
    
    return contact;
  }

  async revokePortalAccess(contactId: string) {
    const contact = await this.findUnique({ where: { id: contactId } });
    
    if (!contact) {
      throw new ApiError(404, 'Contact not found');
    }
    
    if (contact.userId) {
      // Remove user association
      await this.update({
        where: { id: contactId },
        data: { userId: null }
      });
      
      // Also remove from project members
      await prisma.projectMember.deleteMany({
        where: {
          userId: contact.userId,
          projectId: this.context.projectId
        }
      });
    }
    
    return contact;
  }
}

/**
 * Schedule Repository with conflict detection
 */
export class ScheduleRepository extends ScopedRepository<ScheduleEvent> {
  constructor(context: ScopedContext) {
    super(context, 'scheduleEvent');
  }

  async checkConflicts(start: Date, end: Date, excludeId?: string) {
    const where: any = {
      projectId: this.context.projectId,
      OR: [
        {
          AND: [
            { start: { lte: start } },
            { end: { gte: start } }
          ]
        },
        {
          AND: [
            { start: { lte: end } },
            { end: { gte: end } }
          ]
        },
        {
          AND: [
            { start: { gte: start } },
            { end: { lte: end } }
          ]
        }
      ]
    };
    
    if (excludeId) {
      where.NOT = { id: excludeId };
    }
    
    return this.findMany({ where });
  }

  async getUpcoming(days: number = 7) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    return this.findMany({
      where: {
        start: {
          gte: new Date(),
          lte: endDate
        }
      },
      orderBy: { start: 'asc' }
    });
  }
}

/**
 * Project Repository (special case - scoped to user's accessible projects)
 */
export class ProjectRepository extends BaseRepository<Project> {
  constructor(context: ScopedContext) {
    super(context, 'project');
  }

  async findUserProjects() {
    // Return only projects user is a member of
    const projects = await prisma.project.findMany({
      where: {
        id: { in: this.context.callerProjects },
        isArchived: false
      },
      include: {
        members: {
          where: { userId: this.context.userId }
        }
      }
    });
    
    return projects;
  }

  async findById(projectId: string) {
    if (!this.context.callerProjects.includes(projectId)) {
      throw new ApiError(403, 'Project access denied');
    }
    
    return prisma.project.findUnique({
      where: { id: projectId }
    });
  }

  async updateProject(projectId: string, data: any) {
    if (!this.context.callerProjects.includes(projectId)) {
      throw new ApiError(403, 'Project access denied');
    }
    
    // Only ADMIN/STAFF can update projects
    const role = await Policy.getUserProjectRole(this.context.userId, projectId);
    
    if (!role || !['ADMIN', 'STAFF'].includes(role)) {
      throw new ApiError(403, 'Only ADMIN/STAFF can update projects');
    }
    
    const updated = await prisma.project.update({
      where: { id: projectId },
      data
    });
    
    await this.audit('UPDATE', projectId);
    
    return updated;
  }
}

/**
 * Factory function to create repositories with context
 */
export function createRepositories(context: ScopedContext) {
  return {
    tasks: new TaskRepository(context),
    budget: new BudgetRepository(context),
    procurement: new ProcurementRepository(context),
    contacts: new ContactRepository(context),
    schedule: new ScheduleRepository(context),
    projects: new ProjectRepository(context),
    
    // Generic repositories for other models
    generic: <T>(modelName: keyof typeof prisma) => 
      new ScopedRepository<T>(context, modelName)
  };
}

/**
 * Transaction helper with scoped repositories
 */
export async function withTransaction<T>(
  context: ScopedContext,
  callback: (repos: ReturnType<typeof createRepositories>) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // Create repositories with transaction client
    const repos = createRepositories(context);
    return await callback(repos);
  });
}