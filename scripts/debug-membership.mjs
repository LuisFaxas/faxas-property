/**
 * Script to debug project membership issues
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugMembership() {
  console.log('Debugging project membership...\n');
  
  const targetProjectId = 'cmevt3i4m00004kp0htf4yusb';
  
  try {
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: targetProjectId }
    });
    
    if (!project) {
      console.log(`❌ Project with ID ${targetProjectId} does not exist!`);
      
      // List all projects
      const allProjects = await prisma.project.findMany();
      console.log('\nExisting projects:');
      allProjects.forEach(p => {
        console.log(`  - ${p.id}: ${p.name}`);
      });
    } else {
      console.log(`✓ Found project: ${project.name}`);
      
      // Check members
      const members = await prisma.projectMember.findMany({
        where: { projectId: targetProjectId },
        include: { user: true }
      });
      
      console.log(`\nProject members (${members.length}):`);
      members.forEach(m => {
        console.log(`  - ${m.user.email} (${m.role})`);
      });
      
      // Check all users to see who's missing
      const allUsers = await prisma.user.findMany();
      console.log(`\nAll users in system (${allUsers.length}):`);
      allUsers.forEach(u => {
        const isMember = members.some(m => m.userId === u.id);
        console.log(`  - ${u.email} (${u.role}) ${isMember ? '✓ member' : '❌ NOT member'}`);
      });
      
      // Check module access
      const moduleAccess = await prisma.userModuleAccess.findMany({
        where: { projectId: targetProjectId }
      });
      console.log(`\nModule access records for this project: ${moduleAccess.length}`);
    }
    
    // Also check what the current projectId is
    const currentProject = await prisma.project.findFirst();
    if (currentProject) {
      console.log(`\n📍 Current default project: ${currentProject.id} (${currentProject.name})`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugMembership();