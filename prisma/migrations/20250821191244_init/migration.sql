-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'STAFF', 'CONTRACTOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."ScheduleType" AS ENUM ('CALL', 'MEETING', 'SITE_VISIT', 'WORK', 'EMAIL_FOLLOWUP');

-- CreateEnum
CREATE TYPE "public"."ScheduleStatus" AS ENUM ('REQUESTED', 'PLANNED', 'DONE', 'CANCELED', 'RESCHEDULE_NEEDED');

-- CreateEnum
CREATE TYPE "public"."BudgetStatus" AS ENUM ('BUDGETED', 'COMMITTED', 'PAID');

-- CreateEnum
CREATE TYPE "public"."ProcurementStatus" AS ENUM ('QUOTED', 'ORDERED', 'DELIVERED', 'INSTALLED');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('RECEIVED', 'UNDER_REVIEW', 'APPROVED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."Module" AS ENUM ('TASKS', 'SCHEDULE', 'PLANS', 'UPLOADS', 'INVOICES', 'PROCUREMENT_READ', 'DOCS_READ');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contact" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "specialty" TEXT,
    "category" TEXT NOT NULL,
    "referredById" TEXT,
    "status" TEXT NOT NULL,
    "emails" TEXT[],
    "phones" TEXT[],
    "notes" TEXT,
    "userId" TEXT,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Task" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "assignedToId" TEXT,
    "relatedContactIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScheduleEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "public"."ScheduleType" NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3),
    "status" "public"."ScheduleStatus" NOT NULL,
    "googleEventId" TEXT,
    "replied" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "requesterUserId" TEXT,
    "relatedContactIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BudgetItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "unit" TEXT,
    "qty" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estUnitCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "committedTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paidToDate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vendorContactId" TEXT,
    "status" "public"."BudgetStatus" NOT NULL,
    "variance" DECIMAL(6,4) NOT NULL DEFAULT 0,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Procurement" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "materialItem" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "discipline" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "requiredBy" TIMESTAMP(3) NOT NULL,
    "leadTimeDays" INTEGER NOT NULL,
    "supplierId" TEXT,
    "orderStatus" "public"."ProcurementStatus" NOT NULL,
    "eta" TIMESTAMP(3),
    "notes" TEXT,
    "budgetItemId" TEXT,

    CONSTRAINT "Procurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlanFile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "dateIssued" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "sharedWithIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Decision" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "options" TEXT[],
    "decision" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "rationale" TEXT,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Risk" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "probability" DECIMAL(6,4) NOT NULL,
    "impactCost" DECIMAL(12,2),
    "impactDays" INTEGER,
    "impactQuality" INTEGER,
    "score" DECIMAL(12,4) NOT NULL,
    "mitigation" TEXT,
    "trigger" TEXT,
    "status" TEXT NOT NULL,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Meeting" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "participantContactIds" TEXT[],
    "type" TEXT NOT NULL,
    "agenda" TEXT,
    "notes" TEXT,
    "decisionIds" TEXT[],
    "actionTaskIds" TEXT[],
    "nextMeetingDate" TIMESTAMP(3),

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractorUserId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "budgetItemId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "tax" DECIMAL(12,2),
    "status" "public"."InvoiceStatus" NOT NULL,
    "filePath" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserModuleAccess" (
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "module" "public"."Module" NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canUpload" BOOLEAN NOT NULL DEFAULT false,
    "canRequest" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserModuleAccess_pkey" PRIMARY KEY ("userId","projectId","module")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "meta" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Task_projectId_status_dueDate_idx" ON "public"."Task"("projectId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "ScheduleEvent_projectId_start_idx" ON "public"."ScheduleEvent"("projectId", "start" DESC);

-- CreateIndex
CREATE INDEX "BudgetItem_projectId_discipline_status_idx" ON "public"."BudgetItem"("projectId", "discipline", "status");

-- CreateIndex
CREATE INDEX "Procurement_projectId_requiredBy_orderStatus_idx" ON "public"."Procurement"("projectId", "requiredBy", "orderStatus");

-- CreateIndex
CREATE INDEX "Risk_projectId_status_score_idx" ON "public"."Risk"("projectId", "status", "score" DESC);

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleEvent" ADD CONSTRAINT "ScheduleEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BudgetItem" ADD CONSTRAINT "BudgetItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Procurement" ADD CONSTRAINT "Procurement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlanFile" ADD CONSTRAINT "PlanFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Decision" ADD CONSTRAINT "Decision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Risk" ADD CONSTRAINT "Risk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Meeting" ADD CONSTRAINT "Meeting_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserModuleAccess" ADD CONSTRAINT "UserModuleAccess_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
