/**
 * Add database indexes for performance
 * Run with: npx ts-node scripts/add-indexes.ts
 */

import { PrismaClient } from '@prisma/client';
import { log } from '../lib/logger';

const prisma = new PrismaClient();

async function addIndexes() {
  console.log('Adding performance indexes to database...');
  
  const indexes = [
    // Task indexes
    'CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON "Task" ("projectId", "status")',
    'CREATE INDEX IF NOT EXISTS idx_tasks_project_assigned ON "Task" ("projectId", "assignedToId")',
    'CREATE INDEX IF NOT EXISTS idx_tasks_project_contact ON "Task" ("projectId", "assignedContactId")',
    'CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON "Task" ("dueDate")',
    'CREATE INDEX IF NOT EXISTS idx_tasks_critical_path ON "Task" ("projectId", "isOnCriticalPath") WHERE "isOnCriticalPath" = true',

    // Budget indexes
    'CREATE INDEX IF NOT EXISTS idx_budget_project_discipline ON "BudgetItem" ("projectId", "discipline")',
    'CREATE INDEX IF NOT EXISTS idx_budget_project_status ON "BudgetItem" ("projectId", "status")',
    'CREATE INDEX IF NOT EXISTS idx_budget_project_category ON "BudgetItem" ("projectId", "category")',

    // Schedule indexes
    'CREATE INDEX IF NOT EXISTS idx_schedule_project_date ON "ScheduleEvent" ("projectId", "start")',
    'CREATE INDEX IF NOT EXISTS idx_schedule_project_type ON "ScheduleEvent" ("projectId", "type")',
    'CREATE INDEX IF NOT EXISTS idx_schedule_project_status ON "ScheduleEvent" ("projectId", "status")',

    // Contact indexes
    'CREATE INDEX IF NOT EXISTS idx_contacts_project_status ON "Contact" ("projectId", "status")',
    'CREATE INDEX IF NOT EXISTS idx_contacts_project_category ON "Contact" ("projectId", "category")',
    'CREATE INDEX IF NOT EXISTS idx_contacts_portal_status ON "Contact" ("projectId", "portalStatus")',

    // Audit log indexes
    'CREATE INDEX IF NOT EXISTS idx_audit_user_date ON "AuditLog" ("userId", "createdAt" DESC)',
    'CREATE INDEX IF NOT EXISTS idx_audit_entity ON "AuditLog" ("entity", "entityId", "createdAt" DESC)',

    // User module access indexes
    'CREATE INDEX IF NOT EXISTS idx_module_access_user ON "UserModuleAccess" ("userId", "projectId")',

    // Project member indexes
    'CREATE INDEX IF NOT EXISTS idx_project_member_role ON "ProjectMember" ("projectId", "role")',

    // Invoice indexes (if table exists)
    'CREATE INDEX IF NOT EXISTS idx_invoice_project_status ON "Invoice" ("projectId", "status")',
    'CREATE INDEX IF NOT EXISTS idx_invoice_contractor ON "Invoice" ("contractorUserId")',

    // Composite indexes for common queries
    'CREATE INDEX IF NOT EXISTS idx_task_assignment_lookup ON "Task" ("projectId", "assignedToId", "status", "dueDate")',
    'CREATE INDEX IF NOT EXISTS idx_budget_overview ON "BudgetItem" ("projectId", "status", "discipline", "category")',
    'CREATE INDEX IF NOT EXISTS idx_schedule_calendar ON "ScheduleEvent" ("projectId", "start", "end", "status")'
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const index of indexes) {
    try {
      await prisma.$executeRawUnsafe(index);
      console.log(`✓ Created index: ${index.match(/idx_\w+/)?.[0] || 'unknown'}`);
      successCount++;
    } catch (error: any) {
      if (error.message.includes('does not exist')) {
        console.log(`⊘ Skipped (table missing): ${index.match(/idx_\w+/)?.[0] || 'unknown'}`);
      } else if (error.message.includes('already exists')) {
        console.log(`• Already exists: ${index.match(/idx_\w+/)?.[0] || 'unknown'}`);
      } else {
        console.error(`✗ Failed: ${index.match(/idx_\w+/)?.[0] || 'unknown'}:`, error.message);
        errorCount++;
      }
    }
  }
  
  // Analyze tables to update statistics
  const tables = ['Task', 'BudgetItem', 'ScheduleEvent', 'Contact', 'AuditLog'];
  
  console.log('\nUpdating table statistics...');
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ANALYZE "${table}"`);
      console.log(`✓ Analyzed table: ${table}`);
    } catch (error: any) {
      if (!error.message.includes('does not exist')) {
        console.error(`✗ Failed to analyze ${table}:`, error.message);
      }
    }
  }
  
  console.log(`\n✅ Index creation complete: ${successCount} successful, ${errorCount} errors`);
}

addIndexes()
  .catch((error) => {
    console.error('Error adding indexes:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });