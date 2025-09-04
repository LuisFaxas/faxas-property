-- Performance indexes for frequently queried fields
-- These indexes will significantly improve query performance

-- Task indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON "Task" ("projectId", "status");
CREATE INDEX IF NOT EXISTS idx_tasks_project_assigned ON "Task" ("projectId", "assignedToId");
CREATE INDEX IF NOT EXISTS idx_tasks_project_contact ON "Task" ("projectId", "assignedContactId");
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON "Task" ("dueDate");
CREATE INDEX IF NOT EXISTS idx_tasks_critical_path ON "Task" ("projectId", "isOnCriticalPath") WHERE "isOnCriticalPath" = true;

-- Budget indexes
CREATE INDEX IF NOT EXISTS idx_budget_project_discipline ON "BudgetItem" ("projectId", "discipline");
CREATE INDEX IF NOT EXISTS idx_budget_project_status ON "BudgetItem" ("projectId", "status");
CREATE INDEX IF NOT EXISTS idx_budget_project_category ON "BudgetItem" ("projectId", "category");

-- Schedule indexes
CREATE INDEX IF NOT EXISTS idx_schedule_project_date ON "ScheduleEvent" ("projectId", "start");
CREATE INDEX IF NOT EXISTS idx_schedule_project_type ON "ScheduleEvent" ("projectId", "type");
CREATE INDEX IF NOT EXISTS idx_schedule_project_status ON "ScheduleEvent" ("projectId", "status");

-- Contact indexes
CREATE INDEX IF NOT EXISTS idx_contacts_project_status ON "Contact" ("projectId", "status");
CREATE INDEX IF NOT EXISTS idx_contacts_project_category ON "Contact" ("projectId", "category");
CREATE INDEX IF NOT EXISTS idx_contacts_portal_status ON "Contact" ("projectId", "portalStatus");

-- Procurement indexes
CREATE INDEX IF NOT EXISTS idx_procurement_project_status ON "ProcurementItem" ("projectId", "orderStatus");
CREATE INDEX IF NOT EXISTS idx_procurement_required_date ON "ProcurementItem" ("projectId", "requiredBy");
CREATE INDEX IF NOT EXISTS idx_procurement_supplier ON "ProcurementItem" ("supplierId");

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_user_date ON "AuditLog" ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON "AuditLog" ("entity", "entityId", "createdAt" DESC);

-- User module access indexes
CREATE INDEX IF NOT EXISTS idx_module_access_user ON "UserModuleAccess" ("userId", "projectId");

-- Project member indexes (already have some, but adding more)
CREATE INDEX IF NOT EXISTS idx_project_member_role ON "ProjectMember" ("projectId", "role");

-- Invoice indexes
CREATE INDEX IF NOT EXISTS idx_invoice_project_status ON "Invoice" ("projectId", "status");
CREATE INDEX IF NOT EXISTS idx_invoice_contractor ON "Invoice" ("contractorUserId");

-- RFP and Bidding indexes
CREATE INDEX IF NOT EXISTS idx_rfp_project_status ON "Rfp" ("projectId", "status");
CREATE INDEX IF NOT EXISTS idx_bid_rfp_vendor ON "Bid" ("rfpId", "vendorId");
CREATE INDEX IF NOT EXISTS idx_vendor_project_status ON "Vendor" ("projectId", "status");

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_task_assignment_lookup ON "Task" ("projectId", "assignedToId", "status", "dueDate");
CREATE INDEX IF NOT EXISTS idx_budget_overview ON "BudgetItem" ("projectId", "status", "discipline", "category");
CREATE INDEX IF NOT EXISTS idx_schedule_calendar ON "ScheduleEvent" ("projectId", "start", "end", "status");

-- Analyze tables to update statistics
ANALYZE "Task";
ANALYZE "BudgetItem";
ANALYZE "ScheduleEvent";
ANALYZE "Contact";
ANALYZE "ProcurementItem";
ANALYZE "AuditLog";