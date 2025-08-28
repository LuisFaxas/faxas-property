/**
 * Script to set up default module access for existing users
 * Grants full access to all modules for ADMIN/STAFF users
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MODULES = [
  'TASKS',
  'SCHEDULE',
  'BUDGET',
  'PROCUREMENT',
  'CONTACTS',
  'PROJECTS',
  'PROPOSALS',
  'RFIS',
  'SUBMITTALS',
  'CHANGE_ORDERS',
  'SAFETY',
  'WEATHER',
  'PHOTOS'
];

async function setupModuleAccess() {
  console.log('Setting up module access...');
  
  try {
    // Get all project members
    const projectMembers = await prisma.projectMember.findMany({
      include: {
        user: true,
        project: true
      }
    });
    
    console.log(`Found ${projectMembers.length} project members`);
    
    for (const member of projectMembers) {
      // Determine access level based on role
      const isContractor = member.role === 'CONTRACTOR';
      const canEdit = !isContractor;
      const canUpload = !isContractor;
      const canRequest = true; // Everyone can request
      
      // Create access for each module
      for (const module of MODULES) {
        // Check if access already exists
        const existingAccess = await prisma.userModuleAccess.findFirst({
          where: {
            userId: member.userId,
            projectId: member.projectId,
            module: module
          }
        });
        
        if (!existingAccess) {
          // Special handling for certain modules
          let moduleCanView = true;
          let moduleCanEdit = canEdit;
          
          // Contractors have limited access to certain modules
          if (isContractor) {
            if (['BUDGET', 'PROCUREMENT'].includes(module)) {
              moduleCanView = true; // Can view but with redacted data
              moduleCanEdit = false;
            } else if (['PROPOSALS', 'CHANGE_ORDERS'].includes(module)) {
              moduleCanView = false; // No access at all
              moduleCanEdit = false;
            }
          }
          
          await prisma.userModuleAccess.create({
            data: {
              userId: member.userId,
              projectId: member.projectId,
              module: module,
              canView: moduleCanView,
              canEdit: moduleCanEdit,
              canUpload: moduleCanEdit, // Upload permission follows edit permission
              canRequest: canRequest
            }
          });
          
          console.log(`Added ${module} access for ${member.user.email} in project ${member.project.name}`);
        }
      }
    }
    
    console.log('Module access setup completed successfully');
  } catch (error) {
    console.error('Error setting up module access:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupModuleAccess();