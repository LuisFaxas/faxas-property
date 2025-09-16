// Core User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'CONTRACTOR' | 'VIEWER';
  contactId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  address?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  startDate?: Date;
  endDate?: Date;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

// Task Types
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date;
  assignedToId?: string;
  assignedContactId?: string;
  completedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  assignedUser?: User;
  assignedContact?: Contact;
  project?: Project;
}

// Contact Types
export interface Contact {
  id: string;
  projectId: string;
  name: string;
  company?: string;
  role?: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  hasPortalAccess: boolean;
  portalAccessSentAt?: Date;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  project?: Project;
}

// Schedule Types
export interface Schedule {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  assignedContactId?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  assignedContact?: Contact;
  project?: Project;
}

// Budget Types
export interface BudgetItem {
  id: string;
  projectId: string;
  category: string;
  description: string;
  estimatedCost: number;
  actualCost?: number;
  paidAmount?: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  vendorId?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  vendor?: Contact;
  project?: Project;
}

// Procurement Types
export interface ProcurementItem {
  id: string;
  projectId: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  vendorId?: string;
  status: 'NEEDED' | 'ORDERED' | 'DELIVERED' | 'INSTALLED' | 'CANCELLED';
  orderDate?: Date;
  deliveryDate?: Date;
  installDate?: Date;
  category?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  vendor?: Contact;
  project?: Project;
}

// Plan Types
export interface Plan {
  id: string;
  projectId: string;
  title: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  version?: string;
  category?: string;
  description?: string;
  uploadedBy: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  uploadedByUser?: User;
}

// Document Types
export interface Document {
  id: string;
  projectId: string;
  title: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  category?: string;
  description?: string;
  uploadedBy: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  uploadedByUser?: User;
}

// Risk Types
export interface Risk {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  category: 'SAFETY' | 'FINANCIAL' | 'SCHEDULE' | 'QUALITY' | 'ENVIRONMENTAL' | 'OTHER';
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'IDENTIFIED' | 'MITIGATING' | 'RESOLVED' | 'ACCEPTED';
  mitigationStrategy?: string;
  owner?: string;
  identifiedDate: Date;
  resolvedDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  ownerUser?: User;
}

// Bid Types
export interface Bid {
  id: string;
  rfpId: string;
  contractorId: string;
  amount: number;
  timeline?: string;
  notes?: string;
  attachments?: string[];
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  rfp?: RFP;
  contractor?: User;
  reviewer?: User;
}

// RFP Types
export interface RFP {
  id: string;
  projectId: string;
  title: string;
  description: string;
  scope?: string;
  requirements?: string[];
  deadline: Date;
  budget?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'AWARDED' | 'CANCELLED';
  publishedAt?: Date;
  closedAt?: Date;
  awardedTo?: string;
  awardedAt?: Date;
  attachments?: string[];
  invitedContractors?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  awardedContractor?: User;
  bids?: Bid[];
}

// Module Permission Types
export interface ModulePermission {
  id: string;
  userId: string;
  module: 'TASKS' | 'SCHEDULE' | 'BUDGET' | 'PROCUREMENT' | 'DOCUMENTS' | 'PLANS' | 'RISKS' | 'BIDS';
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

// Webhook Event Types
export interface WebhookEvent {
  id: string;
  event: string;
  payload: any;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  error?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

// Form Types
export interface TaskFormData {
  title: string;
  description?: string;
  status: Task['status'];
  priority: Task['priority'];
  dueDate?: string;
  assignedToId?: string;
  assignedContactId?: string;
}

export interface ContactFormData {
  name: string;
  company?: string;
  role?: string;
  email?: string;
  phone?: string;
  specialties?: string[];
}

export interface ScheduleFormData {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  assignedContactId?: string;
  status: Schedule['status'];
}

export interface BudgetFormData {
  category: string;
  description: string;
  estimatedCost: number;
  actualCost?: number;
  paidAmount?: number;
  status: BudgetItem['status'];
  vendorId?: string;
  notes?: string;
}

export interface ProcurementFormData {
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vendorId?: string;
  status: ProcurementItem['status'];
  orderDate?: string;
  deliveryDate?: string;
  installDate?: string;
  category?: string;
  notes?: string;
}

export interface RiskFormData {
  title: string;
  description?: string;
  category: Risk['category'];
  probability: Risk['probability'];
  impact: Risk['impact'];
  status: Risk['status'];
  mitigationStrategy?: string;
  owner?: string;
}

// Chart/Analytics Types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  blocked: number;
}

export interface BudgetStats {
  totalEstimated: number;
  totalActual: number;
  totalPaid: number;
  remaining: number;
  overBudgetItems: number;
}

// Select Option Types
export interface SelectOption {
  value: string;
  label: string;
}

// Table Column Types
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
}

// Filter Types
export interface FilterOptions {
  status?: string[];
  priority?: string[];
  category?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}