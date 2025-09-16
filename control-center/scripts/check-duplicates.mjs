/**
 * Script to check and remove duplicate projects
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndFixDuplicates() {
  console.log('Checking for duplicate projects...');
  
  try {
    // Get all projects
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Found ${projects.length} total projects:`);
    projects.forEach(p => {
      console.log(`- ${p.id}: "${p.name}" (created: ${p.createdAt})`);
    });
    
    // Group by name to find duplicates
    const projectsByName = {};
    projects.forEach(p => {
      if (!projectsByName[p.name]) {
        projectsByName[p.name] = [];
      }
      projectsByName[p.name].push(p);
    });
    
    // Find and handle duplicates
    for (const [name, projectList] of Object.entries(projectsByName)) {
      if (projectList.length > 1) {
        console.log(`\nFound ${projectList.length} projects named "${name}"`);
        
        // Keep the first one (oldest), delete the rest
        const toKeep = projectList[0];
        const toDelete = projectList.slice(1);
        
        console.log(`Keeping: ${toKeep.id} (created: ${toKeep.createdAt})`);
        
        for (const project of toDelete) {
          console.log(`Deleting duplicate: ${project.id} (created: ${project.createdAt})`);
          
          // First, update any related records to point to the keeper
          // Update tasks
          await prisma.task.updateMany({
            where: { projectId: project.id },
            data: { projectId: toKeep.id }
          });
          
          // Update contacts
          await prisma.contact.updateMany({
            where: { projectId: project.id },
            data: { projectId: toKeep.id }
          });
          
          // Update budget items
          await prisma.budgetItem.updateMany({
            where: { projectId: project.id },
            data: { projectId: toKeep.id }
          });
          
          // Update procurement
          await prisma.procurement.updateMany({
            where: { projectId: project.id },
            data: { projectId: toKeep.id }
          });
          
          // Update schedule events
          await prisma.scheduleEvent.updateMany({
            where: { projectId: project.id },
            data: { projectId: toKeep.id }
          });
          
          // Merge project members (avoiding duplicates)
          const duplicateMembers = await prisma.projectMember.findMany({
            where: { projectId: project.id }
          });
          
          for (const member of duplicateMembers) {
            const existingMember = await prisma.projectMember.findUnique({
              where: {
                projectId_userId: {
                  projectId: toKeep.id,
                  userId: member.userId
                }
              }
            });
            
            if (!existingMember) {
              await prisma.projectMember.update({
                where: { id: member.id },
                data: { projectId: toKeep.id }
              });
            } else {
              // Delete duplicate member
              await prisma.projectMember.delete({
                where: { id: member.id }
              });
            }
          }
          
          // Merge module access (avoiding duplicates)
          const duplicateAccess = await prisma.userModuleAccess.findMany({
            where: { projectId: project.id }
          });
          
          for (const access of duplicateAccess) {
            const existingAccess = await prisma.userModuleAccess.findFirst({
              where: {
                userId: access.userId,
                projectId: toKeep.id,
                module: access.module
              }
            });
            
            if (!existingAccess) {
              await prisma.userModuleAccess.update({
                where: {
                  userId_projectId_module: {
                    userId: access.userId,
                    projectId: project.id,
                    module: access.module
                  }
                },
                data: { projectId: toKeep.id }
              });
            } else {
              // Delete duplicate access
              await prisma.userModuleAccess.delete({
                where: {
                  userId_projectId_module: {
                    userId: access.userId,
                    projectId: project.id,
                    module: access.module
                  }
                }
              });
            }
          }
          
          // Now safe to delete the duplicate project
          await prisma.project.delete({
            where: { id: project.id }
          });
          
          console.log(`Deleted duplicate project: ${project.id}`);
        }
      }
    }
    
    // Verify results
    const finalProjects = await prisma.project.findMany();
    console.log(`\nFinal project count: ${finalProjects.length}`);
    finalProjects.forEach(p => {
      console.log(`- ${p.id}: "${p.name}"`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixDuplicates();