/**
 * Script to verify project access is set up correctly
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAccess() {
  console.log('Verifying project access...\n');
  
  try {
    // Check projects
    const projects = await prisma.project.findMany();
    console.log(`Projects (${projects.length}):`);
    projects.forEach(p => console.log(`  - ${p.id}: ${p.name}`));
    
    // Check users
    const users = await prisma.user.findMany();
    console.log(`\nUsers (${users.length}):`);
    users.forEach(u => console.log(`  - ${u.id}: ${u.email} (${u.role})`));
    
    // Check project members
    const members = await prisma.projectMember.findMany({
      include: {
        user: true,
        project: true
      }
    });
    console.log(`\nProject Members (${members.length}):`);
    members.forEach(m => console.log(`  - ${m.user.email} → ${m.project.name} (${m.role})`));
    
    // Check module access
    const access = await prisma.userModuleAccess.findMany({
      include: {
        project: true
      }
    });
    console.log(`\nModule Access Records (${access.length}):`);
    
    // Group by user and project for better display
    const accessByUserProject = {};
    access.forEach(a => {
      const key = `${a.userId}-${a.projectId}`;
      if (!accessByUserProject[key]) {
        accessByUserProject[key] = {
          userId: a.userId,
          projectName: a.project.name,
          modules: []
        };
      }
      accessByUserProject[key].modules.push({
        module: a.module,
        canView: a.canView,
        canEdit: a.canEdit
      });
    });
    
    // Find user emails for display
    for (const key of Object.keys(accessByUserProject)) {
      const data = accessByUserProject[key];
      const user = users.find(u => u.id === data.userId);
      if (user) {
        console.log(`\n  ${user.email} in ${data.projectName}:`);
        data.modules.forEach(m => {
          const permissions = [];
          if (m.canView) permissions.push('View');
          if (m.canEdit) permissions.push('Edit');
          console.log(`    - ${m.module}: ${permissions.join(', ')}`);
        });
      }
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`✓ ${projects.length} project(s)`);
    console.log(`✓ ${users.length} user(s)`);
    console.log(`✓ ${members.length} project member relationship(s)`);
    console.log(`✓ ${access.length} module access record(s)`);
    
    // Check for issues
    const issues = [];
    
    // Check if any users have no project access
    for (const user of users) {
      const userMembers = members.filter(m => m.user.id === user.id);
      if (userMembers.length === 0) {
        issues.push(`User ${user.email} has no project memberships`);
      }
    }
    
    // Check if any project members have no module access
    for (const member of members) {
      const memberAccess = access.filter(a => 
        a.userId === member.userId && a.projectId === member.projectId
      );
      if (memberAccess.length === 0) {
        issues.push(`Member ${member.user.email} in project ${member.project.name} has no module access`);
      }
    }
    
    if (issues.length > 0) {
      console.log('\n⚠ ISSUES FOUND:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('\n✅ All access configurations look correct!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAccess();