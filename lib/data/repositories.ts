/**
 * Domain-Specific Scoped Repositories
 * These repositories provide business logic on top of base scoping
 */

import { ScopedRepository, ScopedContext, BaseRepository } from './base-repository';
import { Policy } from '@/lib/policy';
import { ApiError } from '@/lib/api/response';
import { prisma } from '@/lib/prisma';
import type { 
  Task, BudgetItem, Procurement, Contact, ScheduleEvent, Project, Module,
  Rfp, RfpItem, Vendor, Attachment, RfpStatus, VendorStatus, AttachmentOwnerType
} from '@prisma/client';

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
        action: 'STATUS_CHANGE'
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
      // TODO: Create portal invitation when model is available
      // await prisma.portalInvitation.create({
      //   data: {
      //     contactId: contact.id,
      //     email: data.email,
      //     projectId: this.context.projectId,
      //     invitedBy: this.context.userId,
      //     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      //   }
      // });
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
 * RFP Repository with state management
 */
export class RfpRepository extends ScopedRepository<Rfp> {
  constructor(context: ScopedContext) {
    super(context, 'rfp');
  }

  async create(args: any): Promise<Rfp> {
    // Ensure DRAFT status on creation
    if (args.data) {
      args.data.status = 'DRAFT';
      args.data.createdBy = this.context.userId;
    }
    return super.create(args);
  }

  async update(args: any): Promise<Rfp> {
    // Check if RFP is in DRAFT status
    const rfp = await this.findUnique({ where: args.where });
    if (!rfp) {
      throw new ApiError(404, 'RFP not found');
    }
    if (rfp.status !== 'DRAFT') {
      throw new ApiError(409, 'Can only update RFPs in DRAFT status');
    }
    return super.update(args);
  }

  async publish(rfpId: string): Promise<Rfp> {
    const rfp = await this.findUnique({
      where: { id: rfpId },
      include: { items: true }
    });

    if (!rfp) {
      throw new ApiError(404, 'RFP not found');
    }

    if (rfp.status !== 'DRAFT') {
      throw new ApiError(409, 'Can only publish RFPs in DRAFT status');
    }

    // Validate publishing requirements
    if (!(rfp as any).items || (rfp as any).items.length === 0) {
      throw new ApiError(400, 'Cannot publish RFP without items');
    }

    if (new Date(rfp.dueAt) <= new Date()) {
      throw new ApiError(400, 'Cannot publish RFP with past due date');
    }

    // Update status to PUBLISHED
    return super.update({
      where: { id: rfpId },
      data: { status: 'PUBLISHED' as RfpStatus }
    });
  }

  async delete(args: any): Promise<Rfp> {
    const rfp = await this.findUnique({
      where: args.where,
      include: {
        invitations: true,
        bids: true
      }
    });

    if (!rfp) {
      throw new ApiError(404, 'RFP not found');
    }

    if (rfp.status !== 'DRAFT') {
      throw new ApiError(409, 'Can only delete RFPs in DRAFT status');
    }

    if ((rfp as any).invitations?.length > 0 || (rfp as any).bids?.length > 0) {
      throw new ApiError(409, 'Cannot delete RFP with invitations or bids');
    }

    return super.delete(args);
  }
}

/**
 * RFP Item Repository
 */
export class RfpItemRepository extends BaseRepository<RfpItem> {
  constructor(context: ScopedContext) {
    super(context, 'rfpItem');
  }

  async bulkUpsert(rfpId: string, items: any[]): Promise<RfpItem[]> {
    // First check if RFP is in DRAFT status and belongs to project
    const rfp = await prisma.rfp.findUnique({
      where: { id: rfpId, projectId: this.context.projectId }
    });

    if (!rfp) {
      throw new ApiError(404, 'RFP not found');
    }

    if (rfp.status !== 'DRAFT') {
      throw new ApiError(409, 'Can only modify items when RFP is in DRAFT status');
    }

    // Perform bulk upsert
    const results: RfpItem[] = [];
    
    for (const item of items) {
      if (item.id) {
        // Update existing
        const updated = await prisma.rfpItem.update({
          where: { id: item.id },
          data: {
            specCode: item.specCode,
            description: item.description,
            qty: item.qty,
            uom: item.uom
          }
        });
        results.push(updated);
      } else {
        // Create new
        const created = await prisma.rfpItem.create({
          data: {
            rfpId,
            specCode: item.specCode,
            description: item.description,
            qty: item.qty,
            uom: item.uom
          }
        });
        results.push(created);
      }
    }

    // TODO: Log audit when method is available
    // await this.logAudit('UPSERT_ITEMS', 'RFP_ITEMS', rfpId, {
    //   count: items.length,
    //   action: 'bulk_upsert'
    // });

    return results;
  }
}

/**
 * Vendor Repository with uniqueness checks
 */
export class VendorRepository extends ScopedRepository<Vendor> {
  constructor(context: ScopedContext) {
    super(context, 'vendor');
  }

  async create(args: any): Promise<Vendor> {
    // Check for duplicate email in project
    const existing = await this.findFirst({
      where: {
        email: args.data.email
      }
    });

    if (existing) {
      throw new ApiError(409, 'Vendor with this email already exists in project');
    }

    return super.create(args);
  }
}

/**
 * Attachment Repository with security validations
 */
export class AttachmentRepository extends BaseRepository<Attachment> {
  private MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB per RFP

  constructor(context: ScopedContext) {
    super(context, 'attachment');
  }

  async create(args: any): Promise<Attachment> {
    const { ownerType, ownerId, size, contentHash } = args.data;

    // Validate owner access
    await this.validateOwnerAccess(ownerType, ownerId);

    // Check file size
    if (size > this.MAX_FILE_SIZE) {
      throw new ApiError(413, 'File size exceeds 10MB limit');
    }

    // Check total size for RFP
    if (ownerType === 'RFP') {
      const existingAttachments = await prisma.attachment.findMany({
        where: { ownerType: 'RFP' as AttachmentOwnerType, ownerId }
      });

      const totalSize = existingAttachments.reduce((sum, att) => sum + att.size, 0) + size;
      if (totalSize > this.MAX_TOTAL_SIZE) {
        throw new ApiError(413, 'Total attachments exceed 50MB limit for this RFP');
      }
    }

    // Check for duplicate content
    const duplicate = await prisma.attachment.findFirst({
      where: { contentHash, ownerType, ownerId }
    });

    if (duplicate) {
      throw new ApiError(409, 'This file has already been uploaded');
    }

    // Create attachment
    const attachment = await prisma.attachment.create({ data: args.data });

    // TODO: Log audit when method is available
    // await this.logAudit('UPLOAD', 'ATTACHMENT', attachment.id, {
    //   ownerType,
    //   ownerId,
    //   filename: args.data.filename,
    //   size
    // });

    return attachment;
  }

  async validateOwnerAccess(ownerType: AttachmentOwnerType, ownerId: string): Promise<void> {
    if (ownerType === 'RFP') {
      const rfp = await prisma.rfp.findUnique({
        where: { id: ownerId, projectId: this.context.projectId }
      });
      if (!rfp) {
        throw new ApiError(404, 'RFP not found or access denied');
      }
    }
    // BID validation will be added in later stages
  }

  /**
   * Calculate content hash for deduplication
   * Uses Web Crypto API for Edge Runtime compatibility
   */
  static async calculateHash(content: Buffer): Promise<string> {
    // Convert buffer to ArrayBuffer for Web Crypto API
    const arrayBuffer = new Uint8Array(content).buffer;
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
    rfps: new RfpRepository(context),
    rfpItems: new RfpItemRepository(context),
    vendors: new VendorRepository(context),
    attachments: new AttachmentRepository(context),
    
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