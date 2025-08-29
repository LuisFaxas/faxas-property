/**
 * Script to create or update a user in the database
 * Usage: npx ts-node scripts/create-user.ts <uid> <email> <role>
 * Example: npx ts-node scripts/create-user.ts abc123 admin@example.com ADMIN
 */

import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: npx ts-node scripts/create-user.ts <uid> <email> <role>');
    console.error('Roles: ADMIN, STAFF, CONTRACTOR, VIEWER');
    process.exit(1);
  }
  
  const [uid, email, roleStr] = args;
  
  // Validate role
  if (!['ADMIN', 'STAFF', 'CONTRACTOR', 'VIEWER'].includes(roleStr)) {
    console.error('Invalid role. Must be one of: ADMIN, STAFF, CONTRACTOR, VIEWER');
    process.exit(1);
  }
  
  const role = roleStr as Role;
  
  try {
    // Create or update user
    const user = await prisma.user.upsert({
      where: { id: uid },
      update: { 
        email,
        role 
      },
      create: {
        id: uid,
        email,
        role
      }
    });
    
    console.log('✅ User created/updated:', user);
    
    // Get the project
    const project = await prisma.project.findFirst({
      where: { id: 'miami-duplex' }
    });
    
    if (project) {
      // Add user as project member
      const member = await prisma.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId: uid
          }
        },
        update: {
          role
        },
        create: {
          projectId: project.id,
          userId: uid,
          role
        }
      });
      
      console.log('✅ Added as project member:', member);
      
      // Grant module access
      const modules = [
        'TASKS', 'SCHEDULE', 'BUDGET', 'PROCUREMENT', 
        'CONTACTS', 'PROJECTS', 'BIDDING'
      ];
      
      for (const module of modules) {
        await prisma.userModuleAccess.upsert({
          where: {
            userId_projectId_module: {
              userId: uid,
              projectId: project.id,
              module: module as any
            }
          },
          update: {
            canView: true,
            canEdit: role !== 'VIEWER',
            canUpload: role !== 'VIEWER',
            canRequest: role !== 'VIEWER'
          },
          create: {
            userId: uid,
            projectId: project.id,
            module: module as any,
            canView: true,
            canEdit: role !== 'VIEWER',
            canUpload: role !== 'VIEWER',
            canRequest: role !== 'VIEWER'
          }
        });
      }
      
      console.log('✅ Module access granted for all modules');
    } else {
      console.warn('⚠️ No project found - run seed first');
    }
    
  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });