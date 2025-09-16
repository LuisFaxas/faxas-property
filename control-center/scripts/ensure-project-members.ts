/**
 * Script to ensure existing projects have proper member associations
 * This is needed for the security hardening to work properly
 */

import { prisma } from '../lib/prisma';

async function ensureProjectMembers() {
  console.log('Ensuring project members...');
  
  try {
    // Get all projects
    const projects = await prisma.project.findMany();
    console.log(`Found ${projects.length} projects`);
    
    // Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users`);
    
    // For each project, ensure admin users are members
    for (const project of projects) {
      for (const user of users) {
        // Check if user is already a member
        const existingMember = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: project.id,
              userId: user.id
            }
          }
        });
        
        if (!existingMember) {
          // Add user as project member with their system role
          await prisma.projectMember.create({
            data: {
              projectId: project.id,
              userId: user.id,
              role: user.role
            }
          });
          console.log(`Added ${user.email} (${user.role}) to project ${project.name}`);
        } else {
          console.log(`${user.email} already member of project ${project.name}`);
        }
      }
    }
    
    console.log('Project members ensured successfully');
  } catch (error) {
    console.error('Error ensuring project members:', error);
  } finally {
    await prisma.$disconnect();
  }
}

ensureProjectMembers();