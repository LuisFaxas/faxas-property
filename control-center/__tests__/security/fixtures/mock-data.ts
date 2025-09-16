/**
 * Mock Data Fixtures for Security Tests
 */

import { Role, Module } from '@prisma/client';

// Sample tasks for testing
export const mockTasks = [
  {
    id: 'task-1',
    title: 'Task in Project 1',
    projectId: 'project-1',
    status: 'TODO',
    priority: 'MEDIUM',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'task-2',
    title: 'Task in Project 2',
    projectId: 'project-2',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Sample procurement items
export const mockProcurementItems = [
  {
    id: 'procurement-1',
    item: 'Construction Materials',
    projectId: 'project-1',
    category: 'MATERIALS',
    status: 'PENDING',
    priority: 'HIGH',
    quantity: 100,
    unitCost: 50,
    totalCost: 5000,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'procurement-2',
    item: 'Safety Equipment',
    projectId: 'project-2',
    category: 'EQUIPMENT',
    status: 'APPROVED',
    priority: 'MEDIUM',
    quantity: 10,
    unitCost: 100,
    totalCost: 1000,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Sample contacts
export const mockContacts = [
  {
    id: 'contact-1',
    name: 'John Contractor',
    email: 'john@contractor.com',
    phone: '555-0001',
    projectId: 'project-1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'contact-2',
    name: 'Jane Supplier',
    email: 'jane@supplier.com',
    phone: '555-0002',
    projectId: 'project-2',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Sample schedule events
export const mockScheduleEvents = [
  {
    id: 'event-1',
    title: 'Foundation Pour',
    projectId: 'project-1',
    start: new Date('2024-01-15'),
    end: new Date('2024-01-16'),
    type: 'MILESTONE',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'event-2',
    title: 'Inspection',
    projectId: 'project-2',
    start: new Date('2024-01-20'),
    end: new Date('2024-01-20'),
    type: 'INSPECTION',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Module access configurations for different roles
export const moduleAccessConfigs = {
  admin: Object.values(Module).map(module => ({
    module,
    canView: true,
    canEdit: true,
    canUpload: true,
    canRequest: true
  })),
  staff: Object.values(Module).map(module => ({
    module,
    canView: true,
    canEdit: true,
    canUpload: true,
    canRequest: true
  })),
  contractor: Object.values(Module).map(module => {
    // Contractors have limited access to certain modules
    const restrictedModules = ['BUDGET', 'PROCUREMENT'];
    const noAccessModules = ['PROPOSALS', 'CHANGE_ORDERS'];
    
    if (noAccessModules.includes(module)) {
      return {
        module,
        canView: false,
        canEdit: false,
        canUpload: false,
        canRequest: false
      };
    }
    
    if (restrictedModules.includes(module)) {
      return {
        module,
        canView: true,  // Can view but with redacted data
        canEdit: false,
        canUpload: false,
        canRequest: true
      };
    }
    
    return {
      module,
      canView: true,
      canEdit: false,
      canUpload: false,
      canRequest: true
    };
  }),
  viewer: Object.values(Module).map(module => ({
    module,
    canView: true,
    canEdit: false,
    canUpload: false,
    canRequest: false
  }))
};

// Invalid token payloads for testing
export const invalidTokenPayloads = [
  {
    name: 'wrong audience',
    payload: { aud: 'wrong-project' },
    expectedError: 'Invalid token audience'
  },
  {
    name: 'wrong issuer',
    payload: { iss: 'https://securetoken.google.com/wrong-project' },
    expectedError: 'Invalid token issuer'
  },
  {
    name: 'empty subject',
    payload: { sub: '' },
    expectedError: 'Invalid token subject'
  },
  {
    name: 'future auth_time',
    payload: { auth_time: Math.floor(Date.now() / 1000) + 3600 },
    expectedError: 'Invalid auth time'
  },
  {
    name: 'expired token',
    payload: { exp: Math.floor(Date.now() / 1000) - 3600 },
    expectedError: 'Token expired'
  }
];

// SQL injection test payloads
export const sqlInjectionPayloads = [
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "admin'--",
  "1; DELETE FROM projects WHERE 1=1; --",
  "' UNION SELECT * FROM users --"
];

// XSS test payloads
export const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror="alert(\'XSS\')" />',
  'javascript:alert("XSS")',
  '<svg onload="alert(\'XSS\')" />',
  '<iframe src="javascript:alert(\'XSS\')"></iframe>'
];

// Large payload for body size testing
export function generateLargePayload(sizeInMB: number = 1): string {
  const sizeInBytes = sizeInMB * 1024 * 1024;
  return 'x'.repeat(sizeInBytes);
}